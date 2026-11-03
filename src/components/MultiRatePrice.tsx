import React from 'react';
import { ExchangeRatesData, RateSettings } from '../types';
import { calculateMultiPrice } from '../utils/currencyFormatter';

interface MultiRatePriceProps {
  priceRef: number;
  settings: RateSettings;
  rates: ExchangeRatesData;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
}

export const MultiRatePrice: React.FC<MultiRatePriceProps> = ({
  priceRef,
  settings,
  rates,
  size = 'md',
  align = 'left',
}) => {
  const formatted = calculateMultiPrice(priceRef, settings, rates);

  const primaryClasses =
    size === 'lg'
      ? 'text-2xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums'
      : size === 'sm'
      ? 'text-base font-bold tracking-tight text-slate-900 font-mono tabular-nums'
      : 'text-xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums';

  const secondaryClasses =
    size === 'lg'
      ? 'text-sm font-medium text-slate-600 font-mono tabular-nums'
      : 'text-xs font-medium text-slate-500 font-mono tabular-nums';

  const cryptoClasses =
    size === 'lg'
      ? 'text-xs font-medium text-amber-800 font-mono tabular-nums'
      : 'text-[11px] font-medium text-amber-800/90 font-mono tabular-nums';

  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      {/* Line 1: Tasa Primaria (Letra grande principal) */}
      <div className={primaryClasses}>{formatted.primaryText}</div>

      {/* Line 2: Tasa Referencia - Tasa Secundaria (Letra pequeña) */}
      <div className={`${secondaryClasses} mt-0.5`}>{formatted.refAndSecondaryLine}</div>

      {/* Line 3+: Tasas Cripto activas */}
      {formatted.cryptoLines.length > 0 && (
        <div className={`mt-1 flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} gap-0.5`}>
          {formatted.cryptoLines.map((c) => (
            <span key={c.symbol} className={cryptoClasses}>
              {c.formatted}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
