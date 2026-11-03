import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import {
  ADMIN_EMAIL,
  BINANCE_PAY_ID,
  DebtorRecord,
  ExchangeRatesData,
  PaymentSubmission,
  PosCart,
  Product,
  RateSettings,
  SaleRecord,
  UserAccount,
} from './src/types';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lumina-pos-db.json');

interface ServerDatabase {
  users: (UserAccount & { password?: string })[];
  submissions: PaymentSubmission[];
  products: Product[];
  cartsByOwner: Record<string, PosCart[]>;
  sales: SaleRecord[];
  debtors: DebtorRecord[];
  exchangeRates: ExchangeRatesData;
}

const DEFAULT_RATE_SETTINGS: RateSettings = {
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
  customPrimaryRate: null,
  customSecondaryRate: null,
};

function createDefaultCarts(): PosCart[] {
  const now = new Date().toISOString();
  return [1, 2, 3, 4, 5].map((num) => ({
    cartId: num as 1 | 2 | 3 | 4 | 5,
    customerName: `Cliente ${num}`,
    customerDocument: '',
    customerPhone: '',
    items: [],
    updatedAt: now,
  }));
}

function generateSampleReceiptSvgDataUrl(ref: string, amount: string, plan: string, email: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 480 600">
    <rect width="480" height="600" rx="24" fill="#181A20"/>
    <rect x="24" y="24" width="432" height="552" rx="18" fill="#1E2329" stroke="#2B3139" stroke-width="2"/>
    <circle cx="240" cy="88" r="30" fill="#FCD535"/>
    <path d="M228 88 l8 8 l18 -18" stroke="#181A20" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="240" y="148" text-anchor="middle" fill="#EAECEF" font-family="sans-serif" font-size="20" font-weight="bold">Binance Pay · Pago Exitoso</text>
    <text x="240" y="188" text-anchor="middle" fill="#FCD535" font-family="monospace" font-size="34" font-weight="bold">-${amount} USDT</text>
    <line x1="56" y1="224" x2="424" y2="224" stroke="#2B3139" stroke-width="1.5"/>
    <text x="56" y="264" fill="#848E9C" font-family="sans-serif" font-size="14">ID Destinatario (Binance Pay)</text>
    <text x="424" y="264" text-anchor="end" fill="#EAECEF" font-family="monospace" font-size="15" font-weight="bold">${BINANCE_PAY_ID}</text>
    <text x="56" y="308" fill="#848E9C" font-family="sans-serif" font-size="14">Referencia de Orden</text>
    <text x="424" y="308" text-anchor="end" fill="#FCD535" font-family="monospace" font-size="15" font-weight="bold">${ref}</text>
    <text x="56" y="352" fill="#848E9C" font-family="sans-serif" font-size="14">Concepto / Plan</text>
    <text x="424" y="352" text-anchor="end" fill="#EAECEF" font-family="sans-serif" font-size="14" font-weight="bold">${plan}</text>
    <text x="56" y="396" fill="#848E9C" font-family="sans-serif" font-size="14">Cuenta Remitente</text>
    <text x="424" y="396" text-anchor="end" fill="#EAECEF" font-family="sans-serif" font-size="14">${email}</text>
    <text x="56" y="440" fill="#848E9C" font-family="sans-serif" font-size="14">Estado Oficial</text>
    <text x="424" y="440" text-anchor="end" fill="#0ECB81" font-family="sans-serif" font-size="14" font-weight="bold">COMPLETADO</text>
    <rect x="56" y="484" width="368" height="56" rx="10" fill="#2B3139"/>
    <text x="240" y="517" text-anchor="middle" fill="#EAECEF" font-family="monospace" font-size="12">Verificación Criptográfica Binance Pay</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getInitialDatabase(): ServerDatabase {
  const now = new Date().toISOString();

  const adminUser: UserAccount & { password?: string } = {
    id: 'usr_admin_furax030',
    email: ADMIN_EMAIL,
    password: 'admin123',
    legalName: 'Administrador Maestro (Furax)',
    documentType: 'Cédula',
    documentNumber: 'V-19069695',
    role: 'admin',
    subscriptionStatus: 'approved',
    subscriptionPlan: 'annual',
    paymentSubmission: null,
    storeProfile: {
      name: 'Lumina Store Central',
      address: 'Av. Principal Las Mercedes, Edif. Lumina, Piso 1',
      category: 'Multitienda, Tecnología & Víveres Selectos',
      phone: '+58 412-0000000',
      isConfigured: true,
    },
    rateSettings: { ...DEFAULT_RATE_SETTINGS },
    createdAt: now,
  };

  const pendingSubmissionId = 'sub_demo_001';
  const demoSubmission: PaymentSubmission = {
    id: pendingSubmissionId,
    userId: 'usr_merchant_demo',
    userEmail: 'carlos.tienda@ejemplo.com',
    userLegalName: 'Carlos Eduardo Mendoza Rivas',
    userDocument: 'Cédula V-24891023',
    plan: 'monthly',
    amountUsd: 2.99,
    binancePayId: BINANCE_PAY_ID,
    referenceNumber: 'BP-29481059284',
    receiptDataUrl: generateSampleReceiptSvgDataUrl(
      'BP-29481059284',
      '2.99',
      'Plan Mensual Premium ($2.99)',
      'carlos.tienda@ejemplo.com'
    ),
    submittedAt: now,
    status: 'pending',
  };

  const pendingMerchant: UserAccount & { password?: string } = {
    id: 'usr_merchant_demo',
    email: 'carlos.tienda@ejemplo.com',
    password: '123456',
    legalName: 'Carlos Eduardo Mendoza Rivas',
    documentType: 'Cédula',
    documentNumber: 'V-24891023',
    role: 'merchant',
    subscriptionStatus: 'pending',
    subscriptionPlan: 'monthly',
    paymentSubmission: demoSubmission,
    storeProfile: {
      name: '',
      address: '',
      category: 'Abasto y Víveres',
      phone: '+58 414-5551234',
      isConfigured: false,
    },
    rateSettings: { ...DEFAULT_RATE_SETTINGS },
    createdAt: now,
  };

  const initialProducts: Product[] = [
    {
      id: 'prod_1',
      ownerId: adminUser.id,
      name: 'Café Especialidad Arábica 500g',
      sku: 'CAF-500',
      category: 'Alimentos y Bebidas',
      priceRef: 3,
      costRef: 1.8,
      stock: 48,
      unit: 'und',
      createdAt: now,
    },
    {
      id: 'prod_2',
      ownerId: adminUser.id,
      name: 'Aceite de Oliva Extra Virgen 500ml',
      sku: 'AOL-500',
      category: 'Alimentos y Bebidas',
      priceRef: 8.5,
      costRef: 5.2,
      stock: 25,
      unit: 'botella',
      createdAt: now,
    },
    {
      id: 'prod_3',
      ownerId: adminUser.id,
      name: 'Auriculares Inalámbricos Cancelación Ruido',
      sku: 'AUD-PRO',
      category: 'Tecnología',
      priceRef: 25,
      costRef: 14,
      stock: 15,
      unit: 'und',
      createdAt: now,
    },
    {
      id: 'prod_4',
      ownerId: adminUser.id,
      name: 'Cargador Rápido GaN 65W USB-C',
      sku: 'CRG-65W',
      category: 'Tecnología',
      priceRef: 15,
      costRef: 8.5,
      stock: 32,
      unit: 'und',
      createdAt: now,
    },
    {
      id: 'prod_5',
      ownerId: adminUser.id,
      name: 'Harina de Maíz Precocida 1Kg (Paquete)',
      sku: 'HAR-1KG',
      category: 'Víveres',
      priceRef: 1.5,
      costRef: 0.95,
      stock: 120,
      unit: 'kg',
      createdAt: now,
    },
    {
      id: 'prod_6',
      ownerId: adminUser.id,
      name: 'Queso Gouda Madurado 500g',
      sku: 'QGO-500',
      category: 'Charcutería',
      priceRef: 6,
      costRef: 4.1,
      stock: 18,
      unit: 'empaque',
      createdAt: now,
    },
  ];

  const initialDebtors: DebtorRecord[] = [
    {
      id: 'deb_1',
      ownerId: adminUser.id,
      customerName: 'María Gabriela Rondón',
      documentNumber: 'V-18452910',
      phone: '+58 424-1192834',
      itemsSummary: '2x Café Especialidad Arábica 500g, 1x Queso Gouda Madurado 500g',
      totalDebtRef: 12,
      paidAmountRef: 3,
      status: 'pending',
      createdAt: now,
      payments: [
        {
          id: 'pay_1',
          amountRef: 3,
          method: 'Pago Móvil / Transferencia',
          date: now,
          note: 'Abono inicial',
        },
      ],
    },
  ];

  const dayMs = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();

  const initialSales: SaleRecord[] = [
    {
      id: 'sale_1001',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 1,
      customerName: 'Cliente 1 (José Gregorio)',
      items: [
        {
          productId: 'prod_1',
          name: 'Café Especialidad Arábica 500g',
          sku: 'CAF-500',
          quantity: 2,
          unitPriceRef: 3,
          subtotalRef: 6,
        },
        {
          productId: 'prod_2',
          name: 'Aceite de Oliva Extra Virgen 500ml',
          sku: 'AOL-500',
          quantity: 1,
          unitPriceRef: 8.5,
          subtotalRef: 8.5,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 14.5,
      primaryCurrency: 'VES',
      totalPrimary: 14500,
      secondaryCurrency: 'COP',
      totalSecondary: 61045,
      paymentMethod: 'Pago Móvil / Transferencia',
      createdAt: new Date(nowMs - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'sale_1002',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 2,
      customerName: 'Cliente 2 (Ana Sofía)',
      items: [
        {
          productId: 'prod_3',
          name: 'Auriculares Inalámbricos Cancelación Ruido',
          sku: 'AUD-PRO',
          quantity: 1,
          unitPriceRef: 25,
          subtotalRef: 25,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 25,
      primaryCurrency: 'VES',
      totalPrimary: 25000,
      secondaryCurrency: 'COP',
      totalSecondary: 105250,
      paymentMethod: 'Binance Pay',
      createdAt: new Date(nowMs - 1 * dayMs).toISOString(),
    },
    {
      id: 'sale_1003',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 3,
      customerName: 'Cliente 3 (Roberto Méndez)',
      items: [
        {
          productId: 'prod_4',
          name: 'Cargador Rápido GaN 65W USB-C',
          sku: 'CRG-65W',
          quantity: 2,
          unitPriceRef: 15,
          subtotalRef: 30,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 30,
      primaryCurrency: 'VES',
      totalPrimary: 30000,
      secondaryCurrency: 'COP',
      totalSecondary: 126300,
      paymentMethod: 'Punto de Venta',
      createdAt: new Date(nowMs - 2 * dayMs).toISOString(),
    },
    {
      id: 'sale_1004',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 1,
      customerName: 'Cliente 1 (Valentina Díaz)',
      items: [
        {
          productId: 'prod_6',
          name: 'Queso Gouda Madurado 500g',
          sku: 'QGO-500',
          quantity: 3,
          unitPriceRef: 6,
          subtotalRef: 18,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 18,
      primaryCurrency: 'VES',
      totalPrimary: 18000,
      secondaryCurrency: 'COP',
      totalSecondary: 75780,
      paymentMethod: 'Efectivo',
      createdAt: new Date(nowMs - 3 * dayMs).toISOString(),
    },
    {
      id: 'sale_1005',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 4,
      customerName: 'Cliente 4 (Luis Herrera)',
      items: [
        {
          productId: 'prod_5',
          name: 'Harina de Maíz Precocida 1Kg (Paquete)',
          sku: 'HAR-1KG',
          quantity: 10,
          unitPriceRef: 1.5,
          subtotalRef: 15,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 15,
      primaryCurrency: 'VES',
      totalPrimary: 15000,
      secondaryCurrency: 'COP',
      totalSecondary: 63150,
      paymentMethod: 'Pago Móvil / Transferencia',
      createdAt: new Date(nowMs - 5 * dayMs).toISOString(),
    },
    {
      id: 'sale_1006',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 2,
      customerName: 'Cliente 2 (Distribuidora Norte)',
      items: [
        {
          productId: 'prod_3',
          name: 'Auriculares Inalámbricos Cancelación Ruido',
          sku: 'AUD-PRO',
          quantity: 3,
          unitPriceRef: 25,
          subtotalRef: 75,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 75,
      primaryCurrency: 'VES',
      totalPrimary: 75000,
      secondaryCurrency: 'COP',
      totalSecondary: 315750,
      paymentMethod: 'Binance Pay',
      createdAt: new Date(nowMs - 32 * dayMs).toISOString(),
    },
    {
      id: 'sale_1007',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 5,
      customerName: 'Cliente 5 (Inversiones Maracaibo)',
      items: [
        {
          productId: 'prod_4',
          name: 'Cargador Rápido GaN 65W USB-C',
          sku: 'CRG-65W',
          quantity: 4,
          unitPriceRef: 15,
          subtotalRef: 60,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 60,
      primaryCurrency: 'VES',
      totalPrimary: 60000,
      secondaryCurrency: 'COP',
      totalSecondary: 252600,
      paymentMethod: 'Punto de Venta',
      createdAt: new Date(nowMs - 63 * dayMs).toISOString(),
    },
    {
      id: 'sale_1008',
      ownerId: adminUser.id,
      storeName: adminUser.storeProfile.name,
      cartId: 1,
      customerName: 'Cliente 1 (Comercial Los Andes)',
      items: [
        {
          productId: 'prod_2',
          name: 'Aceite de Oliva Extra Virgen 500ml',
          sku: 'AOL-500',
          quantity: 6,
          unitPriceRef: 8.5,
          subtotalRef: 51,
        },
      ],
      referenceCurrency: 'USD',
      totalRef: 51,
      primaryCurrency: 'VES',
      totalPrimary: 51000,
      secondaryCurrency: 'COP',
      totalSecondary: 214710,
      paymentMethod: 'Punto de Venta',
      createdAt: new Date(nowMs - 95 * dayMs).toISOString(),
    },
  ];

  return {
    users: [adminUser, pendingMerchant],
    submissions: [demoSubmission],
    products: initialProducts,
    cartsByOwner: {
      [adminUser.id]: createDefaultCarts(),
      [pendingMerchant.id]: createDefaultCarts(),
    },
    sales: initialSales,
    debtors: initialDebtors,
    exchangeRates: {
      base: 'USD',
      fiatPerUsd: {
        USD: 1,
        EUR: 0.92,
        VES: 68.45,
        COP: 4210,
        ARS: 1055,
        MXN: 20.35,
        CLP: 975,
        PEN: 3.76,
        BRL: 5.78,
        DOP: 60.8,
        CRC: 512,
        GTQ: 7.74,
        UYU: 42.6,
        BOB: 6.91,
        PYG: 7850,
        GBP: 0.79,
        CAD: 1.41,
      },
      cryptoUsdPrices: {
        BTC: 88235.29,
        BNB: 618.4,
        USDT: 1.0,
        USDC: 1.0,
        ETH: 2740.5,
      },
      lastUpdated: now,
      source: 'Tasas Oficiales en Tiempo Real (FX + Binance)',
    },
  };
}

function loadDatabase(): ServerDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ServerDatabase;
      if (parsed && Array.isArray(parsed.users)) {
        if (!parsed.sales || parsed.sales.length <= 1) {
          parsed.sales = getInitialDatabase().sales;
          saveDatabase(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading DB, initializing default:', err);
  }
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: ServerDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

let db = loadDatabase();

async function refreshOfficialRates(): Promise<ExchangeRatesData> {
  const updatedFiat = { ...db.exchangeRates.fiatPerUsd };
  const updatedCrypto = { ...db.exchangeRates.cryptoUsdPrices };

  try {
    const fxController = new AbortController();
    const timeout1 = setTimeout(() => fxController.abort(), 4500);
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: fxController.signal,
    });
    clearTimeout(timeout1);

    if (fxRes.ok) {
      const fxData = (await fxRes.json()) as { rates?: Record<string, number> };
      if (fxData.rates) {
        Object.keys(updatedFiat).forEach((code) => {
          if (fxData.rates && typeof fxData.rates[code] === 'number') {
            updatedFiat[code] = Number(fxData.rates[code].toFixed(4));
          }
        });
      }
    }
  } catch {
    // Keep existing cached fiat rates if offline
  }

  try {
    const cryptoController = new AbortController();
    const timeout2 = setTimeout(() => cryptoController.abort(), 4500);
    const binanceRes = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22BNBUSDT%22,%22ETHUSDT%22,%22USDCUSDT%22%5D',
      { signal: cryptoController.signal }
    );
    clearTimeout(timeout2);

    if (binanceRes.ok) {
      const tickers = (await binanceRes.json()) as { symbol: string; price: string }[];
      for (const t of tickers) {
        const val = parseFloat(t.price);
        if (!isNaN(val) && val > 0) {
          if (t.symbol === 'BTCUSDT') updatedCrypto.BTC = val;
          if (t.symbol === 'BNBUSDT') updatedCrypto.BNB = val;
          if (t.symbol === 'ETHUSDT') updatedCrypto.ETH = val;
          if (t.symbol === 'USDCUSDT') updatedCrypto.USDC = val;
        }
      }
      updatedCrypto.USDT = 1.0;
    }
  } catch {
    // Fallback to CoinGecko if Binance API is geo-restricted
    try {
      const cgRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,binancecoin,ethereum,tether,usd-coin&vs_currencies=usd'
      );
      if (cgRes.ok) {
        const cg = (await cgRes.json()) as Record<string, { usd?: number }>;
        if (cg.bitcoin?.usd) updatedCrypto.BTC = cg.bitcoin.usd;
        if (cg.binancecoin?.usd) updatedCrypto.BNB = cg.binancecoin.usd;
        if (cg.ethereum?.usd) updatedCrypto.ETH = cg.ethereum.usd;
        if (cg.tether?.usd) updatedCrypto.USDT = cg.tether.usd;
        if (cg['usd-coin']?.usd) updatedCrypto.USDC = cg['usd-coin'].usd;
      }
    } catch {
      // Keep cached crypto prices
    }
  }

  db.exchangeRates = {
    base: 'USD',
    fiatPerUsd: updatedFiat,
    cryptoUsdPrices: updatedCrypto,
    lastUpdated: new Date().toISOString(),
    source: 'Mercados Oficiales FX & Cripto (Sincronizado)',
  };
  saveDatabase(db);
  return db.exchangeRates;
}

function sanitizeUser(u: UserAccount & { password?: string }): UserAccount {
  const { password: _, ...rest } = u;
  return rest;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Initial background rate refresh
  refreshOfficialRates().catch(() => {});

  // --- AUTH & REGISTRATION ENDPOINTS ---
  app.post('/api/auth/register', (req, res) => {
    const { email, password, legalName, documentType, documentNumber } = req.body;
    if (!email || !password || !legalName || !documentNumber) {
      res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(400).json({ error: 'Este correo ya está registrado. Por favor inicia sesión.' });
      return;
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const now = new Date().toISOString();
    const newUser: UserAccount & { password?: string } = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      password: String(password),
      legalName: String(legalName).trim(),
      documentType: documentType || 'Cédula',
      documentNumber: String(documentNumber).trim(),
      role: isAdmin ? 'admin' : 'merchant',
      subscriptionStatus: isAdmin ? 'approved' : 'none',
      subscriptionPlan: isAdmin ? 'annual' : null,
      paymentSubmission: null,
      storeProfile: {
        name: isAdmin ? 'Lumina Store Central' : '',
        address: '',
        category: 'Comercio General',
        phone: '',
        isConfigured: isAdmin,
      },
      rateSettings: { ...DEFAULT_RATE_SETTINGS },
      createdAt: now,
    };

    db.users.push(newUser);
    db.cartsByOwner[newUser.id] = createDefaultCarts();
    saveDatabase(db);

    res.json({ user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado. Regístrate primero.' });
      return;
    }
    if (user.password && user.password !== password) {
      res.status(401).json({ error: 'Contraseña incorrecta.' });
      return;
    }

    if (!db.cartsByOwner[user.id]) {
      db.cartsByOwner[user.id] = createDefaultCarts();
      saveDatabase(db);
    }

    res.json({ user: sanitizeUser(user) });
  });

  // Quick switch for testing Admin vs Merchant
  app.post('/api/auth/quick-switch', (req, res) => {
    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      res.status(404).json({ error: 'Cuenta no encontrada.' });
      return;
    }
    if (!db.cartsByOwner[user.id]) {
      db.cartsByOwner[user.id] = createDefaultCarts();
      saveDatabase(db);
    }
    res.json({ user: sanitizeUser(user) });
  });

  // --- USER STATE & SUBSCRIPTION ---
  app.get('/api/state/:userId', (req, res) => {
    const { userId } = req.params;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }
    if (!db.cartsByOwner[user.id]) {
      db.cartsByOwner[user.id] = createDefaultCarts();
    }

    const userProducts = db.products.filter((p) => p.ownerId === user.id);
    const userSales = db.sales.filter((s) => s.ownerId === user.id);
    const userDebtors = db.debtors.filter((d) => d.ownerId === user.id);

    res.json({
      user: sanitizeUser(user),
      products: userProducts,
      carts: db.cartsByOwner[user.id],
      sales: userSales,
      debtors: userDebtors,
      exchangeRates: db.exchangeRates,
      adminData:
        user.role === 'admin'
          ? {
              allUsers: db.users.map(sanitizeUser),
              allSubmissions: db.submissions,
              allProducts: db.products,
              allSales: db.sales,
            }
          : null,
    });
  });

  app.post('/api/subscription/submit', (req, res) => {
    const { userId, plan, referenceNumber, receiptDataUrl } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const amountUsd = plan === 'annual' ? 29.99 : 2.99;
    const submission: PaymentSubmission = {
      id: `sub_${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      userLegalName: user.legalName,
      userDocument: `${user.documentType} ${user.documentNumber}`,
      plan: plan === 'annual' ? 'annual' : 'monthly',
      amountUsd,
      binancePayId: BINANCE_PAY_ID,
      referenceNumber: String(referenceNumber || '').trim(),
      receiptDataUrl:
        receiptDataUrl ||
        generateSampleReceiptSvgDataUrl(
          String(referenceNumber || 'REF-000'),
          amountUsd.toFixed(2),
          plan === 'annual' ? 'Plan Anual ($29.99)' : 'Plan Mensual ($2.99)',
          user.email
        ),
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    user.subscriptionPlan = submission.plan;
    user.subscriptionStatus = 'pending';
    user.paymentSubmission = submission;

    // Remove previous pending submissions from same user or prepend
    db.submissions = [submission, ...db.submissions.filter((s) => s.id !== submission.id)];
    saveDatabase(db);

    res.json({ user: sanitizeUser(user), submission });
  });

  // --- ADMIN APPROVAL & MANAGEMENT (furax030@gmail.com) ---
  app.post('/api/admin/review-submission', (req, res) => {
    const { submissionId, userId, approved } = req.body;
    const sub = db.submissions.find((s) => s.id === submissionId || s.userId === userId);
    const targetUser = db.users.find((u) => u.id === (sub?.userId || userId));

    if (!targetUser) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const now = new Date().toISOString();
    const newStatus = approved ? 'approved' : 'rejected';

    if (sub) {
      sub.status = newStatus;
      sub.reviewedAt = now;
    }

    targetUser.subscriptionStatus = newStatus;
    if (targetUser.paymentSubmission) {
      targetUser.paymentSubmission.status = newStatus;
      targetUser.paymentSubmission.reviewedAt = now;
    }

    // Seed starter products for newly approved merchant if they have none yet
    if (approved) {
      const existingProds = db.products.filter((p) => p.ownerId === targetUser.id);
      if (existingProds.length === 0) {
        db.products.push(
          {
            id: `prod_${Date.now()}_1`,
            ownerId: targetUser.id,
            name: 'Producto Ejemplo #1 (Editar o Vender)',
            sku: 'PRD-001',
            category: 'General',
            priceRef: 3,
            costRef: 1.5,
            stock: 50,
            unit: 'und',
            createdAt: now,
          },
          {
            id: `prod_${Date.now()}_2`,
            ownerId: targetUser.id,
            name: 'Producto Ejemplo #2',
            sku: 'PRD-002',
            category: 'General',
            priceRef: 10,
            costRef: 6,
            stock: 30,
            unit: 'und',
            createdAt: now,
          }
        );
      }
    }

    saveDatabase(db);
    res.json({
      allUsers: db.users.map(sanitizeUser),
      allSubmissions: db.submissions,
    });
  });

  // --- STORE SETUP & RATE SETTINGS ---
  app.post('/api/store/setup', (req, res) => {
    const { userId, name, address, category, phone, legalName, documentType, documentNumber } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    if (legalName) user.legalName = String(legalName).trim();
    if (documentType) user.documentType = documentType;
    if (documentNumber) user.documentNumber = String(documentNumber).trim();

    user.storeProfile = {
      name: String(name || '').trim(),
      address: String(address || '').trim(),
      category: String(category || 'Comercio General').trim(),
      phone: String(phone || '').trim(),
      isConfigured: true,
    };

    saveDatabase(db);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/rates/settings', (req, res) => {
    const { userId, rateSettings } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    user.rateSettings = rateSettings;
    saveDatabase(db);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/rates/refresh', async (_req, res) => {
    const updated = await refreshOfficialRates();
    res.json({ exchangeRates: updated });
  });

  // --- PRODUCTS INVENTORY ---
  app.post('/api/products/save', (req, res) => {
    const { userId, product } = req.body;
    const now = new Date().toISOString();
    let savedProduct: Product | null = null;

    if (product.id) {
      const idx = db.products.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        db.products[idx] = {
          ...db.products[idx],
          name: String(product.name).trim(),
          sku: String(product.sku || '').trim(),
          category: String(product.category || 'General').trim(),
          priceRef: Number(product.priceRef) || 0,
          costRef: Number(product.costRef) || 0,
          stock: Number(product.stock) || 0,
          unit: String(product.unit || 'und'),
        };
        savedProduct = db.products[idx];
      }
    } else {
      const newProd: Product = {
        id: `prod_${Date.now()}`,
        ownerId: userId,
        name: String(product.name).trim(),
        sku: String(product.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`).trim(),
        category: String(product.category || 'General').trim(),
        priceRef: Number(product.priceRef) || 0,
        costRef: Number(product.costRef) || 0,
        stock: Number(product.stock) || 0,
        unit: String(product.unit || 'und'),
        createdAt: now,
      };
      db.products.unshift(newProd);
      savedProduct = newProd;
    }

    saveDatabase(db);
    res.json({
      savedProduct,
      products: db.products.filter((p) => p.ownerId === userId),
      allProducts: db.products,
    });
  });

  app.post('/api/products/delete', (req, res) => {
    const { userId, productId } = req.body;
    db.products = db.products.filter((p) => p.id !== productId);
    saveDatabase(db);
    res.json({
      products: db.products.filter((p) => p.ownerId === userId),
      allProducts: db.products,
    });
  });

  // --- PERSISTENT 5 CARTS SYNC ---
  app.post('/api/carts/sync', (req, res) => {
    const { userId, carts } = req.body;
    if (userId && Array.isArray(carts)) {
      db.cartsByOwner[userId] = carts;
      saveDatabase(db);
    }
    res.json({ carts: db.cartsByOwner[userId] || createDefaultCarts() });
  });

  // --- CHECKOUT / CHARGE CART ---
  app.post('/api/pos/checkout', (req, res) => {
    const {
      userId,
      cartId,
      customerName,
      customerDocument,
      customerPhone,
      paymentMethod,
      totalRef,
      totalPrimary,
      totalSecondary,
    } = req.body;

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const userCarts = db.cartsByOwner[userId] || createDefaultCarts();
    const targetCart = userCarts.find((c) => c.cartId === cartId);
    if (!targetCart || targetCart.items.length === 0) {
      res.status(400).json({ error: 'El carrito seleccionado está vacío.' });
      return;
    }

    const now = new Date().toISOString();
    const saleItems = targetCart.items
      .map((item) => {
        const prod = db.products.find((p) => p.id === item.productId);
        if (!prod) return null;
        // Deduct stock
        prod.stock = Math.max(0, prod.stock - item.quantity);
        return {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          quantity: item.quantity,
          unitPriceRef: prod.priceRef,
          subtotalRef: Number((prod.priceRef * item.quantity).toFixed(2)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const newSale: SaleRecord = {
      id: `sale_${Date.now()}`,
      ownerId: user.id,
      storeName: user.storeProfile.name || 'Mi Tienda',
      cartId,
      customerName: customerName || targetCart.customerName,
      customerDocument: customerDocument || targetCart.customerDocument || '',
      items: saleItems,
      referenceCurrency: user.rateSettings.referenceCurrency,
      totalRef: Number(totalRef) || 0,
      primaryCurrency: user.rateSettings.primaryCurrency,
      totalPrimary: Number(totalPrimary) || 0,
      secondaryCurrency: user.rateSettings.secondaryEnabled
        ? user.rateSettings.secondaryCurrency
        : undefined,
      totalSecondary: user.rateSettings.secondaryEnabled ? Number(totalSecondary) : undefined,
      paymentMethod,
      createdAt: now,
    };

    db.sales.unshift(newSale);

    // If sale is on credit ("Crédito (Por Cobrar)"), automatically add to Debtors (Cuentas Pendientes)
    if (paymentMethod === 'Crédito (Por Cobrar)') {
      const summary = saleItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      const newDebtor: DebtorRecord = {
        id: `deb_${Date.now()}`,
        ownerId: user.id,
        customerName: customerName || targetCart.customerName,
        documentNumber: customerDocument || 'S/D',
        phone: customerPhone || '',
        itemsSummary: summary,
        totalDebtRef: Number(totalRef) || 0,
        paidAmountRef: 0,
        status: 'pending',
        createdAt: now,
        payments: [],
      };
      db.debtors.unshift(newDebtor);
    }

    // Clear ONLY the charged cart and reset its default name
    targetCart.items = [];
    targetCart.customerName = `Cliente ${cartId}`;
    targetCart.customerDocument = '';
    targetCart.customerPhone = '';
    targetCart.updatedAt = now;

    saveDatabase(db);

    res.json({
      sale: newSale,
      carts: userCarts,
      products: db.products.filter((p) => p.ownerId === user.id),
      sales: db.sales.filter((s) => s.ownerId === user.id),
      debtors: db.debtors.filter((d) => d.ownerId === user.id),
    });
  });

  // --- DEBTORS (CUENTAS PENDIENTES) ---
  app.post('/api/debtors/add', (req, res) => {
    const { userId, customerName, documentNumber, phone, itemsSummary, totalDebtRef } = req.body;
    const now = new Date().toISOString();
    const newDebtor: DebtorRecord = {
      id: `deb_${Date.now()}`,
      ownerId: userId,
      customerName: String(customerName).trim(),
      documentNumber: String(documentNumber || '').trim(),
      phone: String(phone || '').trim(),
      itemsSummary: String(itemsSummary || 'Cuenta por cobrar').trim(),
      totalDebtRef: Number(totalDebtRef) || 0,
      paidAmountRef: 0,
      status: 'pending',
      createdAt: now,
      payments: [],
    };
    db.debtors.unshift(newDebtor);
    saveDatabase(db);
    res.json({ debtors: db.debtors.filter((d) => d.ownerId === userId) });
  });

  app.post('/api/debtors/pay', (req, res) => {
    const { userId, debtorId, amountRef, method, note } = req.body;
    const debtor = db.debtors.find((d) => d.id === debtorId && d.ownerId === userId);
    if (!debtor) {
      res.status(404).json({ error: 'Cuenta pendiente no encontrada.' });
      return;
    }

    const payAmount = Math.min(
      debtor.totalDebtRef - debtor.paidAmountRef,
      Math.max(0, Number(amountRef) || 0)
    );

    debtor.paidAmountRef = Number((debtor.paidAmountRef + payAmount).toFixed(2));
    debtor.payments.push({
      id: `pay_${Date.now()}`,
      amountRef: payAmount,
      method: method || 'Efectivo',
      date: new Date().toISOString(),
      note: note || 'Abono de cuenta',
    });

    if (debtor.paidAmountRef >= debtor.totalDebtRef - 0.009) {
      debtor.paidAmountRef = debtor.totalDebtRef;
      debtor.status = 'paid';
    }

    saveDatabase(db);
    res.json({ debtors: db.debtors.filter((d) => d.ownerId === userId) });
  });

  // --- OFFLINE POS INDEXEDDB AUTO-SYNC ENDPOINT ---
  app.post('/api/pos/offline-sync', (req, res) => {
    const { pendingItems, stateSnapshot, clientTimestamp } = req.body || {};
    const syncedCount = Array.isArray(pendingItems) ? pendingItems.length : 0;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const offlineBackupFile = path.join(DATA_DIR, 'mi-tienda-offline-sync-snapshot.json');
      fs.writeFileSync(
        offlineBackupFile,
        JSON.stringify(
          {
            lastSyncedAt: new Date().toISOString(),
            clientTimestamp: clientTimestamp || new Date().toISOString(),
            syncedOperationsCount: syncedCount,
            recentOperations: Array.isArray(pendingItems) ? pendingItems.slice(0, 50) : [],
            stateSnapshot: stateSnapshot || null,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.error('Error writing offline sync snapshot:', err);
    }

    res.json({
      ok: true,
      syncedCount,
      syncedAt: new Date().toISOString(),
    });
  });

  // --- SECURE LOCAL WEBSOCKET & QR DEVICE PAIRING REGISTRY ---
  interface PairingSessionRecord {
    pairToken: string;
    pairingPin: string;
    roomKey: string;
    accountEmail: string;
    storeId: string;
    storeName: string;
    hostDeviceId: string;
    hostDeviceName: string;
    createdAt: string;
    expiresAt: string;
  }

  interface ConnectedPeerRecord {
    ws: WebSocket;
    deviceId: string;
    deviceName: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    role: 'host' | 'secondary';
    roomKey: string;
    accountEmail: string;
    storeId: string;
    storeName: string;
    connectedAt: string;
    lastSeenAt: string;
  }

  const pairingSessions = new Map<string, PairingSessionRecord>();
  const roomStateSnapshots = new Map<string, unknown>();
  const roomPeers = new Map<string, Map<string, ConnectedPeerRecord>>();

  const buildRoomKey = (accountEmail: string, storeId: string) =>
    `${String(accountEmail || 'default').trim().toLowerCase()}::${String(storeId || 'store-main').trim()}`;

  const getPublicPeerList = (roomKey: string) => {
    const peersMap = roomPeers.get(roomKey);
    if (!peersMap) return [];
    return Array.from(peersMap.values()).map((p) => ({
      deviceId: p.deviceId,
      deviceName: p.deviceName,
      deviceType: p.deviceType,
      role: p.role,
      storeId: p.storeId,
      storeName: p.storeName,
      connectedAt: p.connectedAt,
      lastSeenAt: p.lastSeenAt,
    }));
  };

  const broadcastToRoom = (
    roomKey: string,
    message: Record<string, unknown>,
    excludeDeviceId?: string
  ) => {
    const peersMap = roomPeers.get(roomKey);
    if (!peersMap) return;
    const serialized = JSON.stringify(message);
    for (const [devId, peer] of peersMap.entries()) {
      if (excludeDeviceId && devId === excludeDeviceId) continue;
      if (peer.ws.readyState === WebSocket.OPEN) {
        try {
          peer.ws.send(serialized);
        } catch {
          // ignore broken socket
        }
      }
    }
  };

  // Create or refresh a unique QR pairing token for a specific store account
  app.post('/api/pairing/session', (req, res) => {
    const {
      accountEmail,
      storeId,
      storeName,
      hostDeviceId,
      hostDeviceName,
      stateSnapshot,
      forceNew,
    } = req.body || {};

    if (!accountEmail || !storeId) {
      res.status(400).json({ error: 'Se requiere accountEmail y storeId para generar el QR.' });
      return;
    }

    const roomKey = buildRoomKey(accountEmail, storeId);
    if (stateSnapshot) {
      roomStateSnapshots.set(roomKey, stateSnapshot);
    }

    const nowMs = Date.now();
    // Reuse existing non-expired session for the same room unless forceNew is true
    if (!forceNew) {
      for (const existing of pairingSessions.values()) {
        if (
          existing.roomKey === roomKey &&
          new Date(existing.expiresAt).getTime() > nowMs + 60_000
        ) {
          res.json({
            session: existing,
            connectedDevices: getPublicPeerList(roomKey),
          });
          return;
        }
      }
    } else {
      // Remove old tokens for this room when regenerating QR
      for (const [key, existing] of pairingSessions.entries()) {
        if (existing.roomKey === roomKey) {
          pairingSessions.delete(key);
        }
      }
    }

    const alphaNum = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const genBlock = () =>
      Array.from({ length: 4 }, () => alphaNum[crypto.randomInt(0, alphaNum.length)]).join('');
    const pairToken = `${genBlock()}-${genBlock()}-${genBlock()}-${genBlock()}`;
    const pairingPin = String(Math.floor(100000 + Math.random() * 900000));
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + 30 * 60 * 1000).toISOString(); // 30 minutes validity

    const session: PairingSessionRecord = {
      pairToken,
      pairingPin,
      roomKey,
      accountEmail: String(accountEmail).trim().toLowerCase(),
      storeId: String(storeId).trim(),
      storeName: String(storeName || 'Mi Tienda').trim(),
      hostDeviceId: String(hostDeviceId || 'host-main'),
      hostDeviceName: String(hostDeviceName || 'Caja Principal'),
      createdAt,
      expiresAt,
    };

    pairingSessions.set(pairToken, session);

    res.json({
      session,
      connectedDevices: getPublicPeerList(roomKey),
    });
  });

  // Claim a QR pairing token or 6-digit PIN from a mobile device or tablet
  app.post('/api/pairing/claim', (req, res) => {
    const { tokenOrPin, deviceId, deviceName, deviceType } = req.body || {};
    const cleanInput = String(tokenOrPin || '').trim().toUpperCase();

    if (!cleanInput) {
      res.status(400).json({ error: 'Ingresa o escanea un código de vinculación válido.' });
      return;
    }

    let matchedSession: PairingSessionRecord | undefined = pairingSessions.get(cleanInput);
    if (!matchedSession) {
      for (const sess of pairingSessions.values()) {
        if (
          sess.pairToken.toUpperCase() === cleanInput ||
          sess.pairingPin === cleanInput.replace(/[^0-9]/g, '')
        ) {
          matchedSession = sess;
          break;
        }
      }
    }

    if (!matchedSession) {
      res.status(404).json({
        error: 'Código QR o PIN no encontrado o expirado. Genera uno nuevo en el dispositivo principal.',
      });
      return;
    }

    if (new Date(matchedSession.expiresAt).getTime() < Date.now()) {
      pairingSessions.delete(matchedSession.pairToken);
      res.status(410).json({
        error: 'El código QR ha expirado por seguridad. Solicita actualizar el QR en la tienda.',
      });
      return;
    }

    const snapshot = roomStateSnapshots.get(matchedSession.roomKey) || null;

    // Notify room that a device just claimed the pairing token
    broadcastToRoom(matchedSession.roomKey, {
      type: 'device:claimed',
      deviceId: deviceId || `dev_${Date.now()}`,
      deviceName: deviceName || 'Dispositivo Móvil',
      deviceType: deviceType || 'mobile',
      storeId: matchedSession.storeId,
      storeName: matchedSession.storeName,
      timestamp: new Date().toISOString(),
    });

    res.json({
      ok: true,
      session: matchedSession,
      stateSnapshot: snapshot,
      connectedDevices: getPublicPeerList(matchedSession.roomKey),
    });
  });

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // Attach WebSocketServer on /ws/device-pairing sharing port 3000
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/device-pairing',
  });

  wss.on('connection', (ws: WebSocket) => {
    let joinedRoomKey: string | null = null;
    let joinedDeviceId: string | null = null;

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(String(rawData));
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'ping') {
          if (joinedRoomKey && joinedDeviceId) {
            const peer = roomPeers.get(joinedRoomKey)?.get(joinedDeviceId);
            if (peer) {
              peer.lastSeenAt = new Date().toISOString();
            }
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
          return;
        }

        if (msg.type === 'device:join') {
          const accountEmail = String(msg.accountEmail || '').trim().toLowerCase();
          const storeId = String(msg.storeId || 'store-main').trim();
          const storeName = String(msg.storeName || 'Mi Tienda').trim();
          const deviceId = String(msg.deviceId || `dev_${Date.now()}`).trim();
          const deviceName = String(msg.deviceName || 'Terminal POS').trim();
          const deviceType: 'mobile' | 'tablet' | 'desktop' =
            msg.deviceType === 'mobile' || msg.deviceType === 'tablet' ? msg.deviceType : 'desktop';
          const role: 'host' | 'secondary' = msg.role === 'secondary' ? 'secondary' : 'host';

          if (!accountEmail) return;

          const nextRoomKey = buildRoomKey(accountEmail, storeId);

          // If switching from a previous room, remove from old room first
          if (joinedRoomKey && joinedRoomKey !== nextRoomKey && joinedDeviceId) {
            const prevMap = roomPeers.get(joinedRoomKey);
            if (prevMap) {
              prevMap.delete(joinedDeviceId);
              broadcastToRoom(joinedRoomKey, {
                type: 'presence:list',
                roomKey: joinedRoomKey,
                devices: getPublicPeerList(joinedRoomKey),
              });
            }
          }

          joinedRoomKey = nextRoomKey;
          joinedDeviceId = deviceId;

          if (!roomPeers.has(joinedRoomKey)) {
            roomPeers.set(joinedRoomKey, new Map());
          }

          const nowIso = new Date().toISOString();
          roomPeers.get(joinedRoomKey)!.set(deviceId, {
            ws,
            deviceId,
            deviceName,
            deviceType,
            role,
            roomKey: joinedRoomKey,
            accountEmail,
            storeId,
            storeName,
            connectedAt: nowIso,
            lastSeenAt: nowIso,
          });

          // If host sends initial state snapshot, store it as authoritative if none exists or host is updating
          if (msg.stateSnapshot && (role === 'host' || !roomStateSnapshots.has(joinedRoomKey))) {
            roomStateSnapshots.set(joinedRoomKey, msg.stateSnapshot);
          }

          // Send authoritative room state to the joining device if available
          const currentSnapshot = roomStateSnapshots.get(joinedRoomKey);
          if (currentSnapshot && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'state:init',
                roomKey: joinedRoomKey,
                storeId,
                stateSnapshot: currentSnapshot,
                devices: getPublicPeerList(joinedRoomKey),
                timestamp: nowIso,
              })
            );
          }

          // Broadcast updated presence list to all devices in the store room
          broadcastToRoom(joinedRoomKey, {
            type: 'presence:list',
            roomKey: joinedRoomKey,
            devices: getPublicPeerList(joinedRoomKey),
            joinedDevice: { deviceId, deviceName, deviceType, role },
            timestamp: nowIso,
          });
          return;
        }

        if (msg.type === 'state:sync') {
          const targetRoom = joinedRoomKey || buildRoomKey(msg.accountEmail, msg.storeId);
          if (!targetRoom || !msg.stateSnapshot) return;

          roomStateSnapshots.set(targetRoom, msg.stateSnapshot);

          const peer = joinedDeviceId ? roomPeers.get(targetRoom)?.get(joinedDeviceId) : undefined;
          if (peer) {
            peer.lastSeenAt = new Date().toISOString();
          }

          broadcastToRoom(
            targetRoom,
            {
              type: 'state:updated',
              roomKey: targetRoom,
              storeId: msg.storeId,
              senderDeviceId: joinedDeviceId || msg.deviceId,
              senderDeviceName: peer?.deviceName || msg.deviceName || 'Dispositivo Vinculado',
              actionSummary: msg.actionSummary || 'Sincronización en vivo',
              stateSnapshot: msg.stateSnapshot,
              timestamp: new Date().toISOString(),
            },
            joinedDeviceId || msg.deviceId
          );
          return;
        }

        if (msg.type === 'device:kick') {
          if (!joinedRoomKey || !msg.targetDeviceId) return;
          const peersMap = roomPeers.get(joinedRoomKey);
          const targetPeer = peersMap?.get(String(msg.targetDeviceId));
          if (targetPeer) {
            if (targetPeer.ws.readyState === WebSocket.OPEN) {
              targetPeer.ws.send(
                JSON.stringify({
                  type: 'device:kicked',
                  reason: 'Desvinculado por el administrador de la tienda.',
                })
              );
              targetPeer.ws.close();
            }
            peersMap?.delete(String(msg.targetDeviceId));
            broadcastToRoom(joinedRoomKey, {
              type: 'presence:list',
              roomKey: joinedRoomKey,
              devices: getPublicPeerList(joinedRoomKey),
              timestamp: new Date().toISOString(),
            });
          }
          return;
        }
      } catch {
        // Ignore malformed WS messages
      }
    });

    ws.on('close', () => {
      if (joinedRoomKey && joinedDeviceId) {
        const peersMap = roomPeers.get(joinedRoomKey);
        if (peersMap) {
          peersMap.delete(joinedDeviceId);
          broadcastToRoom(joinedRoomKey, {
            type: 'presence:list',
            roomKey: joinedRoomKey,
            devices: getPublicPeerList(joinedRoomKey),
            leftDeviceId: joinedDeviceId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina POS Server + WebSocket Pairing running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
