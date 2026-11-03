import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileCheck2,
  LogOut,
  ShieldCheck,
  Upload,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { ADMIN_EMAIL, BINANCE_PAY_ID, SubscriptionPlanId, UserAccount } from '../types';

interface SubscriptionScreenProps {
  user: UserAccount;
  onUpdatedUser: (user: UserAccount) => void;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
  onRefreshState: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  user,
  onUpdatedUser,
  onSwitchToAdmin,
  onLogout,
  onRefreshState,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    user.subscriptionPlan || 'monthly'
  );
  const [referenceNumber, setReferenceNumber] = useState(
    user.paymentSubmission?.referenceNumber || ''
  );
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>(
    user.paymentSubmission?.receiptDataUrl || ''
  );
  const [copiedId, setCopiedId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCopyBinanceId = () => {
    navigator.clipboard.writeText(BINANCE_PAY_ID).catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setFeedback('Por favor ingresa el número de referencia de Binance Pay.');
      return;
    }
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/subscription/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan: selectedPlan,
          referenceNumber: referenceNumber.trim(),
          receiptDataUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUpdatedUser(data.user);
        setFeedback('Comprobante enviado correctamente al Administrador Maestro.');
      } else {
        setFeedback(data.error || 'Error al enviar el comprobante.');
      }
    } catch {
      setFeedback('Error de conexión con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex flex-col justify-between">
      {/* Top Bar Contract with Back & Logout */}
      <header className="flex items-center justify-between gap-4 px-6 md:px-12 py-4 border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="liquid-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display">
            Lumina POS
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600">
          <span>Comerciante: {user.legalName}</span>
          <span>·</span>
          <span>
            {user.documentType}: {user.documentNumber}
          </span>
          <span>·</span>
          <span>{user.email}</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="liquid-btn-dark px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel Maestro ({ADMIN_EMAIL})</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="liquid-btn px-3.5 py-2 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Contextual Back & Account Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="liquid-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Interfaz Principal (Inicio de Sesión)</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="liquid-btn px-4 py-2 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión ({user.email})</span>
          </button>
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-semibold text-amber-700">
            Activación de Suscripción Premium
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
            Desbloquea todas las funciones de tu Tienda & POS
          </h1>
          <p className="text-sm text-slate-600">
            Selecciona tu plan mensual o anual, realiza tu pago vía Binance Pay y adjunta tu
            comprobante para que el administrador ({ADMIN_EMAIL}) active tu cuenta.
          </p>
        </div>

        {/* Status Banner if already pending or rejected */}
        {user.subscriptionStatus === 'pending' && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Comprobante en revisión por {ADMIN_EMAIL}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Referencia enviada:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {user.paymentSubmission?.referenceNumber}
                  </span>{' '}
                  · Plan:{' '}
                  <span className="font-bold">
                    {user.subscriptionPlan === 'annual' ? 'Anual ($29.99)' : 'Mensual ($2.99)'}
                  </span>
                  . Una vez aprobado, se desbloqueará la creación de tu tienda inmediatamente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onRefreshState}
                className="liquid-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Verificar Estado</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="liquid-btn-active px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Aprobar como {ADMIN_EMAIL}</span>
              </button>
            </div>
          </div>
        )}

        {user.subscriptionStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-xs text-red-700 font-medium">
            Tu comprobante anterior no pudo ser validado. Por favor verifica el número de referencia
            de Binance Pay y vuelve a enviar tu comprobante.
          </div>
        )}

        {/* Two Plan Cards + Payment Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Plans + Binance Pay Copy Box */}
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-bold text-slate-500">
              1. Elige tu modalidad de suscripción
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Plan $2.99 */}
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`p-6 rounded-3xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                  selectedPlan === 'monthly'
                    ? 'liquid-btn-active text-slate-900'
                    : 'bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold opacity-80">Para comercios en marcha</div>
                  <div className="text-lg font-extrabold mt-1 font-display">Plan Mensual</div>
                  <div className="mt-4 flex items-baseline gap-1 font-mono tabular-nums">
                    <span className="text-3xl font-extrabold">$2.99</span>
                    <span className="text-xs opacity-75">/ mes</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-black/10 text-xs space-y-1.5">
                  <div>· POS con 5 carritos persistentes</div>
                  <div>· Tasas oficiales + Cripto en vivo</div>
                  <div>· Inventario, Deudores y Catálogo</div>
                </div>
              </button>

              {/* Annual Plan $29.99 */}
              <button
                type="button"
                onClick={() => setSelectedPlan('annual')}
                className={`p-6 rounded-3xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                  selectedPlan === 'annual'
                    ? 'liquid-btn-active text-slate-900'
                    : 'bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold opacity-80">
                    Año completo · Ahorra 2 meses
                  </div>
                  <div className="text-lg font-extrabold mt-1 font-display">Plan Anual</div>
                  <div className="mt-4 flex items-baseline gap-1 font-mono tabular-nums">
                    <span className="text-3xl font-extrabold">$29.99</span>
                    <span className="text-xs opacity-75">/ año</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-black/10 text-xs space-y-1.5">
                  <div>· 12 meses de acceso total sin cortes</div>
                  <div>· Multi-moneda mundial + 5 Criptos</div>
                  <div>· Soporte prioritario directo</div>
                </div>
              </button>
            </div>

            {/* Binance Pay ID Copy Card (190696956) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500">
                    2. Datos Oficiales de Pago · Binance Pay
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">
                    Envía exactamente{' '}
                    <span className="font-mono font-extrabold text-amber-700">
                      {selectedPlan === 'annual' ? '$29.99 USDT' : '$2.99 USDT'}
                    </span>{' '}
                    al siguiente ID:
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              </div>

              <div className="liquid-tray p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">ID BINANCE PAY</div>
                  <div className="text-2xl font-extrabold tracking-wider text-slate-900 font-mono tabular-nums">
                    {BINANCE_PAY_ID}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyBinanceId}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    copiedId ? 'liquid-btn-active text-slate-900' : 'liquid-btn text-slate-800'
                  }`}
                >
                  {copiedId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡ID Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar ID ({BINANCE_PAY_ID})</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed">
                Abre tu app de Binance, entra en <strong>Binance Pay → Enviar</strong>, pega el ID{' '}
                <strong className="font-mono text-slate-800">{BINANCE_PAY_ID}</strong> y copia la
                referencia o captura de la transacción para adjuntarla.
              </div>
            </div>
          </div>

          {/* Right: Upload Receipt & Reference Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <div className="text-xs font-bold text-slate-500">
                3. Reportar Pago y Adjuntar Comprobante
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5 font-display">
                Validación de Transacción
              </h2>
            </div>

            {feedback && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                {feedback}
              </div>
            )}

            <form onSubmit={handleSubmitReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Plan Seleccionado a Pagar
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 flex items-center justify-between font-mono">
                  <span>
                    {selectedPlan === 'annual'
                      ? 'Suscripción Anual Completa'
                      : 'Suscripción Mensual'}
                  </span>
                  <span className="text-amber-700">
                    {selectedPlan === 'annual' ? '29.99$' : '2.99$'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Número de Referencia / Order ID de Binance Pay
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej. 29481059284102"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Adjuntar Captura o Comprobante de Pago (Imagen)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl cursor-pointer bg-slate-50/70 hover:bg-amber-50/30 transition-colors p-4 text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">
                    Haz clic para subir imagen del comprobante
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    PNG, JPG o WEBP (Si no subes imagen, se generará un recibo digital con tu
                    referencia)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {receiptDataUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={receiptDataUrl}
                      alt="Vista previa del comprobante"
                      referrerPolicy="no-referrer"
                      className="w-12 h-14 object-cover rounded-lg border border-slate-300"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Comprobante adjunto listo</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Visible para validación de {ADMIN_EMAIL}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptDataUrl('')}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full liquid-btn-active py-3.5 px-6 rounded-2xl text-sm font-bold text-slate-900 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {submitting
                    ? 'Enviando comprobante...'
                    : user.subscriptionStatus === 'pending'
                    ? 'Actualizar Comprobante Enviado'
                    : 'Enviar Comprobante para Aprobación'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-12 py-4 border-t border-slate-200/70 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <span>ID Oficial Binance Pay: {BINANCE_PAY_ID}</span>
        <span>Aprobación gestionada en tiempo real por {ADMIN_EMAIL}</span>
      </footer>
    </div>
  );
};
