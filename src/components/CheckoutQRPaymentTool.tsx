import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

export type QRPaymentChannel = 'pagomovil' | 'zelle' | 'binance' | 'transfer';

export interface StoreQRPaymentConfig {
  pagoMovilBankCode: string;
  pagoMovilBankName: string;
  pagoMovilPhone: string;
  pagoMovilDni: string;
  pagoMovilHolder: string;
  zelleEmailOrPhone: string;
  zelleHolder: string;
  binanceIdOrWallet: string;
  binanceHolder: string;
  binanceNetwork: string;
  transferAccount: string;
  transferBank: string;
  transferDni: string;
  transferHolder: string;
}

const COMMON_BANKS = [
  { code: '0102', name: 'Banco de Venezuela (BDV)' },
  { code: '0134', name: 'Banesco' },
  { code: '0105', name: 'Banco Mercantil' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0191', name: 'BNC (Banco Nacional de Crédito)' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0175', name: 'Banco Bicentenario' },
  { code: '0138', name: 'Banco Plaza' },
  { code: '0151', name: 'BFC Fondo Común' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0174', name: 'Banplus' },
  { code: '0115', name: 'Banco Exterior' },
  { code: '0128', name: 'Banco Caroní' },
  { code: 'OTRO', name: 'Otro Banco / Billetera Local' },
];

const DEFAULT_CONFIG: StoreQRPaymentConfig = {
  pagoMovilBankCode: '0102',
  pagoMovilBankName: 'Banco de Venezuela (BDV)',
  pagoMovilPhone: '0412-1234567',
  pagoMovilDni: 'V-12345678',
  pagoMovilHolder: 'Mi Tienda POS',
  zelleEmailOrPhone: 'pagos@mitienda.com',
  zelleHolder: 'Inversiones Mi Tienda LLC',
  binanceIdOrWallet: '284910293',
  binanceHolder: 'MiTienda_Pay',
  binanceNetwork: 'Binance Pay / USDT (TRC20 / BEP20)',
  transferAccount: '0102-0000-00-0000000000',
  transferBank: 'Banco de Venezuela',
  transferDni: 'J-12345678-9',
  transferHolder: 'Mi Tienda C.A.',
};

interface CheckoutQRPaymentToolProps {
  storeId: string;
  storeName: string;
  cartName: string;
  cartTotalUSD: number;
  primaryRate: number;
  primaryCurrency: string;
  secondaryRate: number;
  secondaryCurrency: string;
  showSecondaryRate?: boolean;
  selectedCheckoutMethod: string;
  onSelectCheckoutMethod: (method: string) => void;
  paymentReference: string;
  onPaymentReferenceChange: (ref: string) => void;
  clientPhone?: string;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const CheckoutQRPaymentTool: React.FC<CheckoutQRPaymentToolProps> = ({
  storeId,
  storeName,
  cartName,
  cartTotalUSD,
  primaryRate,
  primaryCurrency,
  secondaryRate,
  secondaryCurrency,
  showSecondaryRate = true,
  selectedCheckoutMethod,
  onSelectCheckoutMethod,
  paymentReference,
  onPaymentReferenceChange,
  clientPhone,
  onShowToast,
}) => {
  const storageKey = `pos_qr_payment_config_${storeId || 'main'}`;

  const [config, setConfig] = useState<StoreQRPaymentConfig>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch {
      // ignore storage errors
    }
    return {
      ...DEFAULT_CONFIG,
      pagoMovilHolder: storeName || DEFAULT_CONFIG.pagoMovilHolder,
      transferHolder: storeName || DEFAULT_CONFIG.transferHolder,
    };
  });

  // Reload config when switching active store branch
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) });
      } else {
        setConfig({
          ...DEFAULT_CONFIG,
          pagoMovilHolder: storeName || DEFAULT_CONFIG.pagoMovilHolder,
          transferHolder: storeName || DEFAULT_CONFIG.transferHolder,
        });
      }
    } catch {
      // ignore
    }
  }, [storageKey, storeName]);

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [isExpandedCustomerView, setIsExpandedCustomerView] = useState<boolean>(false);
  const [pagoMovilQrFormat, setPagoMovilQrFormat] = useState<'standard' | 'sms'>('standard');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Map checkoutMethod to active QR channel
  const activeChannel: QRPaymentChannel = useMemo(() => {
    if (selectedCheckoutMethod === 'zelle') return 'zelle';
    if (selectedCheckoutMethod === 'binance') return 'binance';
    if (selectedCheckoutMethod === 'transfer') return 'transfer';
    return 'pagomovil';
  }, [selectedCheckoutMethod]);

  const handleSelectChannel = (channel: QRPaymentChannel) => {
    setIsOpen(true);
    if (channel === 'pagomovil') {
      onSelectCheckoutMethod('pagomovil');
    } else if (channel === 'zelle') {
      onSelectCheckoutMethod('zelle');
    } else if (channel === 'binance') {
      onSelectCheckoutMethod('binance');
    } else if (channel === 'transfer') {
      onSelectCheckoutMethod('transfer');
    }
  };

  const totalPrimary = useMemo(() => {
    return Number((cartTotalUSD * (primaryRate || 1)).toFixed(2));
  }, [cartTotalUSD, primaryRate]);

  const totalSecondary = useMemo(() => {
    return Number((cartTotalUSD * (secondaryRate || 1)).toFixed(2));
  }, [cartTotalUSD, secondaryRate]);

  const formattedPrimary = useMemo(() => {
    return totalPrimary.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [totalPrimary]);

  const formattedUSD = useMemo(() => {
    return cartTotalUSD.toFixed(2);
  }, [cartTotalUSD]);

  const cleanConcept = useMemo(() => {
    const cleanStore = (storeName || 'Mi Tienda').replace(/[^\w\s-]/gi, '').trim();
    const cleanCart = (cartName || 'Cliente').replace(/[^\w\s-]/gi, '').trim();
    return `${cleanStore} - ${cleanCart}`.slice(0, 48);
  }, [storeName, cartName]);

  // Build dynamic QR payload string based on selected channel and exact cart total
  const qrPayload = useMemo(() => {
    if (activeChannel === 'pagomovil') {
      const cleanPhone = config.pagoMovilPhone.replace(/[^0-9]/g, '');
      const cleanDni = config.pagoMovilDni.replace(/\s+/g, '').toUpperCase();
      if (pagoMovilQrFormat === 'sms') {
        // SMS Pago Movil format supported by major Venezuelan banks (e.g. PAGAR 0102 04121234567 12345678 150.00)
        const dniDigits = cleanDni.replace(/[^0-9]/g, '');
        return `PAGAR ${config.pagoMovilBankCode} ${cleanPhone} ${dniDigits} ${totalPrimary.toFixed(2)}`;
      }
      // Structured Pago Movil QR payload with exact local amount + JSON/URI compatibility
      return JSON.stringify({
        type: 'PAGO_MOVIL',
        bankCode: config.pagoMovilBankCode,
        bankName: config.pagoMovilBankName,
        phone: cleanPhone,
        id: cleanDni,
        holder: config.pagoMovilHolder,
        amount: totalPrimary.toFixed(2),
        currency: primaryCurrency,
        amountUSD: formattedUSD,
        concept: cleanConcept,
      });
    }

    if (activeChannel === 'zelle') {
      // Dynamic Zelle payment payload with recipient, holder, exact USD cart total, and memo
      const recipient = config.zelleEmailOrPhone.trim();
      const holder = config.zelleHolder.trim();
      return `ZELLE|TO:${recipient}|NAME:${holder}|AMOUNT:${formattedUSD}|CURRENCY:USD|MEMO:${cleanConcept}`;
    }

    if (activeChannel === 'binance') {
      // Dynamic Binance Pay / USDT payload
      return `BINANCEPAY|ID:${config.binanceIdOrWallet.trim()}|NAME:${config.binanceHolder.trim()}|NET:${config.binanceNetwork}|AMOUNT:${formattedUSD}|ASSET:USDT|MEMO:${cleanConcept}`;
    }

    // Transferencia Bancaria
    return `TRANSFERENCIA|BANCO:${config.transferBank}|CUENTA:${config.transferAccount}|ID:${config.transferDni}|TITULAR:${config.transferHolder}|MONTO:${totalPrimary.toFixed(2)} ${primaryCurrency}|USD:${formattedUSD}|CONCEPTO:${cleanConcept}`;
  }, [
    activeChannel,
    config,
    pagoMovilQrFormat,
    totalPrimary,
    primaryCurrency,
    formattedUSD,
    cleanConcept,
  ]);

  // Human-readable summary text for 1-click Copy or WhatsApp Share
  const humanReadableSummary = useMemo(() => {
    if (activeChannel === 'pagomovil') {
      return [
        `📲 *DATOS DE PAGO MÓVIL - ${storeName}*`,
        `• *Banco:* ${config.pagoMovilBankCode} - ${config.pagoMovilBankName}`,
        `• *Teléfono:* ${config.pagoMovilPhone}`,
        `• *Cédula / RIF:* ${config.pagoMovilDni}`,
        `• *Monto Exacto:* ${formattedPrimary} ${primaryCurrency} ($${formattedUSD} USD)`,
        `• *Concepto:* ${cleanConcept}`,
      ].join('\n');
    }

    if (activeChannel === 'zelle') {
      return [
        `💜 *DATOS DE PAGO ZELLE - ${storeName}*`,
        `• *Correo / Teléfono:* ${config.zelleEmailOrPhone}`,
        `• *Titular:* ${config.zelleHolder}`,
        `• *Monto Exacto:* $${formattedUSD} USD`,
        `• *Nota / Memo:* ${cleanConcept}`,
      ].join('\n');
    }

    if (activeChannel === 'binance') {
      return [
        `🟡 *DATOS BINANCE PAY / USDT - ${storeName}*`,
        `• *Pay ID / Billetera:* ${config.binanceIdOrWallet}`,
        `• *Usuario / Titular:* ${config.binanceHolder}`,
        `• *Red / Método:* ${config.binanceNetwork}`,
        `• *Monto Exacto:* ${formattedUSD} USDT ($${formattedUSD} USD)`,
        `• *Nota:* ${cleanConcept}`,
      ].join('\n');
    }

    return [
      `🏦 *DATOS DE TRANSFERENCIA - ${storeName}*`,
      `• *Banco:* ${config.transferBank}`,
      `• *Cuenta:* ${config.transferAccount}`,
      `• *RIF / Cédula:* ${config.transferDni}`,
      `• *Titular:* ${config.transferHolder}`,
      `• *Monto Exacto:* ${formattedPrimary} ${primaryCurrency} ($${formattedUSD} USD)`,
    ].join('\n');
  }, [
    activeChannel,
    storeName,
    config,
    formattedPrimary,
    primaryCurrency,
    formattedUSD,
    cleanConcept,
  ]);

  // Generate QR Data URL dynamically whenever payload changes
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload, {
      width: isExpandedCustomerView ? 280 : 196,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [qrPayload, isExpandedCustomerView]);

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
      setIsEditingConfig(false);
      onShowToast('✅ Datos de cobro QR guardados para esta sucursal.');
    } catch {
      onShowToast('No se pudieron guardar los datos en el dispositivo.', 'error');
    }
  };

  const handleCopyPaymentDetails = async () => {
    try {
      await navigator.clipboard.writeText(humanReadableSummary.replace(/\*/g, ''));
      onShowToast('📋 Datos de cobro y monto exacto copiados al portapapeles.');
    } catch {
      onShowToast('No se pudo copiar automáticamente.', 'error');
    }
  };

  const handleCopyPagoMovilRapidFormat = async () => {
    const cleanPhone = config.pagoMovilPhone.replace(/[^0-9]/g, '');
    const cleanDni = config.pagoMovilDni.replace(/[^0-9]/g, '');
    const rapidText = `${config.pagoMovilBankCode} ${cleanPhone} ${cleanDni} ${totalPrimary.toFixed(2)}`;
    try {
      await navigator.clipboard.writeText(rapidText);
      onShowToast('⚡ Pago Móvil Rápido copiado (Banco + Teléfono + Cédula + Monto).');
    } catch {
      onShowToast('No se pudo copiar el texto rápido.', 'error');
    }
  };

  const whatsappShareUrl = useMemo(() => {
    const cleanDigits = (clientPhone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(humanReadableSummary);
    return cleanDigits.length >= 7
      ? `https://wa.me/${cleanDigits}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  }, [clientPhone, humanReadableSummary]);

  const channelBadgeStyles: Record<
    QRPaymentChannel,
    {
      title: string;
      subtitle: string;
      icon: string;
      activeBtn: string;
      cardBorder: string;
      headerBadge: string;
      amountText: string;
    }
  > = {
    pagomovil: {
      title: 'Pago Móvil QR',
      subtitle: `${formattedPrimary} ${primaryCurrency}`,
      icon: 'fa-solid fa-mobile-screen-button',
      activeBtn: 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/25',
      cardBorder: 'border-emerald-500/40',
      headerBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      amountText: 'text-emerald-400',
    },
    zelle: {
      title: 'Zelle USD',
      subtitle: `$${formattedUSD} USD`,
      icon: 'fa-solid fa-bolt-lightning',
      activeBtn: 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/25',
      cardBorder: 'border-violet-500/40',
      headerBadge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      amountText: 'text-violet-300',
    },
    binance: {
      title: 'Binance / USDT',
      subtitle: `${formattedUSD} USDT`,
      icon: 'fa-solid fa-coins',
      activeBtn: 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/25',
      cardBorder: 'border-amber-500/40',
      headerBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      amountText: 'text-amber-400',
    },
    transfer: {
      title: 'Transferencia',
      subtitle: `${formattedPrimary} ${primaryCurrency}`,
      icon: 'fa-solid fa-building-columns',
      activeBtn: 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/25',
      cardBorder: 'border-sky-500/40',
      headerBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      amountText: 'text-sky-400',
    },
  };

  const currentMeta = channelBadgeStyles[activeChannel];

  return (
    <div
      className={`bg-slate-900/95 border ${currentMeta.cardBorder} rounded-2xl p-2.5 sm:p-3 space-y-2.5 transition-all`}
    >
      {/* Top Bar: Title + Toggle QR View + Configure Credentials */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-left cursor-pointer min-w-0 flex-1"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <i className="fa-solid fa-qrcode text-xs"></i>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black text-white tracking-tight">
                Cobro con QR Dinámico
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border ${currentMeta.headerBadge}`}
              >
                {currentMeta.title}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Calculado automáticamente con el total actual del carrito
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsEditingConfig((prev) => !prev);
            }}
            title="Configurar datos de Pago Móvil, Zelle y Binance"
            className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold border cursor-pointer flex items-center gap-1 transition ${
              isEditingConfig
                ? 'bg-amber-500 text-slate-950 border-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <i className="fa-solid fa-sliders text-[10px]"></i>
            <span>Datos</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer text-[10px]"
            title={isOpen ? 'Ocultar generador QR' : 'Mostrar generador QR'}
          >
            <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {/* Method Selector Pills (Pago Móvil, Zelle, Binance, Transferencia) */}
      <div className="grid grid-cols-4 gap-1">
        {(['pagomovil', 'zelle', 'binance', 'transfer'] as QRPaymentChannel[]).map((ch) => {
          const meta = channelBadgeStyles[ch];
          const isSelected = activeChannel === ch;
          return (
            <button
              key={ch}
              type="button"
              onClick={() => handleSelectChannel(ch)}
              className={`py-1.5 px-1.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? meta.activeBtn
                  : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-extrabold leading-tight">
                <i className={`${meta.icon} text-[10px]`}></i>
                <span className="truncate">{meta.title.replace(' QR', '')}</span>
              </div>
              <span
                className={`text-[9px] font-black truncate max-w-full ${
                  isSelected ? 'opacity-95' : 'text-slate-400'
                }`}
              >
                {meta.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {isOpen && (
        <>
          {/* Merchant Credentials Editor (Collapsible) */}
          {isEditingConfig && (
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-2.5 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-gear"></i>
                  Configurar Cuentas Receptoras ({storeName})
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingConfig(false)}
                  className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {activeChannel === 'pagomovil' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Banco Pago Móvil
                    </label>
                    <select
                      value={config.pagoMovilBankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const found = COMMON_BANKS.find((b) => b.code === code);
                        setConfig((prev) => ({
                          ...prev,
                          pagoMovilBankCode: code,
                          pagoMovilBankName: found ? found.name : prev.pagoMovilBankName,
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[11px] font-bold"
                    >
                      {COMMON_BANKS.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.code} - {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Teléfono Pago Móvil
                    </label>
                    <input
                      type="tel"
                      value={config.pagoMovilPhone}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, pagoMovilPhone: e.target.value }))
                      }
                      placeholder="0412-1234567"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Cédula o RIF
                    </label>
                    <input
                      type="text"
                      value={config.pagoMovilDni}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, pagoMovilDni: e.target.value }))
                      }
                      placeholder="V-12345678 / J-123456789"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                </div>
              )}

              {activeChannel === 'zelle' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Correo o Teléfono Zelle
                    </label>
                    <input
                      type="text"
                      value={config.zelleEmailOrPhone}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, zelleEmailOrPhone: e.target.value }))
                      }
                      placeholder="pagos@mitienda.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Nombre del Titular Zelle
                    </label>
                    <input
                      type="text"
                      value={config.zelleHolder}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, zelleHolder: e.target.value }))
                      }
                      placeholder="Nombre o Empresa en Zelle"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                </div>
              )}

              {activeChannel === 'binance' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Binance Pay ID / Correo / Wallet
                    </label>
                    <input
                      type="text"
                      value={config.binanceIdOrWallet}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, binanceIdOrWallet: e.target.value }))
                      }
                      placeholder="ID de Binance o Wallet USDT"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Alias / Titular Binance
                    </label>
                    <input
                      type="text"
                      value={config.binanceHolder}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, binanceHolder: e.target.value }))
                      }
                      placeholder="MiTienda_Pay"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                </div>
              )}

              {activeChannel === 'transfer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Banco Receptor
                    </label>
                    <input
                      type="text"
                      value={config.transferBank}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, transferBank: e.target.value }))
                      }
                      placeholder="Banco de Venezuela / Banesco"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      RIF / Cédula
                    </label>
                    <input
                      type="text"
                      value={config.transferDni}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, transferDni: e.target.value }))
                      }
                      placeholder="J-12345678-9"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">
                      Número de Cuenta / CBU / CLABE
                    </label>
                    <input
                      type="text"
                      value={config.transferAccount}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, transferAccount: e.target.value }))
                      }
                      placeholder="0102-0000-00-0000000000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Guardar Datos de Cobro</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Dynamic QR Card + Payment Credentials */}
          <div
            className={`bg-slate-950/75 border border-slate-800 rounded-xl p-2.5 flex ${
              isExpandedCustomerView
                ? 'flex-col items-center text-center'
                : 'flex-col sm:flex-row items-center'
            } gap-3`}
          >
            {/* QR Image Wrapper */}
            <div className="flex flex-col items-center shrink-0">
              <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-white relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR ${currentMeta.title}`}
                    className={`${
                      isExpandedCustomerView ? 'w-52 h-52' : 'w-32 h-32 sm:w-36 sm:h-36'
                    } object-contain rounded-lg block`}
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-[10px]">
                    Generando QR...
                  </div>
                )}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider whitespace-nowrap shadow">
                  {currentMeta.title}
                </span>
              </div>

              <div className="flex items-center gap-1 mt-2.5">
                <button
                  type="button"
                  onClick={() => setIsExpandedCustomerView((prev) => !prev)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9px] font-bold cursor-pointer flex items-center gap-1"
                >
                  <i
                    className={`fa-solid ${
                      isExpandedCustomerView ? 'fa-compress' : 'fa-expand'
                    }`}
                  ></i>
                  <span>{isExpandedCustomerView ? 'Vista Compacta' : 'Ampliar QR'}</span>
                </button>

                {activeChannel === 'pagomovil' && (
                  <button
                    type="button"
                    onClick={() =>
                      setPagoMovilQrFormat((prev) =>
                        prev === 'standard' ? 'sms' : 'standard'
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[9px] font-bold cursor-pointer"
                    title="Cambiar entre formato QR Bancario y formato SMS Pago Móvil"
                  >
                    {pagoMovilQrFormat === 'standard' ? 'Modo: App Banco' : 'Modo: SMS Pago'}
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Total + Credentials Breakdown */}
            <div className="flex-1 min-w-0 w-full space-y-2">
              {/* Highlighted Exact Amount to Pay */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 flex items-center justify-between gap-2">
                <div className="text-left">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
                    Monto Exacto en QR:
                  </span>
                  {activeChannel === 'pagomovil' || activeChannel === 'transfer' ? (
                    <div>
                      <span className={`text-sm sm:text-base font-black ${currentMeta.amountText}`}>
                        {formattedPrimary} {primaryCurrency}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Equivalente a ${formattedUSD} USD
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className={`text-sm sm:text-base font-black ${currentMeta.amountText}`}>
                        ${formattedUSD} {activeChannel === 'binance' ? 'USDT' : 'USD'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        ({formattedPrimary} {primaryCurrency})
                      </span>
                    </div>
                  )}
                </div>

                {showSecondaryRate && secondaryRate > 0 && (
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-bold block">
                      Ref. {secondaryCurrency}
                    </span>
                    <span className="text-[11px] font-extrabold text-violet-300">
                      {totalSecondary.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {secondaryCurrency}
                    </span>
                  </div>
                )}
              </div>

              {/* Channel Specific Details */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1 text-[11px] text-left">
                {activeChannel === 'pagomovil' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Banco:</span>
                      <span className="font-extrabold text-white truncate">
                        {config.pagoMovilBankCode} - {config.pagoMovilBankName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Teléfono:</span>
                      <span className="font-black text-emerald-400 tracking-wide">
                        {config.pagoMovilPhone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Cédula / RIF:</span>
                      <span className="font-extrabold text-white">{config.pagoMovilDni}</span>
                    </div>
                  </>
                )}

                {activeChannel === 'zelle' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Correo / Tel.:</span>
                      <span className="font-black text-violet-300 truncate">
                        {config.zelleEmailOrPhone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Titular Zelle:</span>
                      <span className="font-extrabold text-white truncate">
                        {config.zelleHolder}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Memo Sugerido:</span>
                      <span className="font-bold text-slate-300 truncate">{cleanConcept}</span>
                    </div>
                  </>
                )}

                {activeChannel === 'binance' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Pay ID / Wallet:</span>
                      <span className="font-black text-amber-300 truncate">
                        {config.binanceIdOrWallet}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Usuario / Alias:</span>
                      <span className="font-extrabold text-white truncate">
                        {config.binanceHolder}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Red:</span>
                      <span className="font-bold text-slate-300 truncate">
                        {config.binanceNetwork}
                      </span>
                    </div>
                  </>
                )}

                {activeChannel === 'transfer' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Banco:</span>
                      <span className="font-extrabold text-white truncate">
                        {config.transferBank}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Cuenta:</span>
                      <span className="font-black text-sky-300 truncate">
                        {config.transferAccount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">RIF / Cédula:</span>
                      <span className="font-extrabold text-white">{config.transferDni}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons: Copy Data, Pago Movil Rapid Copy, WhatsApp Share */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPaymentDetails}
                  className="flex-1 min-w-[115px] py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-[10px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <i className="fa-regular fa-copy text-emerald-400"></i>
                  <span>Copiar Datos + Monto</span>
                </button>

                {activeChannel === 'pagomovil' && (
                  <button
                    type="button"
                    onClick={handleCopyPagoMovilRapidFormat}
                    title="Copiar en una línea para Pago Móvil Rápido"
                    className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold cursor-pointer flex items-center justify-center gap-1"
                  >
                    <i className="fa-solid fa-bolt"></i>
                    <span>Copia Rápida</span>
                  </button>
                )}

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 text-[10px] font-extrabold flex items-center justify-center gap-1"
                  title="Enviar datos de cobro y monto por WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Optional Payment Reference / Confirmation Number */}
          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <i className="fa-solid fa-hashtag text-emerald-400"></i>
              Ref. / Comprobante:
            </span>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => onPaymentReferenceChange(e.target.value)}
              placeholder="Ej. Últimos 4 o 6 dígitos de Pago Móvil / Zelle (opcional)"
              className="flex-1 min-w-0 bg-transparent text-white font-bold text-[11px] focus:outline-none placeholder:text-slate-600"
            />
            {paymentReference && (
              <button
                type="button"
                onClick={() => onPaymentReferenceChange('')}
                className="text-[10px] text-slate-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
