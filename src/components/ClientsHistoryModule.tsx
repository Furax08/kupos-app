import React, { useState, useMemo, useEffect } from 'react';

const formatLocalAmount = (val: number): string => {
  if (!Number.isFinite(val)) return '0,00';
  return val.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export interface AbonoRecord {
  id: string;
  date: string;
  amountUSD: number;
  method: string;
  note?: string;
}

export interface CreditSaleItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitType?: 'unidad' | 'kg' | 'litro';
  selectedWeightGrams?: number;
}

export interface CreditSaleRecord {
  id: string;
  date: string;
  items: CreditSaleItem[];
  total: number;
  method: string;
  clientName?: string;
  abono?: number;
  abonosHistory?: AbonoRecord[];
  status?: 'pagado' | 'fiado';
}

export interface StoreContactItem {
  id: string;
  name: string;
  phone?: string;
  dni?: string;
  notes?: string;
  createdAt: string;
}

export type StoreContact = StoreContactItem;

interface ClientsHistoryModuleProps {
  salesHistory: Array<{
    id: string;
    date: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity?: number;
      qty?: number;
      unitType?: 'unidad' | 'kg' | 'litro';
      selectedWeightGrams?: number;
    }>;
    total: number;
    method?: string;
    paymentMethod?: string;
    clientName?: string;
    abono?: number;
    abonosHistory?: AbonoRecord[];
    status?: string;
  }>;
  contacts?: StoreContactItem[];
  selectedClientExternal?: string | null;
  initialSelectedClient?: string | null;
  onClearExternalSelection?: () => void;
  rates: {
    primaryCurrency: string;
    primaryRate: number;
    secondaryCurrency: string;
    secondaryRate: number;
    useCrypto?: boolean;
    cryptoCurrency?: string;
    cryptoRate?: number;
    crypto?: Record<string, number>;
  };
  onRegisterAbono: (
    clientOrSaleId: string,
    amountUSD: number,
    method: string,
    note: string
  ) => void;
  onAddContact?: (name: string, phone: string, notes: string) => void;
  onDeleteContact?: (id: string) => void;
  onSaveStoreContact?: (contact: StoreContactItem) => void;
  onDeleteStoreContact?: (contactId: string) => void;
  onOpenCartForContact?: (contact: StoreContactItem) => void;
}

interface ClientSummary {
  clientName: string;
  phone?: string;
  totalCreditUSD: number;
  totalAbonadoUSD: number;
  pendingBalanceUSD: number;
  sales: CreditSaleRecord[];
  abonos: (AbonoRecord & { saleId: string; runningRemainingUSD: number })[];
  lastActivityDate: string;
}

export const ClientsHistoryModule: React.FC<ClientsHistoryModuleProps> = ({
  salesHistory: rawSalesHistory,
  contacts = [],
  selectedClientExternal,
  initialSelectedClient,
  onClearExternalSelection,
  rates,
  onRegisterAbono,
  onAddContact,
}) => {
  const salesHistory: CreditSaleRecord[] = useMemo(
    () =>
      (rawSalesHistory || []).map((s) => ({
        id: s.id,
        date: s.date,
        items: (s.items || []).map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: typeof it.quantity === 'number' ? it.quantity : it.qty || 1,
          unitType: it.unitType,
          selectedWeightGrams: it.selectedWeightGrams,
        })),
        total: s.total,
        method: s.method || s.paymentMethod || 'Fiado',
        clientName: s.clientName,
        abono: s.abono,
        abonosHistory: s.abonosHistory,
        status: s.status === 'fiado' || s.status === 'credit' ? 'fiado' : 'pagado',
      })),
    [rawSalesHistory]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState<boolean>(true);

  // Compact Abono input state
  const [abonoInputMode, setAbonoInputMode] = useState<'PRIMARY' | 'USD'>('PRIMARY');
  const [abonoAmountInput, setAbonoAmountInput] = useState('');
  const [abonoMethod, setAbonoMethod] = useState('Efectivo / Pago Móvil');
  const [abonoNote, setAbonoNote] = useState('');

  // Optional compact quick add contact modal/bar
  const [showQuickContact, setShowQuickContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const clientsList = useMemo(() => {
    const map = new Map<
      string,
      {
        clientName: string;
        phone?: string;
        totalCreditUSD: number;
        totalAbonadoUSD: number;
        sales: CreditSaleRecord[];
        rawAbonos: (AbonoRecord & { saleId: string })[];
        lastActivityDate: string;
      }
    >();

    // Seed contacts
    contacts.forEach((contact) => {
      const cleanName = (contact.name || '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      map.set(key, {
        clientName: cleanName,
        phone: contact.phone,
        totalCreditUSD: 0,
        totalAbonadoUSD: 0,
        sales: [],
        rawAbonos: [],
        lastActivityDate: contact.createdAt,
      });
    });

    // Aggregate credit sales and abonos per client
    salesHistory.forEach((sale) => {
      const isCreditSale = sale.status === 'fiado' || Boolean(sale.clientName);
      if (!isCreditSale) return;

      const rawName = (sale.clientName || 'Cliente sin nombre').trim();
      const key = rawName.toLowerCase();

      const existing = map.get(key) || {
        clientName: rawName,
        totalCreditUSD: 0,
        totalAbonadoUSD: 0,
        sales: [],
        rawAbonos: [],
        lastActivityDate: sale.date,
      };

      existing.totalCreditUSD += sale.total || 0;
      existing.sales.push(sale);

      if (Array.isArray(sale.abonosHistory) && sale.abonosHistory.length > 0) {
        sale.abonosHistory.forEach((ab) => {
          existing.rawAbonos.push({ ...ab, saleId: sale.id });
          existing.totalAbonadoUSD += ab.amountUSD || 0;
        });
      } else if ((sale.abono || 0) > 0) {
        existing.rawAbonos.push({
          id: `AB-INIT-${sale.id}`,
          date: sale.date,
          amountUSD: sale.abono || 0,
          method: 'Abono inicial',
          note: 'Abono al comprar',
          saleId: sale.id,
        });
        existing.totalAbonadoUSD += sale.abono || 0;
      }

      existing.lastActivityDate = sale.date;
      map.set(key, existing);
    });

    const result: ClientSummary[] = [];
    map.forEach((c) => {
      const pending = Math.max(0, Number((c.totalCreditUSD - c.totalAbonadoUSD).toFixed(2)));
      // Calculate step-by-step running remaining balance as each abono subtracts from totalCreditUSD
      let runningDebt = c.totalCreditUSD;
      const abonosWithRunningBalance = c.rawAbonos.map((ab) => {
        runningDebt = Math.max(0, Number((runningDebt - (ab.amountUSD || 0)).toFixed(2)));
        return {
          ...ab,
          runningRemainingUSD: runningDebt,
        };
      });

      result.push({
        clientName: c.clientName,
        phone: c.phone,
        totalCreditUSD: Number(c.totalCreditUSD.toFixed(2)),
        totalAbonadoUSD: Number(c.totalAbonadoUSD.toFixed(2)),
        pendingBalanceUSD: pending,
        sales: c.sales,
        abonos: abonosWithRunningBalance,
        lastActivityDate: c.lastActivityDate,
      });
    });

    return result.sort((a, b) => b.pendingBalanceUSD - a.pendingBalanceUSD);
  }, [salesHistory, contacts]);

  // Select external debtor if requested (e.g., right after "Dejar Fiado")
  useEffect(() => {
    if (selectedClientExternal) {
      const key = selectedClientExternal.trim().toLowerCase();
      setSelectedClientKey(key);
      setOnlyPending(false);
      if (onClearExternalSelection) {
        onClearExternalSelection();
      }
    }
  }, [selectedClientExternal, onClearExternalSelection]);

  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      const matchesSearch =
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (onlyPending) return c.pendingBalanceUSD > 0.009;
      return true;
    });
  }, [clientsList, searchTerm, onlyPending]);

  const selectedClient = useMemo(() => {
    if (selectedClientKey) {
      const found = clientsList.find((c) => c.clientName.toLowerCase() === selectedClientKey);
      if (found) return found;
    }
    return filteredClients[0] || null;
  }, [clientsList, filteredClients, selectedClientKey]);

  const globalPendingUSD = useMemo(
    () => clientsList.reduce((acc, c) => acc + c.pendingBalanceUSD, 0),
    [clientsList]
  );

  // Convert input amount to USD
  const parsedInputVal = parseFloat(abonoAmountInput) || 0;
  const computedAbonoUSD =
    abonoInputMode === 'PRIMARY'
      ? rates.primaryRate > 0
        ? parsedInputVal / rates.primaryRate
        : 0
      : parsedInputVal;

  const handleSubmitAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || computedAbonoUSD <= 0) return;
    const validUSD = Math.min(selectedClient.pendingBalanceUSD, Number(computedAbonoUSD.toFixed(2)));
    if (validUSD <= 0) return;

    onRegisterAbono(
      selectedClient.clientName,
      validUSD,
      abonoMethod,
      abonoNote.trim() || 'Abono a cuenta'
    );
    setAbonoAmountInput('');
    setAbonoNote('');
  };

  const handleSaldarTodo = () => {
    if (!selectedClient || selectedClient.pendingBalanceUSD <= 0) return;
    onRegisterAbono(
      selectedClient.clientName,
      selectedClient.pendingBalanceUSD,
      abonoMethod,
      'Pago total de deuda'
    );
    setAbonoAmountInput('');
    setAbonoNote('');
  };

  const handleQuickSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !onAddContact) return;
    onAddContact(newContactName.trim(), newContactPhone.trim(), '');
    setSelectedClientKey(newContactName.trim().toLowerCase());
    setOnlyPending(false);
    setNewContactName('');
    setNewContactPhone('');
    setShowQuickContact(false);
  };

  // Flatten all items purchased across all credit sales for the selected debtor
  const allPurchasedItems = useMemo(() => {
    if (!selectedClient) return [];
    const list: {
      saleId: string;
      saleDate: string;
      item: CreditSaleItem;
    }[] = [];
    selectedClient.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        list.push({
          saleId: sale.id,
          saleDate: sale.date,
          item,
        });
      });
    });
    return list;
  }, [selectedClient]);

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Compact Header Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
            📒
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight">Deudores (Cuentas Fiadas)</h2>
            <p className="text-[11px] text-slate-400">
              Total por cobrar:{' '}
              <span className="font-black text-emerald-400">
                {formatLocalAmount(globalPendingUSD * rates.primaryRate)} {rates.primaryCurrency}
              </span>{' '}
              <span className="text-slate-300 font-bold">(${globalPendingUSD.toFixed(2)} USD)</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOnlyPending(true)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center justify-center ${
              onlyPending
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900 text-slate-400 border border-slate-700'
            }`}
          >
            ⏳ Con Deuda ({clientsList.filter((c) => c.pendingBalanceUSD > 0.009).length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyPending(false)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center justify-center ${
              !onlyPending
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 border border-slate-700'
            }`}
          >
            👥 Todos ({clientsList.length})
          </button>
          {onAddContact && (
            <button
              type="button"
              onClick={() => setShowQuickContact(!showQuickContact)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition flex items-center justify-center"
              title="Registrar cliente"
            >
              ➕ Cliente
            </button>
          )}
        </div>
      </div>

      {/* Optional Compact Add Contact Bar */}
      {showQuickContact && onAddContact && (
        <form
          onSubmit={handleQuickSaveContact}
          className="bg-slate-800 border border-indigo-500/40 rounded-xl p-2.5 flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            required
            placeholder="Nombre del cliente..."
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
            className="flex-1 min-w-[140px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Teléfono (opcional)"
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
            className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-3 py-1.5 rounded-lg text-xs"
          >
            Guardar
          </button>
        </form>
      )}

      {/* Compact Debtors Selector Strip + Search */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 space-y-2.5">
        <input
          type="text"
          placeholder="🔍 Buscar deudor por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
        />

        {filteredClients.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-xs">
            No hay clientes en esta vista.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
            {filteredClients.map((client) => {
              const isSelected =
                selectedClient?.clientName.toLowerCase() === client.clientName.toLowerCase();
              const hasDebt = client.pendingBalanceUSD > 0.009;
              const debtPrimary = client.pendingBalanceUSD * rates.primaryRate;

              return (
                <button
                  key={client.clientName}
                  type="button"
                  onClick={() => setSelectedClientKey(client.clientName.toLowerCase())}
                  className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-400 ring-1 ring-indigo-400'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-black text-white text-xs truncate">
                      {client.clientName}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hasDebt ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>

                  <div className="mt-1.5">
                    {hasDebt ? (
                      <>
                        <div className="text-[13px] font-black text-amber-400 leading-tight truncate">
                          {formatLocalAmount(debtPrimary)} {rates.primaryCurrency}
                        </div>
                        <div className="text-[10px] font-bold text-slate-300">
                          Debe: ${client.pendingBalanceUSD.toFixed(2)} USD
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] font-black text-emerald-400">✅ Solvente</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Debtor Compact Card: 1) Total Debt, 2) Abonar, 3) Detalle Compra, 4) Registro Abonos Restando */}
      {selectedClient && (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 space-y-4 shadow-xl">
          {/* 1. CUÁNTO DEBE EN TOTAL */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{selectedClient.clientName}</h3>
                {selectedClient.phone && (
                  <span className="text-[11px] text-slate-400 font-semibold">
                    📞 {selectedClient.phone}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  Compra Total:{' '}
                  <strong className="text-slate-200">
                    ${selectedClient.totalCreditUSD.toFixed(2)}
                  </strong>
                </span>
                <span>
                  Total Abonado:{' '}
                  <strong className="text-emerald-400">
                    -${selectedClient.totalAbonadoUSD.toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl px-3.5 py-2 text-right">
              <div className="text-[10px] uppercase font-black tracking-wider text-amber-300">
                Cuánto debe en total
              </div>
              {selectedClient.pendingBalanceUSD > 0.009 ? (
                <>
                  <div className="text-lg font-black text-emerald-400 leading-tight">
                    {formatLocalAmount(selectedClient.pendingBalanceUSD * rates.primaryRate)}{' '}
                    <span className="text-xs">{rates.primaryCurrency}</span>
                  </div>
                  <div className="text-xs font-black text-white">
                    ${selectedClient.pendingBalanceUSD.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] font-bold text-indigo-300">
                    {formatLocalAmount(selectedClient.pendingBalanceUSD * rates.secondaryRate)}{' '}
                    {rates.secondaryCurrency}
                  </div>
                </>
              ) : (
                <div className="text-base font-black text-emerald-400 py-1">
                  🎉 $0.00 (Deuda Saldada)
                </div>
              )}
            </div>
          </div>

          {/* 2. ABONAR (Compact inline form) */}
          {selectedClient.pendingBalanceUSD > 0.009 && (
            <form
              onSubmit={handleSubmitAbono}
              className="bg-indigo-950/30 border border-indigo-500/40 rounded-xl p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-indigo-300 uppercase">
                  💸 Abonar a la deuda
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setAbonoInputMode('PRIMARY');
                      setAbonoAmountInput('');
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-black transition flex items-center justify-center ${
                      abonoInputMode === 'PRIMARY'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    En {rates.primaryCurrency}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAbonoInputMode('USD');
                      setAbonoAmountInput('');
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-black transition flex items-center justify-center ${
                      abonoInputMode === 'USD'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    En $ USD
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={
                      abonoInputMode === 'PRIMARY'
                        ? `Monto en ${rates.primaryCurrency} (Máx ${(
                            selectedClient.pendingBalanceUSD * rates.primaryRate
                          ).toFixed(2)})`
                        : `Monto en USD (Máx $${selectedClient.pendingBalanceUSD.toFixed(2)})`
                    }
                    value={abonoAmountInput}
                    onChange={(e) => setAbonoAmountInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white focus:border-emerald-500 focus:outline-none"
                  />
                  {parsedInputVal > 0 && (
                    <span className="block text-[10px] text-slate-300 mt-1 px-1">
                      Resta:{' '}
                      <strong className="text-emerald-400">
                        -${computedAbonoUSD.toFixed(2)} USD
                      </strong>{' '}
                      → Quedaría debiendo:{' '}
                      <strong className="text-amber-300">
                        $
                        {Math.max(0, selectedClient.pendingBalanceUSD - computedAbonoUSD).toFixed(
                          2
                        )}{' '}
                        USD (
                        {formatLocalAmount(
                          Math.max(0, selectedClient.pendingBalanceUSD - computedAbonoUSD) *
                            rates.primaryRate
                        )}{' '}
                        {rates.primaryCurrency})
                      </strong>
                    </span>
                  )}
                </div>

                <select
                  value={abonoMethod}
                  onChange={(e) => setAbonoMethod(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-semibold focus:outline-none"
                >
                  <option value="Efectivo / Pago Móvil">Efectivo / Pago Móvil</option>
                  <option value="Efectivo Divisas ($)">Efectivo Divisas ($)</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Punto de Venta">Punto de Venta</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={computedAbonoUSD <= 0}
                    className="flex-1 sm:flex-initial min-h-[44px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center"
                  >
                    ➕ Abonar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaldarTodo}
                    className="min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center"
                    title="Pagar toda la deuda pendiente"
                  >
                    ✅ Saldar Todo
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 3 & 4: COMPACT TWO-SECTION DETAILS: DETALLE DE SU COMPRA & ABONOS RESTANDO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 3. DETALLE DE SU COMPRA */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase">
                  🛒 Detalle de su compra ({allPurchasedItems.length})
                </h4>
                <span className="text-[11px] font-black text-slate-300">
                  Total: ${selectedClient.totalCreditUSD.toFixed(2)}
                </span>
              </div>

              {allPurchasedItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Sin productos registrados a crédito.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {allPurchasedItems.map(({ saleId, saleDate, item }, idx) => {
                    const lineUSD = item.price * item.quantity;
                    const linePrimary = lineUSD * rates.primaryRate;
                    const qtyLabel =
                      item.unitType === 'kg'
                        ? item.selectedWeightGrams
                          ? `${item.selectedWeightGrams}g`
                          : `${(item.quantity * 1000).toFixed(0)}g`
                        : `${item.quantity} und`;

                    return (
                      <div
                        key={`${saleId}-${item.id}-${idx}`}
                        className="flex items-center justify-between gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {item.name}{' '}
                            <span className="text-indigo-300 font-black">({qtyLabel})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{saleDate}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-emerald-400">
                            {formatLocalAmount(linePrimary)} {rates.primaryCurrency}
                          </div>
                          <div className="text-[10px] font-bold text-slate-300">
                            ${lineUSD.toFixed(2)} USD
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. REGISTRO DE ABONOS (CADA ABONO VA RESTANDO A SU DEUDA) */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                <h4 className="text-xs font-black text-white uppercase">
                  📉 Abonos (Restando a su deuda)
                </h4>
                <span className="text-[11px] font-black text-emerald-400">
                  Abonado: -${selectedClient.totalAbonadoUSD.toFixed(2)}
                </span>
              </div>

              {/* Initial Debt Baseline Row */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5 mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold">Deuda Total Inicial:</span>
                <span className="font-black text-white">
                  {formatLocalAmount(selectedClient.totalCreditUSD * rates.primaryRate)}{' '}
                  {rates.primaryCurrency} (${selectedClient.totalCreditUSD.toFixed(2)})
                </span>
              </div>

              {selectedClient.abonos.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Aún no se han registrado abonos.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {selectedClient.abonos.map((ab, index) => {
                    const abonoPrimary = ab.amountUSD * rates.primaryRate;
                    const remainingPrimary = ab.runningRemainingUSD * rates.primaryRate;

                    return (
                      <div
                        key={ab.id || index}
                        className="bg-slate-800/90 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-emerald-400">
                            ➖ Abonó {formatLocalAmount(abonoPrimary)} {rates.primaryCurrency} ($
                            {ab.amountUSD.toFixed(2)})
                          </span>
                          <span className="text-[10px] text-slate-400">{ab.date}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-700/60">
                          <span className="text-slate-400 truncate">{ab.method}</span>
                          <span className="font-black text-amber-300">
                            Quedó debiendo: {formatLocalAmount(remainingPrimary)}{' '}
                            {rates.primaryCurrency} (${ab.runningRemainingUSD.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
