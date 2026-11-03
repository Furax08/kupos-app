import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || !isInstallable) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      promptInstall();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="h-9 inline-flex items-center justify-center gap-1.5 px-2.5 text-[11px] font-extrabold text-white bg-indigo-600/90 rounded-xl hover:bg-indigo-500 border border-indigo-400/30 transition-colors shadow-sm cursor-pointer"
        aria-label="Instalar aplicación POS"
        title="Instalar POS para uso rápido sin conexión"
      >
        <i className="fa-solid fa-download text-xs"></i>
        <span className="hidden xl:inline">Instalar</span>
      </button>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <i className="fa-solid fa-mobile-screen-button text-indigo-400"></i>
                Instalar Mi Tienda POS
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Para instalar el Punto de Venta en tu iPhone o iPad y usarlo sin conexión: toca el botón{' '}
              <strong className="text-white">Compartir</strong> en la barra de Safari y selecciona{' '}
              <strong className="text-indigo-300">&quot;Agregar a pantalla de inicio&quot;</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-extrabold text-white cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
