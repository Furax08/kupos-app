import React from 'react';
import { getCurrencySymbol } from '../i18n';

export interface RatesConfig {
  refCurrency?: string;
  refUSD: number;
  primaryCurrency: string;
  primaryRate: number;
  secondaryCurrency: string;
  secondaryRate: number;
  showSecondaryRate?: boolean;
  selectedCrypto?: 'USDT' | 'USDC' | 'BTC' | 'BNB' | 'ETH';
  showCryptoRate?: boolean;
  crypto: {
    BTC: number;
    BNB: number;
    USDT: number;
    USDC: number;
    ETH: number;
  };
}

interface ProductMultiRatePriceProps {
  basePriceUSD: number;
  rates: RatesConfig;
  unit?: string;
  compact?: boolean;
  mini?: boolean;
  weightLabel?: string;
  brandLabel?: string;
}

export const formatCurrencyAmount = (amount: number, currency?: string): string => {
  const iso = (currency || '').toUpperCase();
  if (iso === 'BTC') {
    return amount.toLocaleString('es-VE', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    });
  }
  if (iso === 'ETH' || iso === 'BNB') {
    return amount.toLocaleString('es-VE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  }
  return amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCryptoAmount = (basePriceUSD: number, rates: RatesConfig): string => {
  const activeCrypto = (rates.selectedCrypto || 'USDT').toUpperCase() as
    | 'USDT'
    | 'USDC'
    | 'BTC'
    | 'BNB'
    | 'ETH';
  const defaultCryptoMap: Record<string, number> = {
    BTC: 67500,
    BNB: 590,
    ETH: 2650,
    USDT: 1,
    USDC: 1,
  };
  const rawRate = rates.crypto?.[activeCrypto];
  const cryptoPriceUSD =
    typeof rawRate === 'number' && rawRate > 0 ? rawRate : defaultCryptoMap[activeCrypto] || 1;
  const cryptoAmount = cryptoPriceUSD > 0 ? basePriceUSD / cryptoPriceUSD : basePriceUSD;

  if (activeCrypto === 'BTC') {
    if (cryptoAmount === 0) return '0.000000';
    return cryptoAmount < 0.0001 ? cryptoAmount.toFixed(8) : cryptoAmount.toFixed(6);
  }
  if (activeCrypto === 'ETH' || activeCrypto === 'BNB') {
    if (cryptoAmount === 0) return '0.0000';
    return cryptoAmount < 0.01 ? cryptoAmount.toFixed(6) : cryptoAmount.toFixed(4);
  }
  return cryptoAmount.toFixed(2);
};

export const ProductMultiRatePrice: React.FC<ProductMultiRatePriceProps> = ({
  basePriceUSD,
  rates,
  unit,
  compact = false,
  mini = false,
  weightLabel,
  brandLabel,
}) => {
  const refCurrency = (rates.refCurrency || 'USD').toUpperCase();
  const refSymbol = getCurrencySymbol(refCurrency);
  const refMultiplier = rates.refUSD || 1.0;
  const primaryISO = (rates.primaryCurrency || 'VES').toUpperCase();
  const secondaryISO = (rates.secondaryCurrency || 'COP').toUpperCase();

  // Mandatory: Reference Rate & Primary Rate are always visible
  // Optional: Secondary Rate & Crypto Rate can be toggled ON or OFF
  const isSecondaryVisible = rates.showSecondaryRate !== false;
  const isCryptoVisible = rates.showCryptoRate !== false;

  // Base price in Reference Currency
  const refAmount = basePriceUSD * refMultiplier;

  // Primary rate amount (Letra Grande)
  const primaryAmount = basePriceUSD * (rates.primaryRate || 1);

  // Secondary rate amount (Letra chica debajo de la primaria - cantidad completa + ISO)
  const secondaryAmount = basePriceUSD * (rates.secondaryRate || 1);

  // Crypto rate amount (Letra chica debajo)
  const activeCrypto = (rates.selectedCrypto || 'USDT').toUpperCase() as
    | 'USDT'
    | 'USDC'
    | 'BTC'
    | 'BNB'
    | 'ETH';
  const formattedCrypto = formatCryptoAmount(basePriceUSD, rates);

  const unitSuffix =
    unit === 'peso' ? '/Kg' : unit === 'litros' ? '/L' : unit === 'metros' ? '/m' : '';

  const subtleWeightAndBrand = [weightLabel, brandLabel]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' · ');

  if (mini) {
    return (
      <div className="w-full space-y-0.5 leading-tight">
        {/* 1. TASA PRIMARIA (Obligatoria): Letra Grande - Color uniforme número + ISO */}
        <div
          className="pos-card-primary-price text-[12px] sm:text-sm font-extrabold tracking-tight break-words leading-tight"
          style={{ color: 'var(--pos-el-price-color, #34d399)' }}
        >
          {formatCurrencyAmount(primaryAmount, primaryISO)}{' '}
          <span className="pos-card-primary-iso text-[9px] font-extrabold" style={{ color: 'inherit' }}>
            {primaryISO}
            {unitSuffix}
          </span>
        </div>

        {/* Debajo derecho de la primaria: Tasa Referencia (Obligatoria) */}
        <div className="flex items-center justify-between gap-1">
          {subtleWeightAndBrand && (
            <span className="pos-card-subtitle text-[9.5px] text-slate-300 font-semibold break-words whitespace-normal leading-snug">
              <i className="fa-solid fa-scale-balanced mr-1 text-[8px] opacity-85"></i>
              {subtleWeightAndBrand}
            </span>
          )}
          <span
            className="pos-card-usd-rate text-[8.5px] font-bold bg-slate-900/95 border border-slate-700 px-1 py-0.2 rounded ml-auto shrink-0"
            style={{ color: 'var(--pos-el-usd-color, #cbd5e1)' }}
          >
            {refSymbol}
            {formatCurrencyAmount(refAmount, refCurrency)} {refCurrency}
          </span>
        </div>

        {/* 2. TASA SECUNDARIA (Opcional ON/OFF): Color uniforme número + ISO */}
        {isSecondaryVisible && (
          <div
            className="pos-card-secondary-rate text-[9px] font-bold break-words leading-tight"
            style={{ color: 'var(--pos-el-sec-color, #94a3b8)' }}
          >
            {formatCurrencyAmount(secondaryAmount, secondaryISO)}{' '}
            <span className="font-extrabold" style={{ color: 'inherit' }}>
              {secondaryISO}
            </span>
          </div>
        )}

        {/* 3. TASA CRIPTO (Opcional ON/OFF): Color uniforme número + ISO */}
        {isCryptoVisible && (
          <div
            className="pos-card-crypto-rate text-[8.5px] font-mono break-words leading-tight"
            style={{ color: 'var(--pos-el-crypto-color, #fbbf24)' }}
          >
            ₿ {formattedCrypto}{' '}
            <span className="font-bold" style={{ color: 'inherit' }}>
              {activeCrypto}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-1 leading-tight">
      {/* 1. TASA PRIMARIA (Obligatoria) + TASA REFERENCIA (Obligatoria) - Color uniforme */}
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-0.5">
        <div
          className={`pos-card-primary-price ${
            compact ? 'text-sm' : 'text-base sm:text-lg'
          } font-extrabold tracking-tight leading-none`}
          style={{ color: 'var(--pos-el-price-color, #34d399)' }}
          title={`Tasa Primaria (${primaryISO})`}
        >
          {formatCurrencyAmount(primaryAmount, primaryISO)}{' '}
          <span
            className="pos-card-primary-iso text-[11px] font-extrabold"
            style={{ color: 'inherit' }}
          >
            {primaryISO}
            {unitSuffix}
          </span>
        </div>

        <div
          className="pos-card-usd-rate text-[10px] font-bold bg-slate-900/90 border border-slate-700/80 px-1.5 py-0.5 rounded ml-auto shrink-0"
          style={{ color: 'var(--pos-el-usd-color, #cbd5e1)' }}
          title={`Tasa de Referencia (${refCurrency})`}
        >
          {refSymbol}
          {formatCurrencyAmount(refAmount, refCurrency)} {refCurrency}
        </div>
      </div>

      {/* 2. TASA SECUNDARIA (Opcional ON/OFF): Color uniforme número + ISO */}
      {isSecondaryVisible && (
        <div
          className="pos-card-secondary-rate text-[11px] font-bold break-words leading-snug"
          style={{ color: 'var(--pos-el-sec-color, #94a3b8)' }}
          title={`Tasa Secundaria (${secondaryISO})`}
        >
          <span>{formatCurrencyAmount(secondaryAmount, secondaryISO)}</span>{' '}
          <span className="font-extrabold uppercase" style={{ color: 'inherit' }}>
            {secondaryISO}
          </span>
          {unitSuffix && (
            <span className="text-[10px]" style={{ color: 'inherit' }}>
              {unitSuffix}
            </span>
          )}
        </div>
      )}

      {/* 3. TASA CRIPTO (Opcional ON/OFF): Color uniforme número + ISO */}
      {isCryptoVisible && (
        <div
          className="pos-card-crypto-rate flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono"
          style={{ color: 'var(--pos-el-crypto-color, #fbbf24)' }}
        >
          <span style={{ color: 'inherit' }}>
            <i className="fa-brands fa-bitcoin mr-1" style={{ color: 'inherit' }}></i>
            {formattedCrypto}{' '}
            <strong className="uppercase" style={{ color: 'inherit' }}>
              {activeCrypto}
            </strong>
          </span>
          {activeCrypto !== 'USDT' && (
            <span className="text-[9px] opacity-80" style={{ color: 'inherit' }}>
              ≈ {(basePriceUSD / (rates.crypto?.USDT || 1)).toFixed(2)} USDT
            </span>
          )}
          {activeCrypto === 'USDT' && (rates.crypto?.BNB || 0) > 0 && (
            <span className="text-[9px] opacity-80" style={{ color: 'inherit' }}>
              ≈ {(basePriceUSD / (rates.crypto?.BNB || 1)).toFixed(4)} BNB
            </span>
          )}
        </div>
      )}

      {/* Peso del producto y marca siempre completos y visibles sin recortar */}
      {subtleWeightAndBrand && (
        <div className="text-[10px] text-slate-300 font-semibold leading-snug break-words whitespace-normal mt-1 pt-0.5 tracking-wide select-none">
          <i className="fa-solid fa-scale-balanced mr-1 text-[8.5px] opacity-85"></i>
          {subtleWeightAndBrand}
        </div>
      )}
    </div>
  );
};
