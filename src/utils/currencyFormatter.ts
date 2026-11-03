import { CRYPTO_LIST, CryptoSymbol, ExchangeRatesData, RateSettings, WORLD_CURRENCIES } from '../types';

export interface FormattedMultiPrice {
  primaryText: string;
  primaryValue: number;
  referenceText: string;
  referenceValue: number;
  secondaryText: string | null;
  secondaryValue: number | null;
  refAndSecondaryLine: string;
  cryptoLines: { symbol: CryptoSymbol; formatted: string; raw: number }[];
}

/**
 * Converts a price in the user's Reference Currency (USD or EUR) to USD first,
 * then computes Primary Fiat, Secondary Fiat, and all enabled Crypto rates.
 */
export function calculateMultiPrice(
  priceInRef: number,
  settings: RateSettings,
  rates: ExchangeRatesData
): FormattedMultiPrice {
  const eurPerUsd = rates.fiatPerUsd['EUR'] || 0.92;
  // Convert priceInRef to USD baseline
  const priceInUsd =
    settings.referenceCurrency === 'EUR' ? priceInRef / eurPerUsd : priceInRef;

  // 1. Primary Rate calculation
  let primaryValue = 0;
  if (settings.customPrimaryRate && settings.customPrimaryRate > 0) {
    primaryValue = priceInRef * settings.customPrimaryRate;
  } else {
    const primaryPerUsd = rates.fiatPerUsd[settings.primaryCurrency] || 1;
    primaryValue = priceInUsd * primaryPerUsd;
  }

  // 2. Secondary Rate calculation
  let secondaryValue: number | null = null;
  if (settings.secondaryEnabled) {
    if (settings.customSecondaryRate && settings.customSecondaryRate > 0) {
      secondaryValue = priceInRef * settings.customSecondaryRate;
    } else {
      const secondaryPerUsd = rates.fiatPerUsd[settings.secondaryCurrency] || 1;
      secondaryValue = priceInUsd * secondaryPerUsd;
    }
  }

  const primaryText = `${formatFiatNumber(primaryValue, settings.primaryCurrency)} ${settings.primaryCurrency}`;

  const refSymbol = settings.referenceCurrency === 'USD' ? '$' : '€';
  const refFormattedNum = Number.isInteger(priceInRef)
    ? priceInRef.toString()
    : priceInRef.toFixed(2);
  const referenceText = `${refFormattedNum}${refSymbol}`;

  const secondaryText =
    settings.secondaryEnabled && secondaryValue !== null
      ? `${formatSecondaryNumber(secondaryValue, settings.secondaryCurrency)} ${settings.secondaryCurrency}`
      : null;

  const refAndSecondaryLine = secondaryText
    ? `${referenceText} - ${secondaryText}`
    : referenceText;

  // 3. Crypto calculations
  const cryptoLines: { symbol: CryptoSymbol; formatted: string; raw: number }[] = [];

  for (const crypto of CRYPTO_LIST) {
    if (settings.cryptoEnabled[crypto.symbol]) {
      const usdPrice = rates.cryptoUsdPrices[crypto.symbol] || 1;
      const cryptoAmount = usdPrice > 0 ? priceInUsd / usdPrice : 0;
      let formattedAmount = '';

      if (crypto.symbol === 'BTC') {
        formattedAmount = `${cryptoAmount.toFixed(8)} BTC`;
      } else if (crypto.symbol === 'ETH') {
        formattedAmount = `${cryptoAmount.toFixed(6)} ETH`;
      } else if (crypto.symbol === 'BNB') {
        formattedAmount = `${cryptoAmount.toFixed(5)} BNB`;
      } else if (crypto.symbol === 'USDT') {
        const cleanUsdt = Number.isInteger(Number(cryptoAmount.toFixed(2)))
          ? Math.round(cryptoAmount).toString()
          : cryptoAmount.toFixed(2);
        formattedAmount = `${cleanUsdt} Usdt`;
      } else if (crypto.symbol === 'USDC') {
        const cleanUsdc = Number.isInteger(Number(cryptoAmount.toFixed(2)))
          ? Math.round(cryptoAmount).toString()
          : cryptoAmount.toFixed(2);
        formattedAmount = `${cleanUsdc} Usdc`;
      }

      cryptoLines.push({
        symbol: crypto.symbol,
        formatted: formattedAmount,
        raw: cryptoAmount,
      });
    }
  }

  return {
    primaryText,
    primaryValue,
    referenceText,
    referenceValue: priceInRef,
    secondaryText,
    secondaryValue,
    refAndSecondaryLine,
    cryptoLines,
  };
}

export function formatFiatNumber(amount: number, currencyCode: string): string {
  const currencyMeta = WORLD_CURRENCIES.find((c) => c.code === currencyCode);
  const isZeroDecimal =
    currencyMeta?.decimals === 0 || Number.isInteger(Number(amount.toFixed(2)));

  if (currencyCode === 'VES' || currencyCode === 'ARS' || currencyCode === 'CLP' || currencyCode === 'PYG') {
    // Dot thousands separator (e.g. 3.000 VES)
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatSecondaryNumber(amount: number, currencyCode: string): string {
  const isZeroDecimal = Number.isInteger(Number(amount.toFixed(2))) || currencyCode === 'COP';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getRateForCurrencyPerRef(
  currencyCode: string,
  referenceCurrency: 'USD' | 'EUR',
  rates: ExchangeRatesData
): number {
  const eurPerUsd = rates.fiatPerUsd['EUR'] || 0.92;
  const targetPerUsd = rates.fiatPerUsd[currencyCode] || 1;
  if (referenceCurrency === 'EUR') {
    return targetPerUsd / eurPerUsd;
  }
  return targetPerUsd;
}
