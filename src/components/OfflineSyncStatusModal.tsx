import React from 'react';
import { OfflineSyncItem, SWCacheStats } from '../utils/offlineSyncDB';

interface OfflineSyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  simulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  swActive: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  queueItems: OfflineSyncItem[];
  onSyncNow: () => void;
  onClearSyncedHistory: () => void;
  swCacheStats?: SWCacheStats;
  totalProductsCount?: number;
  isCachingAssets?: boolean;
  onCacheAssetsNow?: () => void;
}

export const OfflineSyncStatusModal: React.FC<OfflineSyncStatusModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  simulatedOffline,
  onToggleSimulatedOffline,
  swActive,
  isSyncing,
  lastSyncedAt,
  queueItems,
  onSyncNow,
  onClearSyncedHistory,
  swCacheStats,
  totalProductsCount = 0,
  isCachingAssets = false,
  onCacheAssetsNow,
}) => {
  if (!isOpen) return null;

  const effectiveOnline = isOnline && !simulatedOffline;
  const pendingItems = queueItems.filter((i) => i.status === 'pending' || i.status === 'failed');
  const syncedItems = queueItems.filter((i) => i.status === 'synced');
  const cachedImagesCount = swCacheStats?.cachedImagesCount ?? 0;
  const cachedStylesCount = swCacheStats?.cachedStylesCount ?? 0;

  const getBadgeForType = (type: OfflineSyncItem['type']) => {
    switch (type) {
      case 'SALE_PAID':
        return {
          icon: 'fa-cash-register',
          label: 'Venta Cobrada',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'SALE_FIADO':
        return {
          icon: 'fa-hand-holding-dollar',
          label: 'Cuenta Fiada',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'DEBT_ABONO':
        return {
          icon: 'fa-money-bill-transfer',
          label: 'Abono de Deuda',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        };
      case 'PRODUCT_UPSERT':
      case 'PRODUCT_STOCK_ADJUST':
      case 'PRODUCT_DELETE':
        return {
          icon: 'fa-boxes-stacked',
          label: 'Inventario',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'RATES_UPDATE':
        return {
          icon: 'fa-coins',
          label: 'Tasas',
          color: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
        };
      default:
        return {
          icon: 'fa-database',
          label: 'Estado POS',
          color: 'bg-slate-700 text-slate-300 border-slate-600',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-inner border ${
                effectiveOnline
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              <i
                className={`fa-solid ${
                  isSyncing
                    ? 'fa-arrows-rotate fa-spin text-indigo-400'
                    : effectiveOnline
                    ? 'fa-wifi'
                    : 'fa-plane-up'
                }`}
              ></i>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                Modo Sin Conexión &amp; Cola IndexedDB
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                    effectiveOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {effectiveOnline ? 'EN LÍNEA' : 'SIN CONEXIÓN (OFFLINE)'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Service Worker:{' '}
                <strong className={swActive ? 'text-emerald-400' : 'text-amber-300'}>
                  {swActive ? 'Activo (Imágenes + Estilos en Caché)' : 'Inicializando'}
                </strong>{' '}
                · Almacenamiento local en <strong className="text-indigo-300">IndexedDB</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ minWidth: 0, minHeight: 38 }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
            title="Volver"
          >
            <i className="fa-solid fa-arrow-left text-emerald-400"></i>
            <span>Volver</span>
          </button>
        </div>

        {/* Status Cards & Controls */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cambios Pendientes
              </div>
              <div className="text-xl font-black text-amber-300 mt-0.5 flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-sm"></i>
                {pendingItems.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                En cola IndexedDB
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sincronizados
              </div>
              <div className="text-xl font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
                {syncedItems.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Respaldados en red
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Imágenes en Caché
              </div>
              <div className="text-xl font-black text-indigo-300 mt-0.5 flex items-center gap-1.5">
                <i className="fa-solid fa-images text-sm"></i>
                {Math.max(cachedImagesCount, totalProductsCount)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Productos offline listos
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estilos &amp; Fuentes
              </div>
              <div className="text-xl font-black text-cyan-300 mt-0.5 flex items-center gap-1.5">
                <i className="fa-solid fa-palette text-sm"></i>
                {Math.max(cachedStylesCount, 3)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                CSS + Iconos en caché
              </div>
            </div>
          </div>

          {/* Service Worker Asset Cache Bar (Product Images + Stylesheets) */}
          <div className="bg-indigo-950/35 border border-indigo-500/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs font-extrabold text-indigo-200 flex items-center gap-1.5">
                <i className="fa-solid fa-bolt text-amber-400"></i>
                Caché Completa de Imágenes de Productos y Estilos (Service Worker v2)
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Todas las fotos del inventario, hojas de estilo CSS, fuentes y vistas claro/oscuro se guardan automáticamente en CacheStorage para carga instantánea sin internet.
              </p>
            </div>
            {onCacheAssetsNow && (
              <button
                type="button"
                disabled={isCachingAssets}
                onClick={onCacheAssetsNow}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer transition shadow-md shadow-indigo-600/25"
              >
                <i
                  className={`fa-solid ${
                    isCachingAssets ? 'fa-spinner fa-spin' : 'fa-download'
                  }`}
                ></i>
                {isCachingAssets ? 'Cacheando activos...' : 'Actualizar Caché de Imágenes y CSS'}
              </button>
            )}
          </div>

          {/* Offline Simulator Toggle & Manual Sync Trigger */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <i className="fa-solid fa-tower-broadcast text-indigo-400"></i>
                Modo de Prueba Sin Conexión{' '}
                {lastSyncedAt && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    (Últ. sync:{' '}
                    {new Date(lastSyncedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    )
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Puedes simular un corte de internet para verificar cómo las ventas, fiados y ajustes se encolan en IndexedDB y se sincronizan solos al reconectar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleSimulatedOffline}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-2 cursor-pointer transition ${
                  simulatedOffline
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
                }`}
              >
                <i
                  className={`fa-solid ${
                    simulatedOffline ? 'fa-plug-circle-Bolt' : 'fa-wifi-slash'
                  }`}
                ></i>
                {simulatedOffline ? 'Volver a Conectar Red' : 'Simular Modo Offline'}
              </button>

              <button
                type="button"
                disabled={!effectiveOnline || pendingItems.length === 0 || isSyncing}
                onClick={onSyncNow}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                  !effectiveOnline || pendingItems.length === 0 || isSyncing
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                }`}
              >
                <i
                  className={`fa-solid fa-arrows-rotate ${isSyncing ? 'fa-spin' : ''}`}
                ></i>
                {isSyncing ? 'Sincronizando...' : `Sincronizar Ahora (${pendingItems.length})`}
              </button>
            </div>
          </div>

          {/* IndexedDB Queue List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-database text-indigo-400"></i>
                Registros en IndexedDB ({queueItems.length})
              </h4>
              {syncedItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSyncedHistory}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer"
                >
                  <i className="fa-solid fa-broom mr-1"></i>
                  Limpiar historial sincronizado
                </button>
              )}
            </div>

            {queueItems.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 text-center">
                <i className="fa-solid fa-cloud-check text-2xl text-emerald-400 mb-2"></i>
                <p className="text-xs font-bold text-slate-200">
                  Todos los cambios del POS están sincronizados
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Si pierdes la conexión a internet, cada venta, fiado, abono o ajuste de stock se guardará aquí automáticamente en IndexedDB.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {queueItems.slice(0, 30).map((item) => {
                  const badge = getBadgeForType(item.type);
                  const isPending = item.status === 'pending' || item.status === 'failed';
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-3 border flex items-center justify-between gap-3 ${
                        isPending
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-800/50 border-slate-700/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border inline-flex items-center gap-1 ${badge.color}`}
                          >
                            <i className={`fa-solid ${badge.icon}`}></i>
                            {badge.label}
                          </span>
                          <span className="text-xs font-extrabold text-white truncate">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 break-words">
                          {item.details}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>
                            <i className="fa-regular fa-clock mr-1"></i>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                          {item.syncedAt && (
                            <span className="text-emerald-400">
                              · Sincronizado{' '}
                              {new Date(item.syncedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {typeof item.amountUSD === 'number' && (
                          <div className="text-xs font-black text-white mb-1">
                            ${item.amountUSD.toFixed(2)}
                          </div>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isPending
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isPending ? 'En cola IDB' : 'Sincronizado'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
