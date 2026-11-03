import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Clock,
  Store,
  X,
  Plus,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  BINANCE_PAY_ID,
  ExchangeRatesData,
  PaymentSubmission,
  Product,
  SaleRecord,
  UserAccount,
} from '../types';
import { MultiRatePrice } from './MultiRatePrice';

interface AdminMasterPanelProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  allSubmissions: PaymentSubmission[];
  allProducts: Product[];
  allSales: SaleRecord[];
  exchangeRates: ExchangeRatesData;
  onReviewSubmission: (submissionId: string, userId: string, approved: boolean) => Promise<void>;
  onSwitchToUserAccount: (email: string) => Promise<void>;
  onAddGlobalProduct: (product: Partial<Product>) => Promise<void>;
}

export const AdminMasterPanel: React.FC<AdminMasterPanelProps> = ({
  currentUser,
  allUsers,
  allSubmissions,
  allProducts,
  allSales,
  exchangeRates,
  onReviewSubmission,
  onSwitchToUserAccount,
  onAddGlobalProduct,
}) => {
  const [subTab, setSubTab] = useState<'approvals' | 'users' | 'products' | 'stats'>('approvals');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentSubmission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Quick product creation modal state
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('3');
  const [newProdStock, setNewProdStock] = useState('40');
  const [newProdCategory, setNewProdCategory] = useState('General');

  const pendingCount = allSubmissions.filter((s) => s.status === 'pending').length;
  const totalSalesVolumeUsd = allSales.reduce((acc, s) => acc + s.totalRef, 0);
  const approvedUsersCount = allUsers.filter((u) => u.subscriptionStatus === 'approved').length;

  const handleDecision = async (submissionId: string, userId: string, approved: boolean) => {
    setProcessingId(submissionId || userId);
    try {
      await onReviewSubmission(submissionId, userId, approved);
    } finally {
      setProcessingId(null);
      setSelectedReceipt(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    await onAddGlobalProduct({
      name: newProdName.trim(),
      priceRef: parseFloat(newProdPrice) || 3,
      costRef: (parseFloat(newProdPrice) || 3) * 0.6,
      stock: parseInt(newProdStock, 10) || 20,
      category: newProdCategory,
      unit: 'und',
    });
    setNewProdName('');
    setNewProdPrice('3');
  };

  return (
    <div className="space-y-6">
      {/* Master Admin Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Panel Maestro Exclusivo · Administrador: {ADMIN_EMAIL}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1 font-display">
            Control Global de Suscripciones, Usuarios, Productos y Ventas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Valida los comprobantes de pago enviados a Binance Pay ({BINANCE_PAY_ID}) para
            desbloquear nuevas tiendas en tiempo real.
          </p>
        </div>

        {/* Liquid Navigation Tabs for Master Admin */}
        <div className="liquid-tray p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('approvals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'approvals'
                ? 'liquid-btn-active text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Comprobantes ({pendingCount} pendientes)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'users'
                ? 'liquid-btn-active text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios ({allUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'products'
                ? 'liquid-btn-active text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Productos ({allProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('stats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'stats'
                ? 'liquid-btn-active text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Métricas en Vivo</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Pagos por Aprobar (Binance Pay)</div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ID Destino: {BINANCE_PAY_ID}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Usuarios / Tiendas Activas</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {approvedUsersCount} / {allUsers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Con registro legal y DNI/Cédula</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Productos en Plataforma</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {allProducts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sincronizados con tasas oficiales</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">Ventas Globales en Tiempo Real</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
            ${totalSalesVolumeUsd.toFixed(2)} USD
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {allSales.length} operaciones registradas
          </div>
        </div>
      </div>

      {/* SUBTAB 1: BINANCE PAY APPROVALS */}
      {subTab === 'approvals' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                Solicitudes de Activación y Comprobantes Binance Pay ({BINANCE_PAY_ID})
              </h3>
              <p className="text-xs text-slate-500">
                Revisa la referencia y el comprobante adjunto. Haz clic en Aprobar (Sí) para
                desbloquear la creación de tienda del usuario.
              </p>
            </div>
          </div>

          {allSubmissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay comprobantes enviados todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                    <th className="py-3 px-4">Usuario / Datos Legales</th>
                    <th className="py-3 px-4">Plan Elegido</th>
                    <th className="py-3 px-4">Referencia Binance</th>
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Validar ¿Aprobar Sí o No?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {allSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sub.userLegalName}</div>
                        <div className="text-xs text-slate-500">
                          {sub.userDocument} · {sub.userEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900">
                          ${sub.amountUsd.toFixed(2)} USD
                        </div>
                        <div className="text-xs text-slate-500">
                          {sub.plan === 'annual' ? 'Anual ($29.99)' : 'Mensual ($2.99)'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                        {sub.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(sub)}
                          className="liquid-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ver Comprobante</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold">
                        {sub.status === 'pending' && (
                          <span className="text-amber-700">Pendiente de revisión</span>
                        )}
                        {sub.status === 'approved' && (
                          <span className="text-emerald-700">Aprobado · Cuenta Activa</span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="text-red-600">Rechazado</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={processingId === sub.id}
                            onClick={() => handleDecision(sub.id, sub.userId, true)}
                            className="liquid-btn-active px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-900 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sí, Aprobar</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === sub.id}
                            onClick={() => handleDecision(sub.id, sub.userId, false)}
                            className="liquid-btn px-3 py-2 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>No</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: REGISTERED USERS & STORES */}
      {subTab === 'users' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 font-display">
            Directorio de Usuarios Registrados y Tiendas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="py-3 px-4">Nombre Legal y Documento</th>
                  <th className="py-3 px-4">Correo (Usuario)</th>
                  <th className="py-3 px-4">Tienda Configurada</th>
                  <th className="py-3 px-4">Estado Suscripción</th>
                  <th className="py-3 px-4 text-right">Acciones Maestro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.legalName}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {u.documentType}: {u.documentNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.storeProfile.isConfigured ? (
                        <div>
                          <div className="font-bold text-slate-900">{u.storeProfile.name}</div>
                          <div className="text-xs text-slate-500">
                            {u.storeProfile.category} · {u.storeProfile.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Pendiente por crear tienda</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold">
                      {u.subscriptionStatus === 'approved' ? (
                        <span className="text-emerald-700">Desbloqueado</span>
                      ) : u.subscriptionStatus === 'pending' ? (
                        <span className="text-amber-700">Comprobante Pendiente</span>
                      ) : (
                        <span className="text-slate-500">Sin suscripción activa</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.subscriptionStatus !== 'approved' ? (
                          <button
                            type="button"
                            onClick={() => handleDecision('', u.id, true)}
                            className="liquid-btn-active px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 cursor-pointer whitespace-nowrap"
                          >
                            Desbloquear Cuenta
                          </button>
                        ) : (
                          u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDecision('', u.id, false)}
                              className="liquid-btn px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 cursor-pointer whitespace-nowrap"
                            >
                              Suspender
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => onSwitchToUserAccount(u.email)}
                          className="liquid-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Inspeccionar Vista</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: GLOBAL PRODUCTS MANAGEMENT */}
      {subTab === 'products' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6">
            <h3 className="text-base font-extrabold text-slate-900 font-display mb-3">
              Agregar Producto Rápido desde Panel Maestro
            </h3>
            <form
              onSubmit={handleCreateProduct}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Arroz Premium 1Kg"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Precio ({currentUser.rateSettings.referenceCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full liquid-btn-active py-2.5 px-4 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Producto</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6">
            <h3 className="text-lg font-extrabold text-slate-900 font-display mb-4">
              Catálogo Global de Productos ({allProducts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.sku} · {p.category}
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-2 font-mono">
                      Stock disponible: <strong>{p.stock}</strong> {p.unit}
                    </div>
                  </div>
                  <MultiRatePrice
                    priceRef={p.priceRef}
                    settings={currentUser.rateSettings}
                    rates={exchangeRates}
                    size="sm"
                    align="right"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: REAL-TIME SALES STATS */}
      {subTab === 'stats' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 font-display">
            Estadísticas y Flujo de Ventas en Tiempo Real
          </h3>
          {allSales.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Aún no se han registrado ventas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Tienda</th>
                    <th className="py-3 px-4">Carrito / Cliente</th>
                    <th className="py-3 px-4">Método de Pago</th>
                    <th className="py-3 px-4 text-right">Monto Primaria</th>
                    <th className="py-3 px-4 text-right">Monto Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {allSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.storeName}</td>
                      <td className="py-3 px-4 text-slate-700">
                        Carrito #{s.cartId} · {s.customerName}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        {s.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {s.totalPrimary.toLocaleString('es-VE')} {s.primaryCurrency}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {s.totalRef.toFixed(2)}{' '}
                        {s.referenceCurrency === 'USD' ? '$' : '€'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Receipt Inspection Modal for furax030@gmail.com */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-amber-700">
                  Verificación de Comprobante Binance Pay ({BINANCE_PAY_ID})
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 font-display">
                  {selectedReceipt.userLegalName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-500">Documento Legal:</span>
                <div className="font-bold text-slate-900 font-mono">
                  {selectedReceipt.userDocument}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Referencia Binance:</span>
                <div className="font-bold text-amber-800 font-mono">
                  {selectedReceipt.referenceNumber}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Plan y Monto:</span>
                <div className="font-bold text-slate-900 font-mono">
                  ${selectedReceipt.amountUsd.toFixed(2)} USD (
                  {selectedReceipt.plan === 'annual' ? 'Anual' : 'Mensual'})
                </div>
              </div>
              <div>
                <span className="text-slate-500">Correo:</span>
                <div className="font-bold text-slate-900 truncate">{selectedReceipt.userEmail}</div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-3 flex items-center justify-center max-h-80 overflow-hidden">
              <img
                src={selectedReceipt.receiptDataUrl}
                alt="Comprobante de pago Binance Pay"
                referrerPolicy="no-referrer"
                className="max-h-72 w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleDecision(selectedReceipt.id, selectedReceipt.userId, false)
                }
                className="liquid-btn px-4 py-2.5 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar (No)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDecision(selectedReceipt.id, selectedReceipt.userId, true)
                }
                className="liquid-btn-active px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar y Desbloquear Cuenta (Sí)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
