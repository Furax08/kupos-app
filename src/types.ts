export type DocumentType = 'Cédula' | 'DNI' | 'Pasaporte';

export type SubscriptionPlanId = 'monthly' | 'annual';
export type SubscriptionStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface PaymentSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userLegalName: string;
  userDocument: string;
  plan: SubscriptionPlanId;
  amountUsd: number;
  binancePayId: string;
  referenceNumber: string;
  receiptDataUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
}

export interface StoreProfile {
  name: string;
  address: string;
  category: string;
  phone: string;
  isConfigured: boolean;
}

export type CryptoSymbol = 'BTC' | 'BNB' | 'USDT' | 'USDC' | 'ETH';

export interface RateSettings {
  referenceCurrency: 'USD' | 'EUR'; // Obligatorio (letra chica)
  primaryCurrency: string; // Obligatorio (letra grande, ej. VES)
  secondaryEnabled: boolean; // Opcional (ON/OFF marcable)
  secondaryCurrency: string; // Ej. COP
  cryptoEnabled: Record<CryptoSymbol, boolean>;
  customPrimaryRate?: number | null; // Optional manual rate override per 1 Ref unit
  customSecondaryRate?: number | null;
}

export interface ExchangeRatesData {
  base: 'USD';
  fiatPerUsd: Record<string, number>;
  cryptoUsdPrices: Record<CryptoSymbol, number>;
  lastUpdated: string;
  source: string;
}

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  sku: string;
  category: string;
  priceRef: number; // Price in user's Reference Currency (USD or EUR)
  costRef: number;
  stock: number;
  unit: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface PosCart {
  cartId: 1 | 2 | 3 | 4 | 5;
  customerName: string; // Default: "Cliente 1" .. "Cliente 5"
  customerDocument?: string;
  customerPhone?: string;
  items: CartItem[];
  updatedAt: string;
}

export type PaymentMethodType =
  | 'Efectivo'
  | 'Pago Móvil / Transferencia'
  | 'Punto de Venta'
  | 'Binance Pay'
  | 'Cripto Directo'
  | 'Crédito (Por Cobrar)';

export interface SaleLineItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPriceRef: number;
  subtotalRef: number;
}

export interface SaleRecord {
  id: string;
  ownerId: string;
  storeName: string;
  cartId: number;
  customerName: string;
  customerDocument?: string;
  items: SaleLineItem[];
  referenceCurrency: 'USD' | 'EUR';
  totalRef: number;
  primaryCurrency: string;
  totalPrimary: number;
  secondaryCurrency?: string;
  totalSecondary?: number;
  paymentMethod: PaymentMethodType;
  createdAt: string;
}

export interface DebtorPayment {
  id: string;
  amountRef: number;
  method: string;
  date: string;
  note?: string;
}

export interface DebtorRecord {
  id: string;
  ownerId: string;
  customerName: string;
  documentNumber: string;
  phone: string;
  itemsSummary: string;
  totalDebtRef: number;
  paidAmountRef: number;
  status: 'pending' | 'paid';
  createdAt: string;
  payments: DebtorPayment[];
}

export interface UserAccount {
  id: string;
  email: string;
  legalName: string;
  documentType: DocumentType;
  documentNumber: string;
  role: 'admin' | 'merchant';
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlanId | null;
  paymentSubmission?: PaymentSubmission | null;
  storeProfile: StoreProfile;
  rateSettings: RateSettings;
  createdAt: string;
}

export interface WorldCurrency {
  code: string;
  name: string;
  country: string;
  symbol: string;
  decimals: number;
}

export const WORLD_CURRENCIES: WorldCurrency[] = [
  { code: 'VES', name: 'Bolívares', country: 'Venezuela', symbol: 'VES', decimals: 2 },
  { code: 'COP', name: 'Pesos Colombianos', country: 'Colombia', symbol: 'COP', decimals: 0 },
  { code: 'USD', name: 'Dólares Estadounidenses', country: 'Estados Unidos / Global', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euros', country: 'Unión Europea', symbol: '€', decimals: 2 },
  { code: 'ARS', name: 'Pesos Argentinos', country: 'Argentina', symbol: 'ARS', decimals: 0 },
  { code: 'MXN', name: 'Pesos Mexicanos', country: 'México', symbol: 'MXN', decimals: 2 },
  { code: 'CLP', name: 'Pesos Chilenos', country: 'Chile', symbol: 'CLP', decimals: 0 },
  { code: 'PEN', name: 'Soles Peruanos', country: 'Perú', symbol: 'S/', decimals: 2 },
  { code: 'BRL', name: 'Reales Brasileños', country: 'Brasil', symbol: 'R$', decimals: 2 },
  { code: 'DOP', name: 'Pesos Dominicanos', country: 'República Dominicana', symbol: 'RD$', decimals: 2 },
  { code: 'CRC', name: 'Colones Costarricenses', country: 'Costa Rica', symbol: '₡', decimals: 0 },
  { code: 'GTQ', name: 'Quetzales', country: 'Guatemala', symbol: 'Q', decimals: 2 },
  { code: 'UYU', name: 'Pesos Uruguayos', country: 'Uruguay', symbol: '$U', decimals: 2 },
  { code: 'BOB', name: 'Bolivianos', country: 'Bolivia', symbol: 'Bs', decimals: 2 },
  { code: 'PYG', name: 'Guaraníes', country: 'Paraguay', symbol: '₲', decimals: 0 },
  { code: 'GBP', name: 'Libras Esterlinas', country: 'Reino Unido', symbol: '£', decimals: 2 },
  { code: 'CAD', name: 'Dólares Canadienses', country: 'Canadá', symbol: 'CA$', decimals: 2 },
];

export const CRYPTO_LIST: { symbol: CryptoSymbol; name: string; decimals: number }[] = [
  { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
  { symbol: 'BNB', name: 'BNB (Binance)', decimals: 5 },
  { symbol: 'USDT', name: 'Tether USDT', decimals: 2 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 2 },
  { symbol: 'ETH', name: 'Ethereum', decimals: 6 },
];

export const ADMIN_EMAIL = 'furax030@gmail.com';
export const BINANCE_PAY_ID = '190696956';
