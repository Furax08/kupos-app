import React, { useState, useRef } from 'react';
import {
  AutoBackupVersionRecord,
  AutoBackupTrackerState,
  TRANSACTIONS_PER_AUTO_BACKUP,
  downloadBackupVersionFile,
  formatBackupByteSize,
} from '../utils/autoBackupEngine';

interface AutoBackupVersionHistoryPanelProps {
  versions: AutoBackupVersionRecord[];
  tracker: AutoBackupTrackerState;
  lastBackupAt: string | null;
  onCreateManualVersion: (alsoDownloadFile?: boolean) => void;
  onRestoreVersion: (record: AutoBackupVersionRecord) => void;
  onImportJsonFile: (jsonText: string, fileName: string) => void;
  onDeleteVersion: (id: string) => void;
  onClearAllVersions: () => void;
  onToggleAutoDownloadOnMilestone: (enabled: boolean) => void;
}

export const AutoBackupVersionHistoryPanel: React.FC<AutoBackupVersionHistoryPanelProps> = ({
  versions,
  tracker,
  lastBackupAt,
  onCreateManualVersion,
  onRestoreVersion,
  onImportJsonFile,
  onDeleteVersion,
  onClearAllVersions,
  onToggleAutoDownloadOnMilestone,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'auto_10_tx' | 'manual'>('all');
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const txInCycle = Math.min(
    TRANSACTIONS_PER_AUTO_BACKUP,
    Math.max(0, tracker.txSinceLastAutoBackup || 0)
  );
  const remainingTx = Math.max(0, TRANSACTIONS_PER_AUTO_BACKUP - txInCycle);
  const progressPercent = Math.round((txInCycle / TRANSACTIONS_PER_AUTO_BACKUP) * 100);

  const filteredVersions = versions.filter((v) => {
    if (filterMode === 'all') return true;
    return v.triggerType === filterMode;
  });

  const autoCount = versions.filter((v) => v.triggerType === 'auto_10_tx').length;
  const manualCount = versions.filter((v) => v.triggerType === 'manual').length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      if (content) {
        onImportJsonFile(content, file.name);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-800 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
      {/* 1. HEADER & LIVE 10-TRANSACTION PROGRESS TRACKER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center text-sm font-black shadow-sm">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              Copia de Seguridad Automática (JSON) e Historial de Versiones
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              Cada {TRANSACTIONS_PER_AUTO_BACKUP} Transacciones
            </span>
          </div>
          <p className="text-xs text-slate-300">
            El sistema guarda automáticamente una nueva versión en formato <strong>JSON</strong> en
            el navegador cada vez que completas <strong>{TRANSACTIONS_PER_AUTO_BACKUP} transacciones</strong>{' '}
            (ventas al contado, fiados o abonos).
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onCreateManualVersion(false)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition shadow-sm"
            title="Guardar una versión en el historial del navegador ahora mismo"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Guardar Versión Ahora</span>
          </button>

          <button
            type="button"
            onClick={() => onCreateManualVersion(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-brand-600/30 transition"
            title="Guardar nueva versión y descargar el archivo .json a tu dispositivo"
          >
            <i className="fa-solid fa-download"></i>
            <span>Descargar JSON Actual</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition"
            title="Cargar y restaurar un archivo de respaldo .json desde tu dispositivo"
          >
            <i className="fa-solid fa-file-import"></i>
            <span>Importar JSON</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRESS BAR CARD TOWARD NEXT 10-TRANSACTION AUTO-BACKUP */}
      <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 font-mono font-black text-xs text-indigo-300">
              {txInCycle} / {TRANSACTIONS_PER_AUTO_BACKUP} transacciones
            </span>
            <span className="text-xs font-extrabold text-slate-200">
              {remainingTx === 1
                ? '¡Falta 1 transacción para el próximo respaldo automático!'
                : `Faltan ${remainingTx} transacciones para crear la versión v${tracker.nextVersionNumber}`}
            </span>
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            Total acumuladas:{' '}
            <strong className="text-white font-mono">{tracker.totalTrackedTransactions}</strong> tx
            {' · '}
            Versiones guardadas:{' '}
            <strong className="text-emerald-400 font-mono">{versions.length}</strong>
          </span>
        </div>

        {/* 10-step Visual Segmented Progress Bar */}
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: TRANSACTIONS_PER_AUTO_BACKUP }).map((_, idx) => {
            const filled = idx < txInCycle;
            return (
              <div
                key={`step-${idx}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  filled
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
                title={`Transacción ${idx + 1} de ${TRANSACTIONS_PER_AUTO_BACKUP}`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
          <div className="text-slate-400">
            {lastBackupAt ? (
              <span>
                🛡️ Último respaldo registrado:{' '}
                <strong className="text-emerald-400">
                  {new Date(lastBackupAt).toLocaleString()}
                </strong>{' '}
                ({progressPercent}% del ciclo actual)
              </span>
            ) : (
              <span className="text-amber-300">
                ⚡ Realiza ventas o presiona "Guardar Versión Ahora" para iniciar tu historial.
              </span>
            )}
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white font-bold">
            <input
              type="checkbox"
              checked={tracker.autoDownloadFileOnMilestone}
              onChange={(e) => onToggleAutoDownloadOnMilestone(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span>
              Auto-descargar también el archivo <code className="text-amber-300">.json</code> cada{' '}
              {TRANSACTIONS_PER_AUTO_BACKUP} transacciones
            </span>
          </label>
        </div>
      </div>

      {/* 3. VERSION HISTORY LIST & FILTER TABS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                filterMode === 'all'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({versions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('auto_10_tx')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                filterMode === 'auto_10_tx'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Automáticas 10 Tx ({autoCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                filterMode === 'manual'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛠️ Manuales ({manualCount})
            </button>
          </div>

          {versions.length > 0 && (
            <div>
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/40 px-2.5 py-1 rounded-xl">
                  <span className="text-[10.5px] font-bold text-rose-200">
                    ¿Vaciar historial?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllVersions();
                      setConfirmClearAll(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black cursor-pointer"
                  >
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 text-[10.5px] font-bold cursor-pointer transition"
                >
                  <i className="fa-solid fa-trash-can mr-1"></i>
                  Limpiar Historial
                </button>
              )}
            </div>
          )}
        </div>

        {filteredVersions.length === 0 ? (
          <div className="bg-slate-900/70 border border-dashed border-slate-700 rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto text-base">
              <i className="fa-solid fa-box-archive"></i>
            </div>
            <p className="text-xs font-extrabold text-slate-200">
              Aún no hay versiones guardadas en esta categoría
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Cada vez que se completen <strong>{TRANSACTIONS_PER_AUTO_BACKUP} transacciones</strong>{' '}
              aparecerá aquí automáticamente una nueva versión descargable en formato JSON, o puedes
              crear una manualmente con el botón superior.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredVersions.map((ver, index) => {
              const isLatest = index === 0 && filterMode === 'all';
              const isAuto = ver.triggerType === 'auto_10_tx';
              const isExpanded = expandedVersionId === ver.id;
              const isConfirmingRestore = confirmRestoreId === ver.id;

              return (
                <div
                  key={ver.id}
                  className={`rounded-2xl border p-3.5 transition ${
                    isLatest
                      ? 'bg-slate-900/95 border-emerald-500/50 shadow-lg'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Version Info */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/25 border border-indigo-400/50 font-mono font-black text-xs text-indigo-200">
                          v{ver.versionNumber}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isAuto
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {isAuto
                            ? `⚡ Auto · Hito ${ver.txMilestone} Tx`
                            : '🛠️ Respaldo Manual'}
                        </span>

                        {isLatest && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9.5px] font-black uppercase">
                            Más Reciente
                          </span>
                        )}

                        <span className="text-[11px] font-bold text-slate-300">
                          📅 {new Date(ver.createdAt).toLocaleString()}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] font-bold text-slate-300">
                          {formatBackupByteSize(ver.sizeBytes)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span>
                          🏪 <strong className="text-slate-200">{ver.storeName}</strong>
                        </span>
                        <span>
                          📦 <strong className="text-slate-200">{ver.productsCount}</strong>{' '}
                          productos
                        </span>
                        <span>
                          🧾 <strong className="text-slate-200">{ver.salesCount}</strong> ventas
                        </span>
                        <span>
                          💵 Total ventas:{' '}
                          <strong className="text-emerald-400 font-mono">
                            ${ver.totalSalesUSD.toFixed(2)} USD
                          </strong>
                        </span>
                        {ver.lastSaleSummary && (
                          <span className="text-indigo-300 truncate max-w-xs">
                            · Últ. op: {ver.lastSaleSummary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons for This Version */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadBackupVersionFile(ver)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] cursor-pointer flex items-center gap-1.5 shadow-sm transition"
                        title={`Descargar archivo ${ver.fileName}`}
                      >
                        <i className="fa-solid fa-download text-[10px]"></i>
                        <span>Descargar JSON</span>
                      </button>

                      {isConfirmingRestore ? (
                        <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/50 px-2 py-1 rounded-xl">
                          <span className="text-[10px] font-black text-amber-200">
                            ¿Restaurar v{ver.versionNumber}?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onRestoreVersion(ver);
                              setConfirmRestoreId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRestoreId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRestoreId(ver.id)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-extrabold text-[11px] cursor-pointer flex items-center gap-1 transition"
                          title="Restaurar el estado de la tienda a esta versión"
                        >
                          <i className="fa-solid fa-rotate-left text-[10px]"></i>
                          <span>Restaurar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedVersionId((prev) => (prev === ver.id ? null : ver.id))
                        }
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center cursor-pointer transition"
                        title="Ver vista previa del contenido JSON"
                      >
                        <i
                          className={`fa-solid ${
                            isExpanded ? 'fa-eye-slash text-brand-400' : 'fa-code'
                          } text-[11px]`}
                        ></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteVersion(ver.id)}
                        className="w-8 h-8 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 flex items-center justify-center cursor-pointer transition"
                        title="Eliminar esta versión del historial"
                      >
                        <i className="fa-solid fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Archivo: {ver.fileName}</span>
                        <span>Formato JSON Estándar</span>
                      </div>
                      <pre className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-44">
                        {ver.jsonPayload.slice(0, 1800)}
                        {ver.jsonPayload.length > 1800
                          ? '\n... [Vista previa resumida — Descarga el archivo JSON para ver el contenido completo]'
                          : ''}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
