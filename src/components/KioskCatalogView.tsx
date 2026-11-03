import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrencyAmount } from './ProductMultiRatePrice';
import { WeightSelectorModal, formatWeightLabel } from './WeightSelectorModal';
import { verifyAdminBiometrics } from '../utils/biometricAuth';

export interface KioskProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  barcode: string;
  expiry?: string;
  description?: string;
  cost: number;
  margin: number;
  price: number;
  image: string;
  stock: number;
  minStock: number;
  showCatalog: boolean;
  tags?: string[];
  promoPrice?: number;
  wholesaleMinQty?: number;
  wholesalePrice?: number;
  weight?: string;
  hasTax?: boolean;
  taxRatePct?: number;
  taxLabel?: string;
}

export function getProductWeightText(prod: {
  name: string;
  unit?: string;
  weight?: string;
}): string {
  const customWeight = (prod.weight || '').trim();
  if (customWeight) return customWeight;
  const match = (prod.name || '').match(
    /(\d+(?:[.,]\d+)?\s*(?:kg|kilo|kilos|g|gr|gramos|mg|l|lt|lts|litros|litro|ml|cc|oz|lb|libras|gb|tb))\b/i
  );
  if (match && match[1]) return match[1].trim();
  const u = (prod.unit || '').toLowerCase();
  if (u === 'peso' || u === 'kg' || u === 'kilos' || u === 'gramos') return '1 Kg';
  if (u === 'litros' || u === 'l') return '1 L';
  if (u === 'metros' || u === 'm') return '1 m';
  return '1 und';
}

export function getProductWeightAndBrandText(prod: {
  name: string;
  brand?: string;
  unit?: string;
  weight?: string;
}): string {
  const w = getProductWeightText(prod);
  const b = (prod.brand || '').trim() || 'Genérico';
  return `${w} · ${b}`;
}

export function getEffectiveKioskUnitPrice(product: KioskProduct, qty: number = 1): number {
  const base =
    typeof product.promoPrice === 'number' &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price
      ? product.promoPrice
      : product.price;
  if (
    typeof product.wholesaleMinQty === 'number' &&
    product.wholesaleMinQty > 0 &&
    typeof product.wholesalePrice === 'number' &&
    product.wholesalePrice > 0 &&
    qty >= product.wholesaleMinQty
  ) {
    return product.wholesalePrice;
  }
  return base;
}

export function getCatalogTagBadgeMeta(tag: string): {
  icon: string;
  badgeClass: string;
  activePillClass: string;
} {
  const norm = tag.trim().toLowerCase();
  if (norm === 'promoción' || norm === 'promocion' || norm === 'oferta') {
    return {
      icon: '🔥',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      activePillClass:
        'bg-gradient-to-r from-rose-600 to-orange-500 text-white border-rose-400 shadow-md shadow-rose-600/30',
    };
  }
  if (norm === 'destacado' || norm === 'más vendido' || norm === 'mas vendido') {
    return {
      icon: '⭐',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      activePillClass:
        'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30',
    };
  }
  if (norm === 'nuevo') {
    return {
      icon: '✨',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      activePillClass:
        'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-400 shadow-md shadow-emerald-600/30',
    };
  }
  return {
    icon: '🏷️',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    activePillClass:
      'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400 shadow-md shadow-violet-600/30',
  };
}

export interface KioskCartItem extends KioskProduct {
  qty: number;
  weightLabel?: string;
}

export interface KioskRates {
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

export interface KioskPaymentMethodOption {
  id: string;
  name: string;
  title: string;
  icon: string;
  currencyScope: string;
  paymentDetails: string;
}

export interface KioskSubmittedOrderPayload {
  customerName: string;
  customerPhone: string;
  customerNote: string;
  items: KioskCartItem[];
  orderNumber: string;
  paymentMethodId?: string;
  paymentMethodTitle?: string;
  paymentReference?: string;
  paymentHolder?: string;
  receiptImage?: string;
  subtotalUSD?: number;
  taxAmountUSD?: number;
  totalUSD?: number;
  totalPrimary?: number;
}

interface CustomerHistoryOrder {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  note?: string;
  paymentMethod: string;
  paymentReference?: string;
  paymentHolder?: string;
  receiptImage?: string;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    priceUSD: number;
    weightLabel?: string;
  }>;
  subtotalUSD: number;
  taxAmountUSD: number;
  totalUSD: number;
  totalPrimary: number;
  primaryCurrency: string;
  refCurrency: string;
}

interface KioskCatalogViewProps {
  storeName: string;
  storeToken?: string;
  storeUniqueCode?: string;
  ownerEmail?: string;
  products: KioskProduct[];
  categories: string[];
  rates: KioskRates;
  paymentMethods?: KioskPaymentMethodOption[];
  paymentDisplayMode?: 'full_details' | 'name_only';
  isKioskLocked: boolean;
  kioskPin: string;
  storeWhatsAppPhone: string;
  userPassword?: string;
  biometricEnabled?: boolean;
  isGeneratingPDF: boolean;
  isSystemOnline?: boolean;
  onDownloadPDF: () => void;
  onEnableKioskLock: () => void;
  onUnlockAndReturnToAdmin: () => void;
  onReturnToAdminPreview: () => void;
  onSubmitOrderToPOS: (orderData: KioskSubmittedOrderPayload) => void;
  focusedProductId?: string | null;
  onClearFocusedProduct?: () => void;
}

function isWeightedUnit(unit?: string): boolean {
  const u = (unit || '').toLowerCase().trim();
  return u === 'peso' || u === 'kg' || u === 'kilo' || u === 'g' || u === 'gramos' || u === 'lb';
}

export const KioskCatalogView: React.FC<KioskCatalogViewProps> = ({
  storeName,
  storeUniqueCode,
  products,
  categories,
  rates,
  paymentMethods = [],
  paymentDisplayMode = 'full_details',
  isKioskLocked,
  kioskPin,
  storeWhatsAppPhone,
  userPassword,
  biometricEnabled,
  onUnlockAndReturnToAdmin,
  onReturnToAdminPreview,
  onSubmitOrderToPOS,
  focusedProductId,
  onClearFocusedProduct,
}) => {
  const cartStorageKey = `mi_tienda_catalog_cart_v2_${storeUniqueCode || 'default'}`;
  const historyStorageKey = `mi_tienda_catalog_orders_hist_v2_${storeUniqueCode || 'default'}`;
  const lastSentCartKey = `mi_tienda_catalog_last_sent_${storeUniqueCode || 'default'}`;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Persistent Cart in localStorage: NEVER cleared on refresh until customer clicks "Eliminar carrito"
  const [orderItems, setOrderItems] = useState<KioskCartItem[]>(() => {
    try {
      const saved =
        localStorage.getItem(cartStorageKey) ||
        localStorage.getItem('mi_tienda_kiosk_draft_cart_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      const serialized = JSON.stringify(orderItems);
      localStorage.setItem(cartStorageKey, serialized);
      localStorage.setItem('mi_tienda_kiosk_draft_cart_v1', serialized);
    } catch {
      // ignore storage errors
    }
  }, [orderItems, cartStorageKey]);

  // Customer Order History in localStorage
  const [orderHistory, setOrderHistory] = useState<CustomerHistoryOrder[]>(() => {
    try {
      const raw = localStorage.getItem(historyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(orderHistory));
    } catch {
      // ignore
    }
  }, [orderHistory, historyStorageKey]);

  // Modals state
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isPaymentInfoModalOpen, setIsPaymentInfoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [weightModalProduct, setWeightModalProduct] = useState<KioskProduct | null>(null);
  const [confirmClearCartOpen, setConfirmClearCartOpen] = useState(false);

  // Order confirmation modal after clicking Pagar
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    customerName: string;
    paymentMethodTitle: string;
    totalPrimary: number;
    totalUSD: number;
    itemCount: number;
    waUrl?: string;
  } | null>(null);

  // Track last sent cart fingerprint to prevent sending the exact same cart twice via WhatsApp
  const [lastSentCartMeta, setLastSentCartMeta] = useState<{
    fingerprint: string;
    orderNumber: string;
    sentAtMs: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem(lastSentCartKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.fingerprint === 'string') return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const currentCartFingerprint = useMemo(
    () =>
      orderItems
        .map(
          (it) =>
            `${it.id}:${Number(it.qty).toFixed(3)}:${getEffectiveKioskUnitPrice(
              it,
              it.qty
            ).toFixed(2)}`
        )
        .sort()
        .join('|'),
    [orderItems]
  );

  const isSameCartRecentlySent = Boolean(
    orderItems.length > 0 &&
      lastSentCartMeta &&
      lastSentCartMeta.fingerprint === currentCartFingerprint
  );

  // Customer Checkout Inputs (also persisted so customer doesn't retype on refresh)
  const [customerName, setCustomerName] = useState<string>(() => {
    try {
      return localStorage.getItem('mi_tienda_catalog_cust_name') || '';
    } catch {
      return '';
    }
  });
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('mi_tienda_catalog_cust_phone') || '';
    } catch {
      return '';
    }
  });
  const [customerNote, setCustomerNote] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('mi_tienda_catalog_cust_name', customerName);
      localStorage.setItem('mi_tienda_catalog_cust_phone', customerPhone);
    } catch {
      // ignore
    }
  }, [customerName, customerPhone]);

  // Payment method selection
  const availablePaymentMethods = useMemo<KioskPaymentMethodOption[]>(() => {
    if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      return paymentMethods;
    }
    return [
      {
        id: 'pagomovil',
        name: 'Pago Móvil',
        title: `Pago Móvil (${rates.primaryCurrency || 'VES'})`,
        icon: '📲',
        currencyScope: 'PRIMARY',
        paymentDetails: '',
      },
      {
        id: 'transferencia',
        name: 'Transferencia Bancaria',
        title: `Transferencia (${rates.primaryCurrency || 'VES'})`,
        icon: '🏦',
        currencyScope: 'PRIMARY',
        paymentDetails: '',
      },
      {
        id: 'cash',
        name: 'Efectivo',
        title: `Efectivo (${rates.refCurrency || 'USD'} / ${rates.primaryCurrency || 'VES'})`,
        icon: '💵',
        currencyScope: 'USD',
        paymentDetails: '',
      },
    ];
  }, [paymentMethods, rates.primaryCurrency, rates.refCurrency]);

  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    () => availablePaymentMethods[0]?.id || 'pagomovil'
  );

  useEffect(() => {
    if (
      availablePaymentMethods.length > 0 &&
      !availablePaymentMethods.some((m) => m.id === selectedMethodId)
    ) {
      setSelectedMethodId(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods, selectedMethodId]);

  const selectedPaymentMethod = useMemo(
    () =>
      availablePaymentMethods.find((m) => m.id === selectedMethodId) ||
      availablePaymentMethods[0],
    [availablePaymentMethods, selectedMethodId]
  );

  const [paymentReference, setPaymentReference] = useState('');
  const [paymentHolder, setPaymentHolder] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Unlock Modal for Kiosk Mode
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // Focus product if opened via QR link
  useEffect(() => {
    if (!focusedProductId) return;
    const found = products.find((p) => p.id === focusedProductId);
    if (found) {
      setSearchQuery(found.name);
      if (onClearFocusedProduct) onClearFocusedProduct();
    }
  }, [focusedProductId, products, onClearFocusedProduct]);

  // Filter visible catalog products
  const visibleCatalogProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (p.showCatalog === false) return false;
      const matchesCat =
        selectedCategory === 'Todos' ||
        (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  const catalogCategories = useMemo(() => {
    const prodCats = Array.from(
      new Set(
        products
          .filter((p) => p.showCatalog !== false)
          .map((p) => p.category)
          .filter(Boolean)
      )
    );
    const merged = Array.from(new Set(['Todos', ...categories, ...prodCats]));
    return merged;
  }, [products, categories]);

  // Cart quantities & totals (with optional per-product IVA support)
  const getProductQtyInCart = (productId: string): number => {
    const found = orderItems.find((item) => item.id === productId);
    return found ? found.qty : 0;
  };

  const handleAddOrIncrement = (product: KioskProduct) => {
    if (product.stock <= 0) {
      showToast('Producto agotado temporalmente');
      return;
    }
    if (isWeightedUnit(product.unit)) {
      setWeightModalProduct(product);
      return;
    }
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          showToast(`Stock máximo disponible: ${product.stock}`);
          return prev;
        }
        const nextQty = existing.qty + 1;
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, qty: nextQty, price: getEffectiveKioskUnitPrice(product, nextQty) }
            : i
        );
      }
      return [
        ...prev,
        {
          ...product,
          qty: 1,
          price: getEffectiveKioskUnitPrice(product, 1),
        },
      ];
    });
  };

  const handleChangeItemQty = (productId: string, delta: number) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === productId);
      if (!existing) return prev;
      const prod = products.find((p) => p.id === productId) || existing;
      const step = isWeightedUnit(existing.unit) ? 0.25 : 1;
      const nextQty = Number((existing.qty + (delta > 0 ? step : -step)).toFixed(3));
      if (nextQty <= 0) {
        return prev.filter((i) => i.id !== productId);
      }
      if (nextQty > prod.stock) {
        showToast(`Stock disponible: ${prod.stock}`);
        return prev;
      }
      return prev.map((i) =>
        i.id === productId
          ? {
              ...i,
              qty: nextQty,
              price: getEffectiveKioskUnitPrice(prod, nextQty),
              weightLabel: isWeightedUnit(existing.unit)
                ? formatWeightLabel(nextQty, existing.unit)
                : i.weightLabel,
            }
          : i
      );
    });
  };

  const handleConfirmWeightedItem = (
    _productId: string,
    gramsOrKgQty: number,
    customLabel: string
  ) => {
    if (!weightModalProduct) return;
    const prod = weightModalProduct;
    if (gramsOrKgQty <= 0) {
      setWeightModalProduct(null);
      return;
    }
    const cappedQty = Math.min(prod.stock, gramsOrKgQty);
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === prod.id);
      if (existing) {
        const combinedQty = Math.min(prod.stock, Number((existing.qty + cappedQty).toFixed(3)));
        return prev.map((i) =>
          i.id === prod.id
            ? {
                ...i,
                qty: combinedQty,
                price: getEffectiveKioskUnitPrice(prod, combinedQty),
                weightLabel: formatWeightLabel(combinedQty, prod.unit),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          ...prod,
          qty: cappedQty,
          price: getEffectiveKioskUnitPrice(prod, cappedQty),
          weightLabel: customLabel || formatWeightLabel(cappedQty, prod.unit),
        },
      ];
    });
    setWeightModalProduct(null);
    showToast(`${prod.name} agregado al pedido`);
  };

  // Explicit "Eliminar carrito" action requested by the user
  const handleClearEntireCart = () => {
    setOrderItems([]);
    setLastSentCartMeta(null);
    try {
      localStorage.removeItem(cartStorageKey);
      localStorage.removeItem('mi_tienda_kiosk_draft_cart_v1');
      localStorage.removeItem(lastSentCartKey);
    } catch {
      // ignore
    }
    setConfirmClearCartOpen(false);
    setIsCartModalOpen(false);
    showToast('🗑️ Carrito eliminado');
  };

  // Totals calculation (Subtotal + per-product IVA + Total in Primary Rate & Reference Rate)
  const {
    totalUnitsCount,
    subtotalUSD,
    taxAmountUSD,
    totalUSD,
    subtotalPrimary,
    taxAmountPrimary,
    totalPrimary,
  } = useMemo(() => {
    const rate = rates.primaryRate || 1;
    let units = 0;
    let sub = 0;
    let tax = 0;

    for (const item of orderItems) {
      const effectiveUnitUSD = getEffectiveKioskUnitPrice(item, item.qty);
      const lineSubUSD = effectiveUnitUSD * item.qty;
      sub += lineSubUSD;
      if (item.hasTax && typeof item.taxRatePct === 'number' && item.taxRatePct > 0) {
        tax += lineSubUSD * (item.taxRatePct / 100);
      }
      units += isWeightedUnit(item.unit) ? 1 : item.qty;
    }

    const totUSD = sub + tax;
    return {
      totalUnitsCount: units,
      subtotalUSD: sub,
      taxAmountUSD: tax,
      totalUSD: totUSD,
      subtotalPrimary: sub * rate,
      taxAmountPrimary: tax * rate,
      totalPrimary: totUSD * rate,
    };
  }, [orderItems, rates.primaryRate]);

  const primaryCurr = rates.primaryCurrency || 'VES';
  const refCurr = rates.refCurrency || 'USD';

  const copyText = (text: string, label: string = 'Dato copiado') => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      // ignore
    }
    document.body.removeChild(ta);
    showToast(`✓ ${label}`);
  };

  // Receipt image upload (compressed base64)
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 650;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setReceiptBase64(canvas.toDataURL('image/jpeg', 0.72));
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Order: generates random Order ID, alerts POS store owner, and redirects to WhatsApp
  const handleCheckoutAndSendOrder = () => {
    setFormError('');
    if (orderItems.length === 0) {
      setFormError('Agrega al menos un producto a tu carrito.');
      return;
    }

    // Prevent sending the exact same cart twice to avoid duplicate orders or confusion
    if (
      lastSentCartMeta &&
      lastSentCartMeta.fingerprint === currentCartFingerprint
    ) {
      const dupMsg = `⚠️ Ya este mismo carrito fue enviado hace unos minutos (Orden #${lastSentCartMeta.orderNumber}). Modifica los productos o elimina el carrito si deseas hacer un nuevo pedido.`;
      setFormError(dupMsg);
      showToast('⚠️ Ya este mismo carrito fue enviado hace unos minutos.');
      return;
    }

    const cleanName = customerName.trim();
    if (!cleanName) {
      setFormError('Por favor escribe tu Nombre y Apellido para identificar tu orden.');
      return;
    }

    // Random Order Code (e.g. ORD-482910)
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `ORD-${randomDigits}`;
    const nowFormatted = new Date().toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const methodTitle =
      selectedPaymentMethod?.title || selectedPaymentMethod?.name || 'Por coordinar';
    const hasConfiguredDetails =
      paymentDisplayMode === 'full_details' &&
      Boolean(selectedPaymentMethod?.paymentDetails?.trim());

    // Build detailed WhatsApp message
    const lines: string[] = [
      `🛍️ *NUEVO PEDIDO DE CATÁLOGO - ${storeName.toUpperCase()}*`,
      `🧾 *Orden:* #${orderNumber}`,
      `📅 *Fecha:* ${nowFormatted}`,
      `👤 *Cliente:* ${cleanName}`,
      customerPhone.trim() ? `📱 *Teléfono:* ${customerPhone.trim()}` : '',
      `────────────────────`,
      `📦 *DETALLE DEL PEDIDO:*`,
      ...orderItems.map((it) => {
        const unitUSD = getEffectiveKioskUnitPrice(it, it.qty);
        const lineUSD = unitUSD * it.qty;
        const linePri = lineUSD * (rates.primaryRate || 1);
        const qtyLabel = isWeightedUnit(it.unit)
          ? it.weightLabel || formatWeightLabel(it.qty, it.unit)
          : `${it.qty}x`;
        return `▪ ${qtyLabel} *${it.name}* — ${formatCurrencyAmount(
          linePri,
          primaryCurr
        )} ${primaryCurr} ($${lineUSD.toFixed(2)} ${refCurr})`;
      }),
      `────────────────────`,
      taxAmountUSD > 0
        ? `📊 *Subtotal:* ${formatCurrencyAmount(
            subtotalPrimary,
            primaryCurr
          )} ${primaryCurr} ($${subtotalUSD.toFixed(2)} ${refCurr})`
        : '',
      taxAmountUSD > 0
        ? `🏛️ *IVA / Impuesto:* +${formatCurrencyAmount(
            taxAmountPrimary,
            primaryCurr
          )} ${primaryCurr} (+$${taxAmountUSD.toFixed(2)} ${refCurr})`
        : '',
      `💰 *TOTAL A PAGAR (${primaryCurr}): ${formatCurrencyAmount(
        totalPrimary,
        primaryCurr
      )} ${primaryCurr}*`,
      `💵 *Equivalente (${refCurr}):* $${totalUSD.toFixed(2)} ${refCurr}`,
      `📈 *Tasa aplicada:* 1 ${refCurr} = ${formatCurrencyAmount(
        rates.primaryRate,
        primaryCurr
      )} ${primaryCurr}`,
      `────────────────────`,
      `💳 *Método de Pago Seleccionado:* ${methodTitle}`,
      paymentReference.trim() ? `🔢 *Referencia:* ${paymentReference.trim()}` : '',
      paymentHolder.trim() ? `🪪 *Titular:* ${paymentHolder.trim()}` : '',
      receiptBase64 ? `📎 *Comprobante:* Captura adjunta en el sistema` : '',
      !hasConfiguredDetails || !paymentReference.trim()
        ? `💬 *Hola, envío mi orden #${orderNumber}. Seleccioné el método de pago "${methodTitle}", por favor indícame los datos para realizar el pago.*`
        : '',
      customerNote.trim() ? `📝 *Nota / Dirección:* ${customerNote.trim()}` : '',
    ].filter(Boolean);

    const cleanStorePhone = (storeWhatsAppPhone || '').replace(/[^0-9]/g, '');
    const waUrl =
      cleanStorePhone.length >= 7
        ? `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(lines.join('\n'))}`
        : `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;

    // 1. Send order to Store Owner's Catalog Orders Queue (separate from the 5 POS carts!)
    onSubmitOrderToPOS({
      customerName: cleanName,
      customerPhone: customerPhone.trim(),
      customerNote: customerNote.trim(),
      items: orderItems.map((it) => ({ ...it })),
      orderNumber,
      paymentMethodId: selectedPaymentMethod?.id,
      paymentMethodTitle: methodTitle,
      paymentReference: paymentReference.trim() || undefined,
      paymentHolder: paymentHolder.trim() || undefined,
      receiptImage: receiptBase64 || undefined,
      subtotalUSD,
      taxAmountUSD,
      totalUSD,
      totalPrimary,
    });

    // 2. Save in customer's local history
    const newHistRecord: CustomerHistoryOrder = {
      id: orderNumber,
      date: nowFormatted,
      customerName: cleanName,
      customerPhone: customerPhone.trim() || undefined,
      note: customerNote.trim() || undefined,
      paymentMethod: methodTitle,
      paymentReference: paymentReference.trim() || undefined,
      paymentHolder: paymentHolder.trim() || undefined,
      receiptImage: receiptBase64 || undefined,
      items: orderItems.map((it) => ({
        id: it.id,
        name: it.name,
        qty: it.qty,
        priceUSD: getEffectiveKioskUnitPrice(it, it.qty),
        weightLabel: it.weightLabel,
      })),
      subtotalUSD,
      taxAmountUSD,
      totalUSD,
      totalPrimary,
      primaryCurrency: primaryCurr,
      refCurrency: refCurr,
    };
    setOrderHistory((prev) => [newHistRecord, ...prev]);

    // 3. Record sent cart fingerprint so the customer cannot re-send the exact same cart
    const sentMeta = {
      fingerprint: currentCartFingerprint,
      orderNumber,
      sentAtMs: Date.now(),
    };
    setLastSentCartMeta(sentMeta);
    try {
      localStorage.setItem(lastSentCartKey, JSON.stringify(sentMeta));
    } catch {
      // ignore
    }

    // 4. Open WhatsApp with the order details
    if (cleanStorePhone.length >= 7) {
      const a = document.createElement('a');
      a.href = waUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // 5. Show Order Confirmation with random Order Code (Note: Cart is kept until customer clicks "Eliminar carrito")
    setIsCartModalOpen(false);
    setConfirmedOrder({
      orderNumber,
      customerName: cleanName,
      paymentMethodTitle: methodTitle,
      totalPrimary,
      totalUSD,
      itemCount: totalUnitsCount,
      waUrl,
    });
    setPaymentReference('');
    setReceiptBase64(null);
  };

  // Verify PIN or Biometrics to exit Kiosk Mode
  const handleVerifyPinAndExit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = pinInput.trim();
    const expectedPin = (kioskPin || '1234').trim();
    if (cleanInput === expectedPin || (userPassword && cleanInput === userPassword)) {
      setPinInput('');
      setPinError('');
      setIsUnlockModalOpen(false);
      onUnlockAndReturnToAdmin();
    } else {
      setPinError('PIN incorrecto.');
      setPinInput('');
    }
  };

  const handleBiometricUnlock = async () => {
    if (isBiometricScanning) return;
    setPinError('');
    setIsBiometricScanning(true);
    try {
      const result = await verifyAdminBiometrics();
      if (result.success) {
        setIsBiometricScanning(false);
        setIsUnlockModalOpen(false);
        onUnlockAndReturnToAdmin();
      } else {
        setIsBiometricScanning(false);
        setPinError(result.message);
      }
    } catch {
      setIsBiometricScanning(false);
      setPinError('Error al verificar biometría. Usa tu PIN.');
    }
  };

  const methodsWithDetails = useMemo(
    () => availablePaymentMethods.filter((m) => m.paymentDetails && m.paymentDetails.trim().length > 0),
    [availablePaymentMethods]
  );

  const storeInitial = (storeName || 'T').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 select-none font-sans">
      {/* HEADER PRINCIPAL LIMPIO Y PROFESIONAL */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isKioskLocked && (
              <button
                type="button"
                onClick={onReturnToAdminPreview}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0"
                title="Volver al Panel de la Tienda"
              >
                <i className="fa-solid fa-arrow-left text-indigo-600"></i>
                <span className="hidden sm:inline">Panel</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xs shrink-0">
              {storeInitial}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base sm:text-lg leading-tight text-slate-900 truncate">
                {storeName || 'Mi Tienda'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="truncate">Abierto • Catálogo &amp; Pedidos Rápidos</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botón Datos de Pago (si hay datos configurados y el modo es full_details) */}
            {paymentDisplayMode === 'full_details' && methodsWithDetails.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPaymentInfoModalOpen(true)}
                title="Ver Datos de Pago"
                className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition cursor-pointer flex items-center justify-center"
              >
                <i className="fa-solid fa-building-columns text-sm sm:text-base"></i>
              </button>
            )}

            {/* Botón Historial de Órdenes del Cliente */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              title="Mis Órdenes Enviadas"
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center justify-center"
            >
              <i className="fa-solid fa-clock-rotate-left text-sm sm:text-base"></i>
              {orderHistory.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {orderHistory.length}
                </span>
              )}
            </button>

            {/* Botón Eliminar Carrito Rápido si tiene productos */}
            {orderItems.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearCartOpen(true)}
                title="Eliminar carrito"
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <i className="fa-solid fa-trash-can text-sm"></i>
                <span className="hidden md:inline">Eliminar carrito</span>
              </button>
            )}

            {/* Botón Principal del Carrito */}
            <button
              type="button"
              onClick={() => setIsCartModalOpen(true)}
              className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-sm font-bold transition shadow-xs cursor-pointer"
            >
              <i className="fa-solid fa-cart-shopping text-sm"></i>
              <span className="hidden sm:inline">Carrito</span>
              <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-2 py-0.5 rounded-full">
                {totalUnitsCount}
              </span>
            </button>

            {/* Botón Candado para salir de Modo Kiosco si está bloqueado */}
            {isKioskLocked && (
              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                  setIsUnlockModalOpen(true);
                }}
                title="Desbloquear Kiosco (Administrador)"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 transition cursor-pointer"
              >
                <i className="fa-solid fa-lock text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* BANNER DE TASA DEL DÍA */}
        <div className="bg-indigo-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <i className="fa-solid fa-coins text-amber-300"></i>
          <span>
            Tasa del día:{' '}
            <strong className="font-extrabold">
              1 {refCurr} = {formatCurrencyAmount(rates.primaryRate, primaryCurr)} {primaryCurr}
            </strong>
          </span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 pt-3">
        {/* Buscador y Filtros de Categoría Fijos */}
        <div className="sticky top-[93px] z-20 bg-slate-50/95 backdrop-blur-md pt-2 pb-3 space-y-2.5">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto en el catálogo..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Categorías Horizontales */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {catalogCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* GRILLA DE PRODUCTOS */}
        {visibleCatalogProducts.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-slate-200 my-4 p-6">
            <p className="text-slate-500 text-sm font-medium">
              No se encontraron productos con esa búsqueda.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todos');
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs cursor-pointer"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 mt-2">
            {visibleCatalogProducts.map((p) => {
              const qtyInCart = getProductQtyInCart(p.id);
              const effectiveUnitUSD = getEffectiveKioskUnitPrice(p, qtyInCart > 0 ? qtyInCart : 1);
              const unitPrimary = effectiveUnitUSD * (rates.primaryRate || 1);
              const weighted = isWeightedUnit(p.unit);
              const cartItem = orderItems.find((i) => i.id === p.id);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition duration-200"
                >
                  <div>
                    <div className="relative h-36 sm:h-40 bg-slate-100 overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-700 shadow-2xs">
                        {p.category}
                      </span>
                      {qtyInCart > 0 && (
                        <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-extrabold min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center shadow">
                          {weighted
                            ? cartItem?.weightLabel || formatWeightLabel(qtyInCart, p.unit)
                            : qtyInCart}
                        </span>
                      )}
                      {p.hasTax && p.taxRatePct && p.taxRatePct > 0 && (
                        <span className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                          +{p.taxLabel || 'IVA'} {p.taxRatePct}%
                        </span>
                      )}
                    </div>
                    <div className="p-3 pb-1">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                      {p.brand && p.brand !== 'Genérico' && (
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate">
                          {p.brand}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Precio en Tasa Principal (Grande) + Equivalente en Tasa Referencia (Pequeño) + Botón Agregar */}
                  <div className="p-3 pt-2 flex items-end justify-between gap-1.5 border-t border-slate-100 mt-1">
                    <div className="min-w-0">
                      <span className="block text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate">
                        {formatCurrencyAmount(unitPrimary, primaryCurr)}{' '}
                        <span className="text-[10px] font-bold text-slate-600">{primaryCurr}</span>
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-400 leading-tight">
                        Ref: ${effectiveUnitUSD.toFixed(2)} {refCurr}
                        {weighted ? ' /Kg' : ''}
                      </span>
                    </div>

                    {qtyInCart === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleAddOrIncrement(p)}
                        className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                      >
                        <span>Agregar</span>
                        <span className="text-sm leading-none">+</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-slate-900 rounded-xl p-0.5 text-white shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChangeItemQty(p.id, -1)}
                          className="w-7 h-7 flex items-center justify-center font-bold text-sm hover:bg-slate-700 rounded-lg active:scale-90 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="px-1.5 text-xs font-extrabold">
                          {weighted
                            ? cartItem?.weightLabel || formatWeightLabel(qtyInCart, p.unit)
                            : qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            weighted ? setWeightModalProduct(p) : handleChangeItemQty(p.id, 1)
                          }
                          className="w-7 h-7 flex items-center justify-center font-bold text-sm hover:bg-slate-700 rounded-lg active:scale-90 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BARRA FLOTANTE INFERIOR DEL CARRITO (Muestra Total en Tasa Principal en grande y Tasa Referencia en pequeño) */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-30 px-4 max-w-lg mx-auto">
          <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-2 border border-slate-700">
            <div
              onClick={() => setIsCartModalOpen(true)}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            >
              <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow">
                {totalUnitsCount}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Total a Pagar
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  {/* Tasa Principal en Grande */}
                  <span className="text-base sm:text-lg font-black text-emerald-400 leading-none">
                    {formatCurrencyAmount(totalPrimary, primaryCurr)} {primaryCurr}
                  </span>
                  {/* Equivalente en Tasa Referencia en Pequeño */}
                  <span className="text-[11px] text-slate-300 font-semibold">
                    (Ref: ${totalUSD.toFixed(2)} {refCurr})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmClearCartOpen(true)}
                title="Eliminar carrito"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white transition cursor-pointer"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
              <button
                type="button"
                onClick={() => setIsCartModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <span>Pagar</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR EL CARRITO */}
      {confirmClearCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmClearCartOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                ¿Eliminar todos los productos del carrito?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tu carrito se conserva guardado aunque actualices la página hasta que decidas
                eliminarlo aquí.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmClearCartOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Conservar
              </button>
              <button
                type="button"
                onClick={handleClearEntireCart}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer"
              >
                Sí, Eliminar Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL CARRITO Y PAGO ("Tu Pedido") */}
      {isCartModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsCartModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Tu Pedido ({totalUnitsCount})
                </h2>
                <p className="text-xs text-slate-500">
                  El carrito no se borra al actualizar hasta que le des a Eliminar carrito
                </p>
              </div>
              <div className="flex items-center gap-2">
                {orderItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearCartOpen(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-extrabold px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <i className="fa-solid fa-trash-can text-[11px]"></i>
                    <span>Eliminar carrito</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartModalOpen(false)}
                  className="p-2 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {orderItems.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                    <i className="fa-solid fa-cart-shopping"></i>
                  </div>
                  <p className="text-sm font-bold text-slate-600">Tu carrito está vacío</p>
                  <button
                    type="button"
                    onClick={() => setIsCartModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Explorar productos
                  </button>
                </div>
              ) : (
                <>
                  {/* 1. Lista de Productos Seleccionados */}
                  <div className="space-y-2.5">
                    {orderItems.map((item) => {
                      const unitUSD = getEffectiveKioskUnitPrice(item, item.qty);
                      const lineUSD = unitUSD * item.qty;
                      const linePri = lineUSD * (rates.primaryRate || 1);
                      const weighted = isWeightedUnit(item.unit);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] mt-0.5 flex-wrap">
                              <span className="font-extrabold text-indigo-600">
                                {formatCurrencyAmount(linePri, primaryCurr)} {primaryCurr}
                              </span>
                              <span className="text-slate-400 font-semibold">
                                (Ref: ${lineUSD.toFixed(2)} {refCurr})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleChangeItemQty(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm cursor-pointer"
                            >
                              −
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">
                              {weighted
                                ? item.weightLabel || formatWeightLabel(item.qty, item.unit)
                                : item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                weighted
                                  ? setWeightModalProduct(item)
                                  : handleChangeItemQty(item.id, 1)
                              }
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Resumen Total: Tasa Principal en Grande + Equivalente en Tasa Referencia en Pequeño */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-md">
                    {taxAmountUSD > 0 && (
                      <div className="space-y-1 pb-2 border-b border-slate-800 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Subtotal:</span>
                          <span>
                            {formatCurrencyAmount(subtotalPrimary, primaryCurr)} {primaryCurr}{' '}
                            <span className="text-slate-400">
                              (${subtotalUSD.toFixed(2)} {refCurr})
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between text-amber-300 font-semibold">
                          <span>IVA / Impuesto:</span>
                          <span>
                            +{formatCurrencyAmount(taxAmountPrimary, primaryCurr)} {primaryCurr}{' '}
                            <span className="text-amber-200/80">
                              (+${taxAmountUSD.toFixed(2)} {refCurr})
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">
                          Total a Pagar ({primaryCurr})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Tasa: 1 {refCurr} = {formatCurrencyAmount(rates.primaryRate, primaryCurr)}{' '}
                          {primaryCurr}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 leading-none">
                          {formatCurrencyAmount(totalPrimary, primaryCurr)} {primaryCurr}
                        </div>
                        <div className="text-xs font-bold text-slate-300 mt-1">
                          Equivalente: ${totalUSD.toFixed(2)} {refCurr}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Datos del Cliente */}
                  <div className="space-y-3 pt-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      1. Tus Datos para el Pedido
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setFormError('');
                        }}
                        placeholder="Tu Nombre y Apellido *"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Tu WhatsApp / Teléfono (Opcional)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* 4. Selección de Método de Pago Configurado por la Tienda */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        2. Selecciona el Método de Pago
                      </h3>
                      <span className="text-[11px] font-semibold text-indigo-600">
                        {availablePaymentMethods.length} disponible(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePaymentMethods.map((m) => {
                        const isSelected = selectedPaymentMethod?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMethodId(m.id)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-2xs ring-1 ring-indigo-600'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-base shrink-0">{m.icon || '💳'}</span>
                            <span className="truncate">{m.name || m.title}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Si el modo es 'full_details' y el método tiene datos configurados: mostrar tarjeta para copiar y pegar + referencia opcional */}
                    {paymentDisplayMode === 'full_details' &&
                    selectedPaymentMethod?.paymentDetails?.trim() ? (
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                            <span>{selectedPaymentMethod.icon}</span>
                            <span>Datos para pagar con {selectedPaymentMethod.title}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                selectedPaymentMethod.paymentDetails.trim(),
                                `Datos de ${selectedPaymentMethod.name} copiados`
                              )
                            }
                            className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <i className="fa-solid fa-copy text-[10px]"></i>
                            <span>Copiar datos</span>
                          </button>
                        </div>

                        <div className="bg-white border border-indigo-100 rounded-xl p-2.5 text-xs font-mono text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                          {selectedPaymentMethod.paymentDetails.trim()}
                        </div>

                        {/* Campos opcionales de Referencia y Comprobante */}
                        <div className="space-y-2 pt-1 border-t border-indigo-100">
                          <span className="block text-[11px] font-bold text-indigo-900">
                            Comprobante / Referencia de Pago (Opcional):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              placeholder="N° de Referencia (Opcional)"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={paymentHolder}
                              onChange={(e) => setPaymentHolder(e.target.value)}
                              placeholder="Titular del pago (Opcional)"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <label className="flex items-center justify-between gap-2 w-full px-3 py-2 bg-white border border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-50/40 transition text-xs">
                            <span className="text-slate-600 font-medium truncate">
                              {receiptBase64
                                ? '✓ Captura de pago adjunta'
                                : '📷 Adjuntar captura de pago (Opcional)'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              className="hidden"
                            />
                            {receiptBase64 && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setReceiptBase64(null);
                                }}
                                className="text-rose-500 font-bold text-[11px]"
                              >
                                Quitar
                              </button>
                            )}
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                        <i className="fa-brands fa-whatsapp text-lg text-emerald-600 shrink-0 mt-0.5"></i>
                        <div className="leading-relaxed">
                          Seleccionaste{' '}
                          <strong className="font-extrabold">
                            {selectedPaymentMethod?.title || selectedPaymentMethod?.name}
                          </strong>
                          . Al presionar <strong>Pagar / Enviar Orden</strong> se enviará tu pedido
                          detallado a nuestro WhatsApp indicando este método para enviarte los datos
                          de pago por el chat.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nota o Dirección opcional */}
                  <div>
                    <textarea
                      rows={2}
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Dirección de entrega o nota adicional (opcional)..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  {isSameCartRecentlySent && lastSentCartMeta && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5 shrink-0"></i>
                      <span>
                        Ya este mismo carrito fue enviado hace unos minutos (Orden{' '}
                        <strong>#{lastSentCartMeta.orderNumber}</strong>). Para enviar otra orden,
                        modifica los productos o elimina el carrito.
                      </span>
                    </div>
                  )}

                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
                      <span>{formError}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pie del Modal: Botón Pagar y Redireccionar a WhatsApp */}
            {orderItems.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={handleCheckoutAndSendOrder}
                  className={`w-full font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer ${
                    isSameCartRecentlySent
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-emerald-600/20'
                  }`}
                >
                  <i
                    className={
                      isSameCartRecentlySent
                        ? 'fa-solid fa-circle-check text-lg'
                        : 'fa-brands fa-whatsapp text-lg'
                    }
                  ></i>
                  <span>
                    {isSameCartRecentlySent
                      ? `Ya este mismo carrito fue enviado (#${lastSentCartMeta?.orderNumber})`
                      : `Pagar / Enviar Orden (${formatCurrencyAmount(totalPrimary, primaryCurr)} ${primaryCurr})`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE ORDEN GENERADA CON ÉXITO */}
      {confirmedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmedOrder(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-check"></i>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono font-black text-xs border border-indigo-200">
                ORDEN #{confirmedOrder.orderNumber}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                ¡Orden Enviada a {storeName}!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La tienda ha recibido un aviso automático con tu orden{' '}
                <strong>#{confirmedOrder.orderNumber}</strong> y el método de pago{' '}
                <strong>{confirmedOrder.paymentMethodTitle}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{confirmedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método seleccionado:</span>
                <span className="font-bold text-indigo-600">
                  {confirmedOrder.paymentMethodTitle}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total ({primaryCurr}):</span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatCurrencyAmount(confirmedOrder.totalPrimary, primaryCurr)} {primaryCurr}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Equivalente ({refCurr}):</span>
                <span>
                  ${confirmedOrder.totalUSD.toFixed(2)} {refCurr}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                ✅ Ya este mismo carrito fue enviado hace unos minutos (Orden #{confirmedOrder.orderNumber}).
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmedOrder(null)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Seguir viendo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    handleClearEntireCart();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs cursor-pointer"
                >
                  🗑️ Eliminar carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DATOS BANCARIOS / PAGO PARA COPIAR Y PEGAR */}
      {isPaymentInfoModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsPaymentInfoModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-extrabold text-base text-slate-900">
                Métodos y Datos de Pago
              </h2>
              <button
                type="button"
                onClick={() => setIsPaymentInfoModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              {methodsWithDetails.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <span>{m.icon}</span>
                      <span>{m.title}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(m.paymentDetails.trim(), 'Datos copiados')}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words bg-white p-2.5 rounded-xl border border-indigo-100">
                    {m.paymentDetails.trim()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL DE ÓRDENES DEL CLIENTE */}
      {isHistoryModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="font-extrabold text-base text-slate-900">Mis Órdenes Enviadas</h2>
                <p className="text-xs text-slate-500">
                  Registro de tus pedidos recientes en este dispositivo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {orderHistory.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  Aún no tienes órdenes registradas.
                </p>
              ) : (
                orderHistory.map((ord) => (
                  <div
                    key={ord.id}
                    className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md font-mono">
                          #{ord.id}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2">{ord.date}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ord.paymentMethod}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={`${ord.id}-${idx}`} className="flex justify-between">
                          <span>
                            {it.weightLabel || `${it.qty}x`} {it.name}
                          </span>
                          <span className="font-semibold">
                            ${(it.priceUSD * it.qty).toFixed(2)} {ord.refCurrency}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatCurrencyAmount(ord.totalPrimary, ord.primaryCurrency)}{' '}
                          {ord.primaryCurrency}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5">
                          (${ord.totalUSD.toFixed(2)} {ord.refCurrency})
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PESO / PORCIÓN PARA PRODUCTOS PESADOS */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <WeightSelectorModal
            product={weightModalProduct}
            rates={rates}
            onConfirm={handleConfirmWeightedItem}
            onClose={() => setWeightModalProduct(null)}
          />
        </div>
      )}

      {/* MODAL DE DESBLOQUEO DE MODO KIOSCO (SOLO ADMIN) */}
      {isUnlockModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsUnlockModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-lock text-amber-500"></i>
                <span>Desbloquear Kiosco</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleVerifyPinAndExit} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="Ingresa PIN de administrador"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-lg tracking-widest text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              {pinError && (
                <p className="text-xs text-rose-600 font-bold text-center">{pinError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer"
              >
                Verificar y Volver al Panel
              </button>
              {biometricEnabled && (
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-fingerprint"></i>
                  <span>Desbloquear con Biometría</span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TOAST DE NOTIFICACIÓN RÁPIDA */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
