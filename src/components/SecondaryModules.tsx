import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  CheckCircle2,
  DollarSign,
  Receipt,
  Share2,
  ShoppingBag,
  Phone,
  MapPin,
  Check,
  X,
  BarChart3,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  DebtorRecord,
  ExchangeRatesData,
  Product,
  RateSettings,
  SaleRecord,
  StoreProfile,
} from '../types';
import { MultiRatePrice } from './MultiRatePrice';
import { calculateMultiPrice, formatFiatNumber } from '../utils/currencyFormatter';
import { soundFX } from '../utils/soundEffects';

// --- 1. CUENTAS PENDIENTES (DEUDORES) ---
interface DebtorsModuleProps {
  debtors: DebtorRecord[];
  rateSettings: RateSettings;
  exchangeRates: ExchangeRatesData;
  onAddDebtor: (payload: {
    customerName: string;
    documentNumber: string;
    phone: string;
    itemsSummary: string;
    totalDebtRef: number;
  }) => Promise<void>;
  onPayDebt: (payload: {
    debtorId: string;
    amountRef: number;
    method: string;
    note: string;
  }) => Promise<void>;
}

export const DebtorsModule: React.FC<DebtorsModuleProps> = ({
  debtors,
  rateSettings,
  exchangeRates,
  onAddDebtor,
  onPayDebt,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [payingDebtor, setPayingDebtor] = useState<DebtorRecord | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [totalDebtRef, setTotalDebtRef] = useState('10');

  const [payAmountRef, setPayAmountRef] = useState('');
  const [payMethod, setPayMethod] = useState('Pago Móvil / Transferencia');
  const [payNote, setPayNote] = useState('');

  const totalPendingRef = debtors
    .filter((d) => d.status === 'pending')
    .reduce((acc, d) => acc + (d.totalDebtRef - d.paidAmountRef), 0);

  const totalPendingMulti = calculateMultiPrice(
    totalPendingRef,
    rateSettings,
    exchangeRates
  );

  const handleCreateDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    await onAddDebtor({
      customerName: customerName.trim(),
      documentNumber: documentNumber.trim() || 'S/D',
      phone: phone.trim(),
      itemsSummary: itemsSummary.trim() || 'Mercancía a crédito',
      totalDebtRef: parseFloat(totalDebtRef) || 0,
    });
    setCustomerName('');
    setDocumentNumber('');
    setPhone('');
    setItemsSummary('');
    setShowAddModal(false);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebtor) return;
    soundFX.playCashRegister();
    await onPayDebt({
      debtorId: payingDebtor.id,
      amountRef: parseFloat(payAmountRef) || 0,
      method: payMethod,
      note: payNote,
    });
    setPayingDebtor(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-700">Control de Crédito y Cobranzas</div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Cuentas Pendientes · Deudores ({debtors.filter((d) => d.status === 'pending').length}{' '}
            activas)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            El saldo pendiente se indexa en tu Tasa de Referencia ({rateSettings.referenceCurrency})
            y se recalcula al instante a la Tasa Primaria ({rateSettings.primaryCurrency}) del día.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono pr-2">
            <div className="text-[11px] text-slate-500">Total por Cobrar Hoy</div>
            <div className="text-lg font-extrabold text-amber-800">
              {totalPendingMulti.primaryText}
            </div>
            <div className="text-xs text-slate-500">{totalPendingMulti.refAndSecondaryLine}</div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="liquid-btn-active px-4 py-3 rounded-2xl text-xs font-extrabold text-slate-900 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Deudor</span>
          </button>
        </div>
      </div>

      {/* Debtors Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {debtors.map((d) => {
          const remainingRef = Math.max(0, Number((d.totalDebtRef - d.paidAmountRef).toFixed(2)));
          return (
            <div
              key={d.id}
              className={`bg-white border rounded-3xl p-6 flex flex-col justify-between space-y-4 ${
                d.status === 'paid' ? 'border-emerald-200 opacity-75' : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    Doc: {d.documentNumber} {d.phone ? `· Tel: ${d.phone}` : ''}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-display mt-0.5">
                    {d.customerName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">{d.itemsSummary}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 mb-0.5">
                    {d.status === 'paid' ? 'Deuda Pagada' : 'Saldo Pendiente'}
                  </div>
                  <MultiRatePrice
                    priceRef={remainingRef}
                    settings={rateSettings}
                    rates={exchangeRates}
                    size="sm"
                    align="right"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-xs font-mono text-slate-500">
                  Total inicial: {d.totalDebtRef.toFixed(2)}
                  {rateSettings.referenceCurrency === 'USD' ? '$' : '€'} · Abonado:{' '}
                  {d.paidAmountRef.toFixed(2)}
                  {rateSettings.referenceCurrency === 'USD' ? '$' : '€'}
                </div>

                {d.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPayingDebtor(d);
                      setPayAmountRef(remainingRef.toString());
                    }}
                    className="liquid-btn-active px-4 py-2 rounded-xl text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Abonar / Cobrar 🔔</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Solvente</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Debtor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                Registrar Cuenta Pendiente (Deudor)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebtor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Pedro Luis Castillo"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cédula / DNI
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="V-15000000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+58 412..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detalle de Productos Llevados
                </label>
                <input
                  type="text"
                  required
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  placeholder="Ej. 2x Harina, 1x Aceite de Oliva"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto Deuda en Tasa Referencia ({rateSettings.referenceCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={totalDebtRef}
                  onChange={(e) => setTotalDebtRef(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="liquid-btn px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="liquid-btn-active px-5 py-2 rounded-xl text-xs font-extrabold text-slate-900 cursor-pointer"
                >
                  Guardar Deudor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {payingDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-amber-700">Registrar Cobro</div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  {payingDebtor.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayingDebtor(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto a Abonar ({rateSettings.referenceCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmountRef}
                  onChange={(e) => setPayAmountRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Pago Recibido
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Pago Móvil / Transferencia">Pago Móvil / Transferencia</option>
                  <option value="Binance Pay">Binance Pay</option>
                  <option value="Punto de Venta">Punto de Venta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nota / Referencia
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Abono o pago total"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingDebtor(null)}
                  className="liquid-btn px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="liquid-btn-active px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 cursor-pointer"
                >
                  Confirmar Cobro 🔔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. HISTORIAL DE VENTAS Y MÉTRICAS CON RECHARTS ---
interface SalesHistoryModuleProps {
  sales: SaleRecord[];
  rateSettings: RateSettings;
  exchangeRates: ExchangeRatesData;
}

interface ChartPoint {
  label: string;
  fullLabel: string;
  ingresosPrimaria: number;
  ingresosRef: number;
  operaciones: number;
}

export const SalesHistoryModule: React.FC<SalesHistoryModuleProps> = ({
  sales,
  rateSettings,
  exchangeRates,
}) => {
  const [chartView, setChartView] = useState<'both' | 'daily' | 'monthly'>('both');
  const [searchCustomer, setSearchCustomer] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const availablePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    sales.forEach((s) => {
      if (s.paymentMethod) methods.add(s.paymentMethod);
    });
    return Array.from(methods);
  }, [sales]);

  const filteredSales = useMemo(() => {
    const q = searchCustomer.trim().toLowerCase();
    return sales.filter((sale) => {
      if (q) {
        const matchName = (sale.customerName || '').toLowerCase().includes(q);
        const matchItems = (sale.items || []).some((it) =>
          (it.name || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchItems) return false;
      }
      if (filterPaymentMethod !== 'ALL' && sale.paymentMethod !== filterPaymentMethod) {
        return false;
      }
      if (dateFrom || dateTo) {
        const d = new Date(sale.createdAt);
        if (Number.isNaN(d.getTime())) return false;
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        if (dateFrom && ymd < dateFrom) return false;
        if (dateTo && ymd > dateTo) return false;
      }
      return true;
    });
  }, [sales, searchCustomer, filterPaymentMethod, dateFrom, dateTo]);

  const totalSalesRef = sales.reduce((acc, s) => acc + s.totalRef, 0);
  const totalSalesMulti = calculateMultiPrice(totalSalesRef, rateSettings, exchangeRates);

  // Build Daily Chart Data (Last 7 Days) comparing revenue in Primary Currency
  const dailyData: ChartPoint[] = useMemo(() => {
    const days: ChartPoint[] = [];
    const now = new Date();
    const dayFormatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: '2-digit',
    });
    const fullDayFormatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    });

    for (let i = 6; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const y = target.getFullYear();
      const m = target.getMonth();
      const d = target.getDate();

      const matchingSales = sales.filter((s) => {
        const sd = new Date(s.createdAt);
        return sd.getFullYear() === y && sd.getMonth() === m && sd.getDate() === d;
      });

      const dayRefSum = matchingSales.reduce((acc, s) => acc + s.totalRef, 0);
      const dayPrimaryCalc = calculateMultiPrice(dayRefSum, rateSettings, exchangeRates);

      days.push({
        label: i === 0 ? 'Hoy' : dayFormatter.format(target),
        fullLabel: fullDayFormatter.format(target),
        ingresosPrimaria: Number(dayPrimaryCalc.primaryValue.toFixed(2)),
        ingresosRef: Number(dayRefSum.toFixed(2)),
        operaciones: matchingSales.length,
      });
    }
    return days;
  }, [sales, rateSettings, exchangeRates]);

  // Build Monthly Chart Data (Last 6 Months) comparing revenue in Primary Currency
  const monthlyData: ChartPoint[] = useMemo(() => {
    const months: ChartPoint[] = [];
    const now = new Date();
    const monthShortFormatter = new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      year: '2-digit',
    });
    const monthFullFormatter = new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    });

    for (let i = 5; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = target.getFullYear();
      const m = target.getMonth();

      const matchingSales = sales.filter((s) => {
        const sd = new Date(s.createdAt);
        return sd.getFullYear() === y && sd.getMonth() === m;
      });

      const monthRefSum = matchingSales.reduce((acc, s) => acc + s.totalRef, 0);
      const monthPrimaryCalc = calculateMultiPrice(monthRefSum, rateSettings, exchangeRates);

      const rawLabel = monthShortFormatter.format(target);
      months.push({
        label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
        fullLabel: monthFullFormatter.format(target),
        ingresosPrimaria: Number(monthPrimaryCalc.primaryValue.toFixed(2)),
        ingresosRef: Number(monthRefSum.toFixed(2)),
        operaciones: matchingSales.length,
      });
    }
    return months;
  }, [sales, rateSettings, exchangeRates]);

  const todayStats = dailyData[dailyData.length - 1] || {
    ingresosPrimaria: 0,
    ingresosRef: 0,
    operaciones: 0,
  };
  const currentMonthStats = monthlyData[monthlyData.length - 1] || {
    ingresosPrimaria: 0,
    ingresosRef: 0,
    operaciones: 0,
  };

  const formatYAxisTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
  };

  const renderCustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: ChartPoint }[];
  }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const multi = calculateMultiPrice(data.ingresosRef, rateSettings, exchangeRates);

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-lg text-xs space-y-1.5 font-mono tabular-nums">
        <div className="font-sans font-bold text-slate-900 capitalize border-b border-slate-100 pb-1">
          {data.fullLabel}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 font-sans">Moneda Primaria:</span>
          <span className="font-extrabold text-amber-700">
            {formatFiatNumber(data.ingresosPrimaria, rateSettings.primaryCurrency)}{' '}
            {rateSettings.primaryCurrency}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 font-sans">Equivalente Ref:</span>
          <span className="font-bold text-slate-800">{multi.refAndSecondaryLine}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 font-sans">Ventas cobradas:</span>
          <span className="font-bold text-emerald-700">{data.operaciones} op.</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & View Mode Controls */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-700">
            Analítica de Ingresos en Moneda Primaria ({rateSettings.primaryCurrency})
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Historial y Volumen de Ventas ({sales.length} operaciones)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparativa interactiva del volumen de ventas diario y mensual expresado en tu Tasa
            Primaria ({rateSettings.primaryCurrency}) y Referencial ({rateSettings.referenceCurrency}
            ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="liquid-tray p-1.5 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setChartView('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
                chartView === 'both'
                  ? 'liquid-btn-active text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Comparativa
            </button>
            <button
              type="button"
              onClick={() => setChartView('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
                chartView === 'daily'
                  ? 'liquid-btn-active text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diario (7 días)
            </button>
            <button
              type="button"
              onClick={() => setChartView('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
                chartView === 'monthly'
                  ? 'liquid-btn-active text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensual (6 meses)
            </button>
          </div>
        </div>
      </div>

      {/* Primary Currency KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Ingresos de Hoy (Primaria)</div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
              {formatFiatNumber(todayStats.ingresosPrimaria, rateSettings.primaryCurrency)}{' '}
              {rateSettings.primaryCurrency}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              {todayStats.ingresosRef.toFixed(2)}{' '}
              {rateSettings.referenceCurrency === 'USD' ? '$' : '€'} · {todayStats.operaciones}{' '}
              ventas hoy
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Ingresos del Mes Actual</div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums mt-1">
              {formatFiatNumber(currentMonthStats.ingresosPrimaria, rateSettings.primaryCurrency)}{' '}
              {rateSettings.primaryCurrency}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              {currentMonthStats.ingresosRef.toFixed(2)}{' '}
              {rateSettings.referenceCurrency === 'USD' ? '$' : '€'} ·{' '}
              {currentMonthStats.operaciones} ventas este mes
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Volumen Histórico Acumulado</div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
              {totalSalesMulti.primaryText}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              {totalSalesMulti.refAndSecondaryLine}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Visualizations: Daily & Monthly Volume in Primary Currency */}
      <div
        className={`grid grid-cols-1 ${
          chartView === 'both' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
        } gap-6`}
      >
        {/* Daily Sales Volume Chart */}
        {(chartView === 'both' || chartView === 'daily') && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-700">Evolución Diaria (7 Días)</div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  Volumen Diario en {rateSettings.primaryCurrency}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Moneda Primaria: {rateSettings.primaryCurrency}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyData}
                  margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="primaryDailyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={renderCustomTooltip as never} />
                  <Area
                    type="monotone"
                    dataKey="ingresosPrimaria"
                    name={`Ingresos (${rateSettings.primaryCurrency})`}
                    stroke="#EA580C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#primaryDailyGradient)"
                    activeDot={{ r: 6, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Monthly Sales Volume Chart */}
        {(chartView === 'both' || chartView === 'monthly') && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-700">
                  Comparativa Mensual (Últimos 6 Meses)
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  Volumen Mensual en {rateSettings.primaryCurrency}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Moneda Primaria: {rateSettings.primaryCurrency}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="primaryMonthlyBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    content={renderCustomTooltip as never}
                    cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                  />
                  <Bar
                    dataKey="ingresosPrimaria"
                    name={`Ingresos (${rateSettings.primaryCurrency})`}
                    fill="url(#primaryMonthlyBar)"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Sales Ledger Table with Advanced Search */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              🔍 Búsqueda Avanzada del Historial de Ventas
            </span>
            {(searchCustomer || filterPaymentMethod !== 'ALL' || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setSearchCustomer('');
                  setFilterPaymentMethod('ALL');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Limpiar filtros ({filteredSales.length} de {sales.length})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="Buscar cliente o producto..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Método de Pago</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold"
              >
                <option value="ALL">Todos los métodos</option>
                {availablePaymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Fecha Desde</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-base font-bold text-slate-800">Aún no hay ventas cobradas</div>
            <div className="text-xs text-slate-500">
              Agrega productos a cualquiera de los 5 carritos en el POS y presiona Cobrar Carrito.
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="text-sm font-bold text-slate-800">
              No se encontraron ventas con los filtros aplicados
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50/60">
                  <th className="py-3.5 px-5">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Carrito / Cliente</th>
                  <th className="py-3.5 px-4">Detalle de Productos</th>
                  <th className="py-3.5 px-4">Método de Pago</th>
                  <th className="py-3.5 px-5 text-right">
                    Total en {rateSettings.primaryCurrency} / Ref
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSales.map((sale) => {
                  const saleConverted = calculateMultiPrice(
                    sale.totalRef,
                    rateSettings,
                    exchangeRates
                  );
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-5 text-xs font-mono text-slate-500">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          Carrito #{sale.cartId}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-700">
                        {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-700">
                        {sale.paymentMethod}
                      </td>
                      <td className="py-4 px-5 text-right font-mono tabular-nums">
                        <div className="text-sm font-extrabold text-slate-900">
                          {saleConverted.primaryText}
                        </div>
                        <div className="text-xs text-emerald-700 font-bold">
                          {saleConverted.refAndSecondaryLine}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. CATÁLOGO VIRTUAL COMPARTIBLE ---
interface VirtualCatalogModuleProps {
  storeProfile: StoreProfile;
  products: Product[];
  rateSettings: RateSettings;
  exchangeRates: ExchangeRatesData;
  onAddToPosCart: (product: Product) => void;
}

export const VirtualCatalogModule: React.FC<VirtualCatalogModuleProps> = ({
  storeProfile,
  products,
  rateSettings,
  exchangeRates,
  onAddToPosCart,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCatalogInfo = () => {
    const text = `Catálogo Virtual — ${storeProfile.name || 'Mi Tienda'}\nDirección: ${
      storeProfile.address
    }\nContacto: ${storeProfile.phone}\nEnlace: ${window.location.href}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Storefront Virtual Catalog Hero */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-bold text-amber-700">
            Catálogo Virtual Público · Sincronizado con Tus Tasas
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            {storeProfile.name || 'Mi Tienda Virtual'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <span>{storeProfile.category}</span>
            {storeProfile.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {storeProfile.address}
              </span>
            )}
            {storeProfile.phone && (
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {storeProfile.phone}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyCatalogInfo}
          className="liquid-btn-active px-5 py-3 rounded-2xl text-xs font-extrabold text-slate-900 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Enlace de Catálogo Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Compartir Catálogo Virtual</span>
            </>
          )}
        </button>
      </div>

      {/* Product Showcase Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{product.category}</span>
                <span className="font-mono">
                  {product.stock > 0 ? `Disponible (${product.stock})` : 'Agotado'}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1.5 font-display">
                {product.name}
              </h3>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-end justify-between gap-4">
              <MultiRatePrice
                priceRef={product.priceRef}
                settings={rateSettings}
                rates={exchangeRates}
                size="md"
                align="left"
              />

              <button
                type="button"
                onClick={() => onAddToPosCart(product)}
                className="liquid-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>Enviar al POS</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
