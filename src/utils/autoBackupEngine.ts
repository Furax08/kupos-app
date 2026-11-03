/**
 * Automatic JSON Backup & Version History Engine (Every 10 Transactions)
 *
 * Automatically saves a full JSON backup snapshot in the browser (IndexedDB + localStorage metadata)
 * every time 10 transactions are completed, and maintains a downloadable & restorable version history.
 */

export interface AutoBackupVersionMeta {
  id: string;
  versionNumber: number;
  triggerType: 'auto_10_tx' | 'manual';
  createdAt: string;
  storeId: string;
  storeName: string;
  transactionCountAtBackup: number;
  txMilestone: number;
  lastSaleSummary?: string;
  productsCount: number;
  salesCount: number;
  totalSalesUSD: number;
  sizeBytes: number;
  fileName: string;
}

export interface AutoBackupVersionRecord extends AutoBackupVersionMeta {
  jsonPayload: string;
}

export interface AutoBackupTrackerState {
  txSinceLastAutoBackup: number;
  totalTrackedTransactions: number;
  nextVersionNumber: number;
  autoDownloadFileOnMilestone: boolean;
  lastAutoBackupAt: string | null;
}

const IDB_NAME = 'mi_tienda_auto_backups_idb';
const IDB_VERSION = 1;
const IDB_STORE = 'json_backup_versions';

const TRACKER_STORAGE_KEY = 'mi_tienda_autobackup_tracker_v1';
const FALLBACK_VERSIONS_KEY = 'mi_tienda_autobackup_versions_fallback_v1';
export const TRANSACTIONS_PER_AUTO_BACKUP = 10;
const MAX_STORED_VERSIONS = 35;

export const DEFAULT_AUTO_BACKUP_TRACKER: AutoBackupTrackerState = {
  txSinceLastAutoBackup: 0,
  totalTrackedTransactions: 0,
  nextVersionNumber: 1,
  autoDownloadFileOnMilestone: false,
  lastAutoBackupAt: null,
};

export function loadAutoBackupTracker(): AutoBackupTrackerState {
  if (typeof window === 'undefined') return DEFAULT_AUTO_BACKUP_TRACKER;
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return DEFAULT_AUTO_BACKUP_TRACKER;
    const parsed = JSON.parse(raw);
    return {
      txSinceLastAutoBackup:
        typeof parsed.txSinceLastAutoBackup === 'number' && parsed.txSinceLastAutoBackup >= 0
          ? parsed.txSinceLastAutoBackup
          : 0,
      totalTrackedTransactions:
        typeof parsed.totalTrackedTransactions === 'number' && parsed.totalTrackedTransactions >= 0
          ? parsed.totalTrackedTransactions
          : 0,
      nextVersionNumber:
        typeof parsed.nextVersionNumber === 'number' && parsed.nextVersionNumber >= 1
          ? parsed.nextVersionNumber
          : 1,
      autoDownloadFileOnMilestone: Boolean(parsed.autoDownloadFileOnMilestone),
      lastAutoBackupAt: typeof parsed.lastAutoBackupAt === 'string' ? parsed.lastAutoBackupAt : null,
    };
  } catch {
    return DEFAULT_AUTO_BACKUP_TRACKER;
  }
}

export function saveAutoBackupTracker(state: AutoBackupTrackerState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

function openBackupIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('versionNumber', 'versionNumber', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Error abriendo IndexedDB de respaldos'));
  });
}

function saveFallbackVersionsToLocalStorage(records: AutoBackupVersionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep up to 10 most recent versions in localStorage as a fast/resilient fallback
    const compact = records.slice(0, 10);
    localStorage.setItem(FALLBACK_VERSIONS_KEY, JSON.stringify(compact));
  } catch {
    // If quota exceeded with full payloads, try keeping only the latest 3
    try {
      localStorage.setItem(FALLBACK_VERSIONS_KEY, JSON.stringify(records.slice(0, 3)));
    } catch {
      // ignore
    }
  }
}

function loadFallbackVersionsFromLocalStorage(): AutoBackupVersionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FALLBACK_VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Retrieve all saved JSON backup versions sorted newest first (highest versionNumber first).
 */
export async function getAllAutoBackupVersions(): Promise<AutoBackupVersionRecord[]> {
  try {
    const db = await openBackupIDB();
    const records = await new Promise<AutoBackupVersionRecord[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as AutoBackupVersionRecord[]) || []);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
    const sorted = [...records].sort((a, b) => b.versionNumber - a.versionNumber);
    if (sorted.length > 0) {
      return sorted;
    }
    return loadFallbackVersionsFromLocalStorage().sort(
      (a, b) => b.versionNumber - a.versionNumber
    );
  } catch {
    return loadFallbackVersionsFromLocalStorage().sort(
      (a, b) => b.versionNumber - a.versionNumber
    );
  }
}

/**
 * Create and persist a new JSON backup version in browser storage (IndexedDB + localStorage fallback).
 */
export async function createBrowserJsonBackupVersion(params: {
  appStateSnapshot: any;
  storeId: string;
  storeName: string;
  triggerType: 'auto_10_tx' | 'manual';
  versionNumber: number;
  txMilestone: number;
  lastSaleSummary?: string;
}): Promise<AutoBackupVersionRecord> {
  const now = new Date();
  const nowIso = now.toISOString();
  const dateSlug = nowIso.slice(0, 10);
  const timeSlug = now.toTimeString().slice(0, 5).replace(':', '-');

  const products = Array.isArray(params.appStateSnapshot?.products)
    ? params.appStateSnapshot.products
    : [];
  const salesHistory = Array.isArray(params.appStateSnapshot?.salesHistory)
    ? params.appStateSnapshot.salesHistory
    : [];
  const activeSales = salesHistory.filter((s: any) => s && s.status !== 'voided');
  const totalSalesUSD = Number(
    activeSales.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0).toFixed(2)
  );

  const enrichedPayloadObject = {
    _backupMetadata: {
      versionNumber: params.versionNumber,
      triggerType: params.triggerType,
      createdAt: nowIso,
      storeId: params.storeId,
      storeName: params.storeName,
      transactionCountAtBackup: salesHistory.length,
      txMilestone: params.txMilestone,
      productsCount: products.length,
      totalSalesUSD,
    },
    ...params.appStateSnapshot,
  };

  const jsonPayload = JSON.stringify(enrichedPayloadObject, null, 2);
  const sizeBytes =
    typeof Blob !== 'undefined' ? new Blob([jsonPayload]).size : jsonPayload.length;

  const cleanStoreSlug = (params.storeName || 'mi_tienda')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const prefix = params.triggerType === 'auto_10_tx' ? 'auto_10tx' : 'manual';
  const fileName = `respaldo_${cleanStoreSlug}_v${params.versionNumber}_${prefix}_${dateSlug}_${timeSlug}.json`;

  const record: AutoBackupVersionRecord = {
    id: `bkp_v${params.versionNumber}_${Date.now()}`,
    versionNumber: params.versionNumber,
    triggerType: params.triggerType,
    createdAt: nowIso,
    storeId: params.storeId,
    storeName: params.storeName || 'Mi Tienda',
    transactionCountAtBackup: salesHistory.length,
    txMilestone: params.txMilestone,
    lastSaleSummary: params.lastSaleSummary,
    productsCount: products.length,
    salesCount: salesHistory.length,
    totalSalesUSD,
    sizeBytes,
    fileName,
    jsonPayload,
  };

  try {
    const db = await openBackupIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    // Prune older versions beyond MAX_STORED_VERSIONS
    const all = await getAllAutoBackupVersions();
    if (all.length > MAX_STORED_VERSIONS) {
      const toRemove = all.slice(MAX_STORED_VERSIONS);
      const dbPrune = await openBackupIDB();
      await new Promise<void>((resolve) => {
        const tx = dbPrune.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        toRemove.forEach((oldRec) => store.delete(oldRec.id));
        tx.oncomplete = () => {
          dbPrune.close();
          resolve();
        };
        tx.onerror = () => {
          dbPrune.close();
          resolve();
        };
      });
    }
    const updatedList = await getAllAutoBackupVersions();
    saveFallbackVersionsToLocalStorage(updatedList);
  } catch {
    const existing = loadFallbackVersionsFromLocalStorage();
    const nextList = [record, ...existing].slice(0, MAX_STORED_VERSIONS);
    saveFallbackVersionsToLocalStorage(nextList);
  }

  try {
    localStorage.setItem('mi_tienda_last_json_backup_at', nowIso);
  } catch {
    // ignore
  }

  return record;
}

/**
 * Delete a specific backup version by ID.
 */
export async function deleteAutoBackupVersion(id: string): Promise<AutoBackupVersionRecord[]> {
  try {
    const db = await openBackupIDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
  const fallback = loadFallbackVersionsFromLocalStorage().filter((r) => r.id !== id);
  saveFallbackVersionsToLocalStorage(fallback);
  return getAllAutoBackupVersions();
}

/**
 * Clear all stored backup versions.
 */
export async function clearAllAutoBackupVersions(): Promise<void> {
  try {
    const db = await openBackupIDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(FALLBACK_VERSIONS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Trigger a browser file download of a saved JSON backup version.
 */
export function downloadBackupVersionFile(record: AutoBackupVersionRecord): void {
  if (typeof document === 'undefined') return;
  try {
    const blob = new Blob([record.jsonPayload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = record.fileName || `respaldo_v${record.versionNumber}.json`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  } catch {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(record.jsonPayload);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', record.fileName || `respaldo_v${record.versionNumber}.json`);
    dlAnchor.click();
  }
}

export function formatBackupByteSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
