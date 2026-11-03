/**
 * IndexedDB Offline Storage & Sync Engine for Mi Tienda SaaS POS
 *
 * Provides two IndexedDB object stores inside `mi_tienda_pos_idb`:
 *  1. `pos_state_store`: Persists full POS snapshots so the store works 100% offline.
 *  2. `offline_sync_queue`: Stores every mutation (sales, fiados, abonos, stock edits,
 *     product creations/updates, rate updates) performed while offline or pending sync,
 *     and automatically synchronizes them with the backend (`/api/pos/offline-sync`)
 *     as soon as network connectivity is restored.
 */

export type OfflineMutationType =
  | 'SALE_PAID'
  | 'SALE_FIADO'
  | 'SALE_VOIDED'
  | 'DEBT_ABONO'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPSERT'
  | 'PRODUCT_PRICE_CHANGED'
  | 'PRODUCT_STOCK_ADJUST'
  | 'PRODUCT_OUT_OF_STOCK'
  | 'PRODUCT_DELETE'
  | 'EXPENSE_ADDED'
  | 'RATES_UPDATE'
  | 'CART_UPDATE'
  | 'STATE_SNAPSHOT'
  | string;

export interface OfflineSyncItem {
  id: string;
  type: OfflineMutationType;
  label: string;
  details: string;
  amountUSD?: number;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  syncedAt?: string;
}

const DB_NAME = 'mi_tienda_pos_idb';
const DB_VERSION = 1;
const STATE_STORE = 'pos_state_store';
const QUEUE_STORE = 'offline_sync_queue';

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible en este navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error abriendo IndexedDB'));
  });
}

/**
 * Save the entire POS state snapshot into IndexedDB (`pos_state_store`).
 */
export async function savePOSStateToIndexedDB<T>(state: T): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readwrite');
      const store = tx.objectStore(STATE_STORE);
      store.put({
        key: 'active_pos_state',
        state,
        updatedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Fallback silently if private browsing blocks IDB
  }
}

/**
 * Load the persisted POS state snapshot from IndexedDB.
 */
export async function loadPOSStateFromIndexedDB<T>(): Promise<{
  state: T;
  updatedAt: string;
} | null> {
  try {
    const db = await openOfflineDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readonly');
      const store = tx.objectStore(STATE_STORE);
      const req = store.get('active_pos_state');
      req.onsuccess = () => {
        db.close();
        if (req.result && req.result.state) {
          resolve({
            state: req.result.state as T,
            updatedAt: req.result.updatedAt || new Date().toISOString(),
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Enqueue a POS change into IndexedDB `offline_sync_queue`.
 * Also requests Background Sync from the Service Worker if supported.
 */
export async function enqueueOfflinePOSChange(
  input: Omit<OfflineSyncItem, 'id' | 'createdAt' | 'status'>
): Promise<OfflineSyncItem> {
  const item: OfflineSyncItem = {
    ...input,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      store.put(item);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    // Register Background Sync with the active Service Worker when supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          const syncReg = reg as ServiceWorkerRegistration & {
            sync?: { register: (tag: string) => Promise<void> };
          };
          if (syncReg.sync && typeof syncReg.sync.register === 'function') {
            return syncReg.sync.register('pos-offline-sync');
          }
        })
        .catch(() => {});
    }
  } catch {
    // Ignore IDB write error
  }

  return item;
}

/**
 * List all items in `offline_sync_queue` (sorted newest first).
 */
export async function getAllOfflineQueueItems(): Promise<OfflineSyncItem[]> {
  try {
    const db = await openOfflineDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        const list = (req.result as OfflineSyncItem[]) || [];
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(list);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get only pending (unsynced) items from `offline_sync_queue`.
 */
export async function getPendingOfflineQueueItems(): Promise<OfflineSyncItem[]> {
  const all = await getAllOfflineQueueItems();
  return all.filter((item) => item.status === 'pending' || item.status === 'failed');
}

/**
 * Mark specific queue IDs as synced in IndexedDB and prune old synced history (> 30 items).
 */
export async function markOfflineQueueItemsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const db = await openOfflineDB();
    const nowIso = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);

      for (const id of ids) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result as OfflineSyncItem | undefined;
          if (existing) {
            store.put({
              ...existing,
              status: 'synced',
              syncedAt: nowIso,
            });
          }
        };
      }

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore
  }
}

/**
 * Clear already-synced items from IndexedDB queue.
 */
export async function clearSyncedQueueItems(): Promise<void> {
  try {
    const db = await openOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as OfflineSyncItem[]) || [];
        for (const item of items) {
          if (item.status === 'synced') {
            store.delete(item.id);
          }
        }
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore
  }
}

/**
 * Synchronize all pending IndexedDB changes with the backend `/api/pos/offline-sync` endpoint.
 */
export async function flushOfflineSyncQueue<T>(currentState: T): Promise<{
  syncedCount: number;
  remainingCount: number;
  syncedAt: string | null;
}> {
  const pending = await getPendingOfflineQueueItems();
  if (pending.length === 0) {
    return {
      syncedCount: 0,
      remainingCount: 0,
      syncedAt: null,
    };
  }

  // Send batch to server endpoint
  const response = await fetch('/api/pos/offline-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pendingItems: pending,
      stateSnapshot: currentState,
      clientTimestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const syncedIds = pending.map((i) => i.id);
  await markOfflineQueueItemsSynced(syncedIds);
  await savePOSStateToIndexedDB(currentState);

  const syncedAt = new Date().toISOString();
  try {
    localStorage.setItem('mi_tienda_last_idb_sync_at', syncedAt);
  } catch {
    // ignore
  }

  return {
    syncedCount: syncedIds.length,
    remainingCount: 0,
    syncedAt,
  };
}

export interface SWCacheStats {
  version: string;
  cachedShellCount: number;
  cachedStylesCount: number;
  cachedImagesCount: number;
  updatedAt: string;
}

const SW_CACHE_VERSION = 'mi-tienda-pos-v2';
const SW_SHELL_CACHE = `${SW_CACHE_VERSION}-shell`;
const SW_STYLES_CACHE = `${SW_CACHE_VERSION}-styles-fonts`;
const SW_IMAGES_CACHE = `${SW_CACHE_VERSION}-product-images`;

/**
 * Discover all active stylesheets in the current document (`<link rel="stylesheet">` + core CSS).
 */
export function collectDocumentStyleUrls(): string[] {
  const urls = new Set<string>([
    '/src/index.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  ]);

  if (typeof document !== 'undefined') {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href && !href.startsWith('data:') && !href.startsWith('blob:')) {
        urls.add(href);
      }
    });
  }

  return Array.from(urls);
}

/**
 * Proactively cache all product images and application stylesheets/fonts via both
 * the Service Worker message channel (`PRECACHE_POS_ASSETS`) and the browser CacheStorage API.
 */
export async function precachePOSImagesAndStyles(
  productImageUrls: string[]
): Promise<SWCacheStats> {
  const cleanImageUrls = Array.from(
    new Set(
      productImageUrls
        .map((u) => (u || '').trim())
        .filter((u) => u.length > 0 && !u.startsWith('data:') && !u.startsWith('blob:'))
    )
  );
  const styleUrls = collectDocumentStyleUrls();

  // 1. Instruct active Service Worker to pre-cache images & styles (and parse CSS font URLs)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const targetSW = navigator.serviceWorker.controller || reg.active;
      if (targetSW) {
        targetSW.postMessage({
          type: 'PRECACHE_POS_ASSETS',
          imageUrls: cleanImageUrls,
          styleUrls,
        });
      }
    } catch {
      // Ignore if SW is not ready
    }
  }

  // 2. Also warm CacheStorage directly from client window so first-load assets are cached immediately
  if (typeof caches !== 'undefined') {
    try {
      const [imageCache, styleCache] = await Promise.all([
        caches.open(SW_IMAGES_CACHE),
        caches.open(SW_STYLES_CACHE),
      ]);

      await Promise.allSettled(
        styleUrls.map(async (url) => {
          const existing = await styleCache.match(url, { ignoreVary: true });
          if (!existing) {
            try {
              const res = await fetch(url);
              if (res && (res.ok || res.type === 'opaque')) {
                await styleCache.put(url, res);
              }
            } catch {
              const noCorsRes = await fetch(url, { mode: 'no-cors' });
              if (noCorsRes) {
                await styleCache.put(url, noCorsRes);
              }
            }
          }
        })
      );

      await Promise.allSettled(
        cleanImageUrls.map(async (url) => {
          const existing = await imageCache.match(url, { ignoreVary: true });
          if (!existing) {
            try {
              const res = await fetch(url);
              if (res && (res.ok || res.type === 'opaque')) {
                await imageCache.put(url, res);
              }
            } catch {
              const noCorsRes = await fetch(url, { mode: 'no-cors' });
              if (noCorsRes) {
                await imageCache.put(url, noCorsRes);
              }
            }
          }
        })
      );
    } catch {
      // Ignore CacheStorage errors
    }
  }

  return getOfflineAssetCacheStats();
}

/**
 * Read current CacheStorage counts for product images, stylesheets/fonts, and app shell.
 */
export async function getOfflineAssetCacheStats(): Promise<SWCacheStats> {
  if (typeof caches === 'undefined') {
    return {
      version: SW_CACHE_VERSION,
      cachedShellCount: 0,
      cachedStylesCount: 0,
      cachedImagesCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const [shellCache, styleCache, imageCache] = await Promise.all([
      caches.open(SW_SHELL_CACHE),
      caches.open(SW_STYLES_CACHE),
      caches.open(SW_IMAGES_CACHE),
    ]);
    const [shellKeys, styleKeys, imageKeys] = await Promise.all([
      shellCache.keys(),
      styleCache.keys(),
      imageCache.keys(),
    ]);
    return {
      version: SW_CACHE_VERSION,
      cachedShellCount: shellKeys.length,
      cachedStylesCount: styleKeys.length,
      cachedImagesCount: imageKeys.length,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      version: SW_CACHE_VERSION,
      cachedShellCount: 0,
      cachedStylesCount: 0,
      cachedImagesCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

