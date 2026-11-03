import React, { useState } from 'react';
import { RefreshCw, Check, Globe, Coins, Sliders } from 'lucide-react';
import {
  CRYPTO_LIST,
  CryptoSymbol,
  ExchangeRatesData,
  RateSettings,
  WORLD_CURRENCIES,
} from '../types';
import { MultiRatePrice } from './MultiRatePrice';
import { getRateForCurrencyPerRef } from '../utils/currencyFormatter';

interface RatesAdjustmentPanelProps {
  userId: string;
  rateSettings: RateSettings;
  exchangeRates: ExchangeRatesData;
  onUpdateSettings: (newSettings: RateSettings) => void;
  onRefreshOfficialRates: () => Promise<void>;
}

export const RatesAdjustmentPanel: React.FC<RatesAdjustmentPanelProps> = ({
  userId,
  rateSettings,
  exchangeRates,
  onUpdateSettings,
  onRefreshOfficialRates,
}) => {
  const [localSettings, setLocalSettings] = useState<RateSettings>(rateSettings);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const persistSettings = async (updated: RateSettings) => {
    setLocalSettings(updated);
    onUpdateSettings(updated);
    setSaving(true);
    try {
      await fetch('/api/rates/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rateSettings: updated }),
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCrypto = (symbol: CryptoSymbol) => {
    const next: RateSettings = {
      ...localSettings,
      cryptoEnabled: {
        ...localSettings.cryptoEnabled,
        [symbol]: !localSettings.cryptoEnabled[symbol],
      },
    };
    persistSettings(next);
  };

  const handleSyncOfficial = async () => {
    setSyncing(true);
    try {
      await onRefreshOfficialRates();
    } finally {
      setSyncing(false);
    }
  };

  const applyPromptExamplePreset = () => {
    const preset: RateSettings = {
      referenceCurrency: 'USD',
      primaryCurrency: 'VES',
      secondaryEnabled: true,
      secondaryCurrency: 'COP',
      cryptoEnabled: {
        BTC: true,
        BNB: false,
        USDT: true,
        USDC: false,
        ETH: false,
      },
      customPrimaryRate: 1000, // 3$ -> 3.000 VES
      customSecondaryRate: 1000, // 3$ -> 3,000 COP
    };
    persistSettings(preset);
  };

  const applyOfficialLivePreset = () => {
    const next: RateSettings = {
      ...localSettings,
      customPrimaryRate: null,
      customSecondaryRate: null,
    };
    persistSettings(next);
  };

  const officialPrimaryPerRef = getRateForCurrencyPerRef(
    localSettings.primaryCurrency,
    localSettings.referenceCurrency,
    exchangeRates
  );
  const officialSecondaryPerRef = getRateForCurrencyPerRef(
    localSettings.secondaryCurrency,
    localSettings.referenceCurrency,
    exchangeRates
  );

  return (
    <div className="space-y-6">
      {/* Header & Official Rate Sync Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-700">
            Sincronización Automática de Mercados Oficiales
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5 font-display">
            Panel de Ajuste para las Tasas y Criptomonedas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configura cómo se muestran los precios en cada producto del POS, Inventario y Catálogo
            Virtual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={applyPromptExamplePreset}
            className="liquid-btn px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-800 cursor-pointer whitespace-nowrap"
          >
            Cargar Ejemplo (3.000 VES / 3$ - 3,000 COP)
          </button>

          <button
            type="button"
            onClick={handleSyncOfficial}
            disabled={syncing}
            className="liquid-btn-active px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-900 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Actualizando...' : 'Actualizar Tasas Oficiales'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Rate Configuration Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Tasa de Referencia (USD o EUR) - Obligatorio (letra chica) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  1. Tasa de Referencia (USD o EUR)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Obligatorio (letra chica · moneda base de tus productos)
                </span>
              </div>
              <Globe className="w-5 h-5 text-slate-400" />
            </div>

            <div className="liquid-tray p-1.5 rounded-2xl grid grid-cols-2 gap-2">
              {(['USD', 'EUR'] as const).map((refCode) => (
                <button
                  key={refCode}
                  type="button"
                  onClick={() =>
                    persistSettings({ ...localSettings, referenceCurrency: refCode })
                  }
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    localSettings.referenceCurrency === refCode
                      ? 'liquid-btn-active text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {refCode === 'USD'
                    ? 'USD ($) · Dólar Estadounidense'
                    : 'EUR (€) · Euro Oficial'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tasa Primaria (Letra grande principal) - Obligatoria */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  2. Tasa Primaria (Precio Principal en Letra Grande)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Obligatoria · Elige de cualquier país del mundo (Ej. Bolívares VES, Venezuela)
                </span>
              </div>
              <Sliders className="w-5 h-5 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  País y Moneda Primaria
                </label>
                <select
                  value={localSettings.primaryCurrency}
                  onChange={(e) =>
                    persistSettings({
                      ...localSettings,
                      primaryCurrency: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                >
                  {WORLD_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Valor por 1 {localSettings.referenceCurrency}
                  </label>
                  {localSettings.customPrimaryRate ? (
                    <button
                      type="button"
                      onClick={applyOfficialLivePreset}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Usar oficial ({officialPrimaryPerRef.toFixed(2)})
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Automático Oficial
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  value={
                    localSettings.customPrimaryRate !== null &&
                    localSettings.customPrimaryRate !== undefined
                      ? localSettings.customPrimaryRate
                      : Number(officialPrimaryPerRef.toFixed(2))
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    persistSettings({
                      ...localSettings,
                      customPrimaryRate: isNaN(val) || val <= 0 ? null : val,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Tasa Secundaria (Opcional ON - OFF marcable) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  3. Tasa Secundaria (Al lado de la Referencial)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Opcional (ON - OFF) marcable · Letra pequeña junto a la tasa de referencia
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  persistSettings({
                    ...localSettings,
                    secondaryEnabled: !localSettings.secondaryEnabled,
                  })
                }
                className={`px-4 py-2 rounded-full text-xs font-extrabold cursor-pointer transition-all whitespace-nowrap ${
                  localSettings.secondaryEnabled
                    ? 'liquid-btn-active text-slate-900'
                    : 'liquid-tray text-slate-500'
                }`}
              >
                {localSettings.secondaryEnabled ? 'ACTIVA (ON)' : 'APAGADA (OFF)'}
              </button>
            </div>

            {localSettings.secondaryEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    País y Moneda Secundaria
                  </label>
                  <select
                    value={localSettings.secondaryCurrency}
                    onChange={(e) =>
                      persistSettings({
                        ...localSettings,
                        secondaryCurrency: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name} ({c.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Valor por 1 {localSettings.referenceCurrency}
                    </label>
                    {localSettings.customSecondaryRate ? (
                      <button
                        type="button"
                        onClick={() =>
                          persistSettings({ ...localSettings, customSecondaryRate: null })
                        }
                        className="text-[11px] font-bold text-amber-700 hover:underline"
                      >
                        Usar oficial ({officialSecondaryPerRef.toFixed(2)})
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Automático Oficial
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={
                      localSettings.customSecondaryRate !== null &&
                      localSettings.customSecondaryRate !== undefined
                        ? localSettings.customSecondaryRate
                        : Number(officialSecondaryPerRef.toFixed(2))
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      persistSettings({
                        ...localSettings,
                        customSecondaryRate: isNaN(val) || val <= 0 ? null : val,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Tasas o Precios en Cripto (BTC, BNB, USDT, USDC, ETH) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  4. Tasas o Precios en Cripto (Actualización Oficial)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Marca cuáles criptomonedas deseas mostrar debajo del precio en cada producto
                </span>
              </div>
              <Coins className="w-5 h-5 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CRYPTO_LIST.map((crypto) => {
                const isOn = localSettings.cryptoEnabled[crypto.symbol];
                const officialUsd = exchangeRates.cryptoUsdPrices[crypto.symbol] || 1;
                return (
                  <button
                    key={crypto.symbol}
                    type="button"
                    onClick={() => handleToggleCrypto(crypto.symbol)}
                    className={`p-3.5 rounded-2xl text-left flex items-center justify-between cursor-pointer ${
                      isOn ? 'liquid-btn-active text-slate-900' : 'liquid-btn text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold">{crypto.name}</div>
                      <div className="text-[11px] font-mono opacity-80">
                        1 {crypto.symbol} = ${officialUsd.toLocaleString('en-US')}
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold font-mono">
                      {isOn ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Interactive Preview Card */}
        <div className="lg:col-span-5 space-y-5 sticky top-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-bold text-amber-700">Vista Previa en Vivo</div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  Así se verá cada producto
                </h3>
              </div>
              {(saving || savedToast) && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>Guardado</span>
                </span>
              )}
            </div>

            {/* Simulated Product Preview Card with Exact Hierarchy */}
            <div className="liquid-tray p-5 rounded-3xl space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Producto de Prueba (Base: 3 {localSettings.referenceCurrency})
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      Café Especialidad Arábica 500g
                    </h4>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>1° Tasa Primaria (Grande)</div>
                    <div>2° Ref {localSettings.secondaryEnabled ? '- Secundaria' : ''}</div>
                    <div>3° Tasas Cripto Activas</div>
                  </div>

                  <MultiRatePrice
                    priceRef={3}
                    settings={localSettings}
                    rates={exchangeRates}
                    size="lg"
                    align="right"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-600 px-1 space-y-1">
                <div className="font-semibold text-slate-800">Resumen de Tasas Activas:</div>
                <div className="font-mono text-[11px]">
                  · Primaria: 1 {localSettings.referenceCurrency} ={' '}
                  {(localSettings.customPrimaryRate || officialPrimaryPerRef).toLocaleString(
                    'es-VE'
                  )}{' '}
                  {localSettings.primaryCurrency}
                </div>
                {localSettings.secondaryEnabled && (
                  <div className="font-mono text-[11px]">
                    · Secundaria: 1 {localSettings.referenceCurrency} ={' '}
                    {(localSettings.customSecondaryRate || officialSecondaryPerRef).toLocaleString(
                      'en-US'
                    )}{' '}
                    {localSettings.secondaryCurrency}
                  </div>
                )}
                <div className="font-mono text-[11px] text-slate-500">
                  · Última actualización: {new Date(exchangeRates.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
