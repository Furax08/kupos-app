import React, { useState } from 'react';
import {
  ShoppingCart,
  User,
  Plus,
  Minus,
  Trash2,
  Search,
  Volume2,
  VolumeX,
  CheckCircle2,
  Edit3,
  X,
  Receipt,
  PackagePlus,
} from 'lucide-react';
import {
  ExchangeRatesData,
  PaymentMethodType,
  PosCart,
  Product,
  RateSettings,
} from '../types';
import { MultiRatePrice } from './MultiRatePrice';
import { calculateMultiPrice } from '../utils/currencyFormatter';
import { soundFX } from '../utils/soundEffects';

interface PosTerminalProps {
  products: Product[];
  carts: PosCart[];
  activeCartId: 1 | 2 | 3 | 4 | 5;
  rateSettings: RateSettings;
  exchangeRates: ExchangeRatesData;
  onSelectCart: (cartId: 1 | 2 | 3 | 4 | 5) => void;
  onUpdateCarts: (updatedCarts: PosCart[]) => void;
  onQuickCreateProduct: (product: Partial<Product>) => Promise<Product | null>;
  onCheckoutCart: (payload: {
    cartId: 1 | 2 | 3 | 4 | 5;
    customerName: string;
    customerDocument: string;
    customerPhone: string;
    paymentMethod: PaymentMethodType;
    totalRef: number;
    totalPrimary: number;
    totalSecondary: number;
  }) => Promise<void>;
}

const PAYMENT_METHODS: PaymentMethodType[] = [
  'Efectivo',
  'Pago Móvil / Transferencia',
  'Punto de Venta',
  'Binance Pay',
  'Cripto Directo',
  'Crédito (Por Cobrar)',
];

const QUICK_CATEGORIES = [
  'Alimentos y Bebidas',
  'Víveres',
  'Charcutería',
  'Tecnología',
  'Hogar y Ferretería',
  'General',
];

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  carts,
  activeCartId,
  rateSettings,
  exchangeRates,
  onSelectCart,
  onUpdateCarts,
  onQuickCreateProduct,
  onCheckoutCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundFX.enabled);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
  const [processingSale, setProcessingSale] = useState(false);
  const [lastCompletedSummary, setLastCompletedSummary] = useState<string | null>(null);

  // Quick Add Product Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPriceRef, setQuickPriceRef] = useState('3');
  const [quickCostRef, setQuickCostRef] = useState('1.8');
  const [quickStock, setQuickStock] = useState('25');
  const [quickUnit, setQuickUnit] = useState('und');
  const [quickCategory, setQuickCategory] = useState('Alimentos y Bebidas');
  const [quickSku, setQuickSku] = useState('');
  const [addImmediatelyToCart, setAddImmediatelyToCart] = useState(true);
  const [initialCartQty, setInitialCartQty] = useState('1');
  const [savingQuickProduct, setSavingQuickProduct] = useState(false);

  const activeCart =
    carts.find((c) => c.cartId === activeCartId) || {
      cartId: activeCartId,
      customerName: `Cliente ${activeCartId}`,
      customerDocument: '',
      customerPhone: '',
      items: [],
      updatedAt: new Date().toISOString(),
    };

  const categories = [
    'Todos',
    ...Array.from(new Set(products.map((p) => p.category || 'General'))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || (p.category || 'General') === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate active cart totals
  const activeCartTotalRef = activeCart.items.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.productId);
    return sum + (prod ? prod.priceRef * item.quantity : 0);
  }, 0);

  const activeCartTotalUnits = activeCart.items.reduce((sum, item) => sum + item.quantity, 0);

  const formattedCartTotal = calculateMultiPrice(
    activeCartTotalRef,
    rateSettings,
    exchangeRates
  );

  const handleToggleSound = () => {
    soundFX.enabled = !soundEnabled;
    setSoundEnabled(soundFX.enabled);
  };

  const handleSwitchCart = (cartId: 1 | 2 | 3 | 4 | 5) => {
    soundFX.playCartSwitch();
    onSelectCart(cartId);
  };

  const handleCustomerNameChange = (newName: string) => {
    const nextCarts = carts.map((c) =>
      c.cartId === activeCartId
        ? { ...c, customerName: newName, updatedAt: new Date().toISOString() }
        : c
    );
    onUpdateCarts(nextCarts);
  };

  const handleCustomerDetailsChange = (field: 'customerDocument' | 'customerPhone', val: string) => {
    const nextCarts = carts.map((c) =>
      c.cartId === activeCartId
        ? { ...c, [field]: val, updatedAt: new Date().toISOString() }
        : c
    );
    onUpdateCarts(nextCarts);
  };

  const handleAddProductToActiveCart = (product: Product, delta: number = 1) => {
    if (delta > 0) {
      soundFX.playAddProduct();
    }

    const nextCarts = carts.map((cart) => {
      if (cart.cartId !== activeCartId) return cart;

      const existingIdx = cart.items.findIndex((i) => i.productId === product.id);
      const nextItems = [...cart.items];

      if (existingIdx > -1) {
        const updatedQty = nextItems[existingIdx].quantity + delta;
        if (updatedQty <= 0) {
          nextItems.splice(existingIdx, 1);
        } else {
          nextItems[existingIdx] = {
            ...nextItems[existingIdx],
            quantity: updatedQty,
          };
        }
      } else if (delta > 0) {
        nextItems.push({ productId: product.id, quantity: delta });
      }

      return {
        ...cart,
        items: nextItems,
        updatedAt: new Date().toISOString(),
      };
    });

    onUpdateCarts(nextCarts);
  };

  const openQuickAddModal = (prefillName = '') => {
    setQuickName(prefillName);
    setQuickPriceRef('3');
    setQuickCostRef('1.8');
    setQuickStock('25');
    setQuickUnit('und');
    setQuickSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setAddImmediatelyToCart(true);
    setInitialCartQty('1');
    setIsQuickAddOpen(true);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    setSavingQuickProduct(true);

    try {
      const priceVal = parseFloat(quickPriceRef) || 0;
      const costVal = parseFloat(quickCostRef) || Number((priceVal * 0.6).toFixed(2));
      const stockVal = parseInt(quickStock, 10) || 1;
      const qtyToCart = Math.max(1, parseInt(initialCartQty, 10) || 1);

      const createdProduct = await onQuickCreateProduct({
        name: quickName.trim(),
        sku: quickSku.trim() || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        category: quickCategory.trim() || 'General',
        priceRef: priceVal,
        costRef: costVal,
        stock: stockVal,
        unit: quickUnit.trim() || 'und',
      });

      if (createdProduct && addImmediatelyToCart) {
        handleAddProductToActiveCart(createdProduct, qtyToCart);
      }

      setIsQuickAddOpen(false);
      setSearchQuery('');
    } finally {
      setSavingQuickProduct(false);
    }
  };

  const handleCancelActiveCart = () => {
    soundFX.playCancelCart();
    const nextCarts = carts.map((cart) =>
      cart.cartId === activeCartId
        ? {
            ...cart,
            customerName: `Cliente ${activeCartId}`,
            customerDocument: '',
            customerPhone: '',
            items: [],
            updatedAt: new Date().toISOString(),
          }
        : cart
    );
    onUpdateCarts(nextCarts);
    setIsDrawerOpen(false);
  };

  const handleChargeActiveCart = async () => {
    if (activeCart.items.length === 0) return;
    setProcessingSale(true);

    try {
      // Play Cash Register "Cha-Ching!" bell & drawer sound
      soundFX.playCashRegister();

      await onCheckoutCart({
        cartId: activeCartId,
        customerName: activeCart.customerName.trim() || `Cliente ${activeCartId}`,
        customerDocument: activeCart.customerDocument || '',
        customerPhone: activeCart.customerPhone || '',
        paymentMethod,
        totalRef: activeCartTotalRef,
        totalPrimary: formattedCartTotal.primaryValue,
        totalSecondary: formattedCartTotal.secondaryValue || 0,
      });

      setLastCompletedSummary(
        `Venta cobrada (${activeCart.customerName}) por ${formattedCartTotal.primaryText} (${formattedCartTotal.referenceText})`
      );
      setIsDrawerOpen(false);
      setTimeout(() => setLastCompletedSummary(null), 5000);
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 5 Simultaneous Persistent Liquid Carts Selector Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-amber-700">
              Sistema Multi-Carrito Persistente (Máximo 5 Carritos Simultáneos)
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              Selecciona un Carrito y toca productos para sumar
            </h2>
            <p className="text-xs text-slate-500">
              Los 5 carritos conservan sus productos aunque actualices la página o cierres la
              aplicación. Solo se vacían al cobrar o darle a <strong>Cancelar Carrito 🛒</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openQuickAddModal('')}
              className="liquid-btn-active px-3.5 py-2 rounded-2xl text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Producto Rápido</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              className="liquid-btn px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Efectos de sonido de Caja Registradora"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>Sonido Caja: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>Sonido: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tactile Liquid Button Tray for the 5 Customer Carts (inspired by LIQUID BUTTON image) */}
        <div className="liquid-tray p-2.5 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {carts.map((cart) => {
            const isSelected = cart.cartId === activeCartId;
            const unitCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);
            const cartRefSum = cart.items.reduce((acc, i) => {
              const p = products.find((prod) => prod.id === i.productId);
              return acc + (p ? p.priceRef * i.quantity : 0);
            }, 0);
            const cartMulti = calculateMultiPrice(cartRefSum, rateSettings, exchangeRates);

            return (
              <button
                key={cart.cartId}
                type="button"
                onClick={() => handleSwitchCart(cart.cartId)}
                className={`p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected ? 'liquid-btn-active text-slate-900' : 'liquid-btn text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-extrabold truncate">{cart.customerName}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold opacity-75 shrink-0">
                    #{cart.cartId}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-black/10 flex items-baseline justify-between gap-2 w-full font-mono tabular-nums">
                  <span className="text-[11px] font-bold">
                    {unitCount === 0 ? 'Vacío' : `${unitCount} prod.`}
                  </span>
                  <span className="text-xs font-extrabold truncate">
                    {unitCount > 0 ? cartMulti.primaryText : '0'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Cart Customer Name Editor & Quick Actions */}
        <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Nombre en Carrito #{activeCartId}:
            </div>
            <div className="relative flex-1">
              <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={activeCart.customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                placeholder={`Cliente ${activeCartId}`}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {activeCart.items.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCancelActiveCart}
                  className="liquid-btn px-4 py-2 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancelar Carrito 🛒</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="liquid-btn-active px-4 py-2 rounded-xl text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>
                    Ver y Cobrar ({activeCartTotalUnits}) · {formattedCartTotal.primaryText}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sale Completed Toast Banner */}
      {lastCompletedSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-bold text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastCompletedSummary}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastCompletedSummary(null)}
            className="text-emerald-700 hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Search, Quick Add Button & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto por nombre o código SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => openQuickAddModal(searchQuery.trim())}
            className="liquid-btn px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Crear producto al instante sin salir del POS"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Crear Rápido</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'liquid-btn-active text-slate-900'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid for Tapping & Enumerating Quantities per Active Cart */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-3">
          <div className="text-base font-bold text-slate-800">
            No se encontraron productos con ese filtro
          </div>
          <div className="text-xs text-slate-500">
            Puedes crearlo al instante sin salir de esta pantalla de ventas:
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => openQuickAddModal(searchQuery.trim())}
              className="liquid-btn-active px-5 py-2.5 rounded-2xl text-xs font-extrabold text-slate-900 inline-flex items-center gap-2 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>
                + Crear Producto Rápido{' '}
                {searchQuery.trim() ? `"${searchQuery.trim()}"` : ''}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const cartEntry = activeCart.items.find((i) => i.productId === product.id);
            const qtyInActiveCart = cartEntry ? cartEntry.quantity : 0;

            return (
              <div
                key={product.id}
                onClick={() => handleAddProductToActiveCart(product, 1)}
                className={`group rounded-3xl p-5 transition-all cursor-pointer flex flex-col justify-between select-none ${
                  qtyInActiveCart > 0
                    ? 'bg-amber-50/75 border-2 border-amber-400 shadow-sm'
                    : 'bg-white border border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Top Metadata & Quantity Guidance Indicator */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px] font-medium text-slate-500 font-mono">
                      {product.sku} · {product.category} · Stock: {product.stock}
                    </div>

                    {qtyInActiveCart > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="liquid-btn-active px-2.5 py-1 rounded-xl flex items-center gap-2 text-xs font-extrabold text-slate-900 font-mono shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleAddProductToActiveCart(product, -1)}
                          className="w-5 h-5 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span>{qtyInActiveCart} en carrito</span>
                        <button
                          type="button"
                          onClick={() => handleAddProductToActiveCart(product, 1)}
                          className="w-5 h-5 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-700 transition-colors">
                        + Tocar para sumar
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-2 font-display leading-snug">
                    {product.name}
                  </h3>
                </div>

                {/* Bottom Multi-Rate Price Display */}
                <div className="mt-5 pt-3.5 border-t border-slate-200/70 flex items-end justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    {qtyInActiveCart > 0 ? (
                      <span className="font-bold text-amber-900">
                        Subtotal ({qtyInActiveCart}x):{' '}
                        {
                          calculateMultiPrice(
                            product.priceRef * qtyInActiveCart,
                            rateSettings,
                            exchangeRates
                          ).primaryText
                        }
                      </span>
                    ) : (
                      <span>Precio por {product.unit}</span>
                    )}
                  </div>

                  <MultiRatePrice
                    priceRef={product.priceRef}
                    settings={rateSettings}
                    rates={exchangeRates}
                    size="md"
                    align="right"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cart Button (Botón Flotante 🛒 when products are added) */}
      {activeCartTotalUnits > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="liquid-btn-active px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-extrabold text-sm">
              {activeCartTotalUnits}
            </div>
            <div className="text-left pr-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">
                🛒 Carrito #{activeCartId} · {activeCart.customerName}
              </div>
              <div className="text-base font-extrabold font-mono tabular-nums text-slate-900">
                {formattedCartTotal.primaryText}{' '}
                <span className="text-xs font-bold opacity-80">
                  ({formattedCartTotal.refAndSecondaryLine})
                </span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Quick Add Product Modal (On-the-fly Product Creation inside POS) */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-amber-700">
                  Creación Instantánea desde el POS
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  + Agregar Producto Rápido (Quick Add)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Ej. Bebida Energética 355ml"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio en Tasa Ref ({rateSettings.referenceCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quickPriceRef}
                    onChange={(e) => {
                      setQuickPriceRef(e.target.value);
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num) && num > 0) {
                        setQuickCostRef((num * 0.6).toFixed(2));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  >
                    {QUICK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    required
                    value={quickStock}
                    onChange={(e) => setQuickStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidad
                  </label>
                  <input
                    type="text"
                    value={quickUnit}
                    onChange={(e) => setQuickUnit(e.target.value)}
                    placeholder="und, kg..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={quickSku}
                    onChange={(e) => setQuickSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Add Immediately to Active Cart Option */}
              <div className="liquid-tray p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addImmediatelyToCart}
                    onChange={(e) => setAddImmediatelyToCart(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Sumar al instante al Carrito #{activeCartId} ({activeCart.customerName})
                  </span>
                </label>

                {addImmediatelyToCart && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">Cant:</span>
                    <input
                      type="number"
                      min={1}
                      value={initialCartQty}
                      onChange={(e) => setInitialCartQty(e.target.value)}
                      className="w-16 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Live Multi-Rate Price Preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <div>Vista previa Multi-Tasa:</div>
                  <div className="text-[11px] text-slate-400">
                    Se guardará en Inventario y Catálogo
                  </div>
                </div>
                <MultiRatePrice
                  priceRef={parseFloat(quickPriceRef) || 0}
                  settings={rateSettings}
                  rates={exchangeRates}
                  size="sm"
                  align="right"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="liquid-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingQuickProduct}
                  className="liquid-btn-active px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>
                    {savingQuickProduct
                      ? 'Creando...'
                      : addImmediatelyToCart
                      ? `Crear y Sumar al Carrito #${activeCartId}`
                      : 'Crear Producto'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Over Checkout & Cart Management Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col justify-between p-6 overflow-y-auto shadow-2xl">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold text-amber-700">
                    Carrito Persistente #{activeCartId}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-display">
                    {activeCart.customerName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info inside Cart */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Nombre Cliente
                  </label>
                  <input
                    type="text"
                    value={activeCart.customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Cédula / DNI
                  </label>
                  <input
                    type="text"
                    value={activeCart.customerDocument || ''}
                    onChange={(e) =>
                      handleCustomerDetailsChange('customerDocument', e.target.value)
                    }
                    placeholder="Opcional"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={activeCart.customerPhone || ''}
                    onChange={(e) => handleCustomerDetailsChange('customerPhone', e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activeCart.items.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  if (!prod) return null;
                  const itemSubtotalRef = prod.priceRef * item.quantity;
                  const itemMulti = calculateMultiPrice(
                    itemSubtotalRef,
                    rateSettings,
                    exchangeRates
                  );

                  return (
                    <div
                      key={item.productId}
                      className="p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{prod.name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {item.quantity} x {prod.priceRef}
                          {rateSettings.referenceCurrency === 'USD' ? '$' : '€'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddProductToActiveCart(prod, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-extrabold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddProductToActiveCart(prod, 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right font-mono tabular-nums min-w-[96px]">
                        <div className="text-xs font-extrabold text-slate-900">
                          {itemMulti.primaryText}
                        </div>
                        <div className="text-[11px] text-slate-500">{itemMulti.referenceText}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  Método de Cobro (Si eliges Crédito, pasará a Cuentas Pendientes / Deudores)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold text-left cursor-pointer truncate ${
                        paymentMethod === method
                          ? 'liquid-btn-active text-slate-900'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Summary Multi-Rate & Action Buttons */}
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500">Total a Pagar</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Calculado en todas tus tasas activas
                  </div>
                </div>
                <MultiRatePrice
                  priceRef={activeCartTotalRef}
                  settings={rateSettings}
                  rates={exchangeRates}
                  size="lg"
                  align="right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCancelActiveCart}
                  className="liquid-btn py-3.5 px-4 rounded-2xl text-xs font-bold text-red-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Cancelar Carrito 🛒</span>
                </button>

                <button
                  type="button"
                  disabled={processingSale}
                  onClick={handleChargeActiveCart}
                  className="liquid-btn-active py-3.5 px-5 rounded-2xl text-sm font-extrabold text-slate-900 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{processingSale ? 'Cobrando...' : 'Cobrar Carrito 🔔'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
