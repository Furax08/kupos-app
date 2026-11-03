import React, { useState } from 'react';
import { KeyRound, Mail, ShieldCheck, Store, UserCheck, FileBadge } from 'lucide-react';
import { ADMIN_EMAIL, DocumentType, UserAccount } from '../types';

interface AuthScreenProps {
  onAuthenticated: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalName, setLegalName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('Cédula');
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          legalName,
          documentType,
          documentNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error al autenticar.');
      } else if (data.user) {
        onAuthenticated(data.user);
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/quick-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onAuthenticated(data.user);
      } else {
        setError(data.error || 'No se pudo acceder a la cuenta.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex flex-col justify-between">
      {/* Minimalist Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 md:px-12 py-5 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display">
          Lumina POS
        </span>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setMode('register')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Registro Legal
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Acceso Seguro
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin(ADMIN_EMAIL)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Panel Maestro ({ADMIN_EMAIL})
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            className="liquid-btn px-4 py-2 text-xs font-semibold text-slate-800 rounded-full whitespace-nowrap shrink-0"
          >
            {mode === 'register' ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
          </button>
        </div>
      </header>

      {/* Main Split Viewport */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Column: Value Proposition & Liquid Button Showcase */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-8 pr-0 lg:pr-6">
          <div className="space-y-5">
            <div className="text-xs font-semibold tracking-wide text-amber-700">
              Sistema POS Multi-Tasa · Inventario · Cripto · Catálogo Virtual
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.12] font-display">
              Vende en múltiples divisas y cripto con precisión instantánea.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Gestiona hasta 5 carritos simultáneos por cliente sin perder datos al recargar,
              calcula precios automáticamente en tu moneda primaria, referencial, secundaria y
              criptomonedas oficiales, y controla cuentas por cobrar en tiempo real.
            </p>
          </div>

          {/* Tactile Liquid Button Architecture Preview (inspired by user reference) */}
          <div className="liquid-tray p-5 rounded-3xl space-y-3.5 max-w-lg">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-2">
              <span>Arquitectura Táctil Liquid Glass</span>
              <span>Vista Previa de Precios Multi-Tasa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`px-4 py-3.5 rounded-2xl flex items-center justify-between text-left ${
                  mode === 'register' ? 'liquid-btn-active' : 'liquid-btn text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">1. Registro</span>
                </div>
                <span className="text-xs opacity-60">•••</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carlos.tienda@ejemplo.com')}
                className="liquid-btn px-4 py-3.5 rounded-2xl flex items-center justify-between text-left text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">2. Binance Pay</span>
                </div>
                <span className="text-xs opacity-60">•••</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(ADMIN_EMAIL)}
                className="liquid-btn px-4 py-3.5 rounded-2xl flex items-center justify-between text-left text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">3. POS & Tasas</span>
                </div>
                <span className="text-xs opacity-60">•••</span>
              </button>
            </div>

            {/* Live Example of Product Multi-Rate Display */}
            <div className="bg-white/90 border border-white rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Ejemplo de Etiqueta Multi-Tasa</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  Café Especialidad Arábica 500g
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Tasa Primaria · Ref - Secundaria · Cripto Oficial
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-xl font-extrabold text-slate-900">3.000 VES</div>
                <div className="text-xs font-medium text-slate-500">3$ - 3,000 COP</div>
                <div className="text-[11px] font-medium text-amber-800 mt-0.5">0.00003400 BTC</div>
                <div className="text-[11px] font-medium text-amber-800">3 Usdt</div>
              </div>
            </div>
          </div>

          {/* Direct Demo Access for Owner / Testing */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              Acceso rápido de demostración (Un clic):
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin(ADMIN_EMAIL)}
                className="liquid-btn-dark px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Entrar como Admin Maestro ({ADMIN_EMAIL})</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos.tienda@ejemplo.com')}
                className="liquid-btn px-4 py-2.5 rounded-full text-xs font-semibold text-slate-800 flex items-center gap-2 whitespace-nowrap"
              >
                <Store className="w-4 h-4 text-amber-600" />
                <span>Ver Comerciante en Espera de Aprobación</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-6 flex items-center">
          <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-sm">
            {/* Mode Switcher */}
            <div className="liquid-tray p-1.5 rounded-2xl grid grid-cols-2 gap-2 mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  mode === 'register'
                    ? 'liquid-btn-active text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Crear Usuario y Contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  mode === 'login'
                    ? 'liquid-btn-active text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Iniciar Sesión 🔑
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 font-display">
                {mode === 'register'
                  ? 'Registro de Comerciante / Tienda'
                  : 'Acceso al Panel Principal'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'register'
                  ? 'Ingresa tus datos legales y crea tus credenciales de seguridad.'
                  : 'Ingresa tu correo y contraseña para acceder a tu tienda o al panel maestro.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nombre Legal Completo
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Ej. Juan Carlos Pérez Gómez"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Documento Legal
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                      >
                        <option value="Cédula">Cédula</option>
                        <option value="DNI">DNI</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Número de {documentType}
                      </label>
                      <div className="relative">
                        <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          placeholder="Ej. V-19069695"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Usuario (Correo Electrónico)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@tutienda.com o furax030@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contraseña 🔑
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full liquid-btn-active py-3.5 px-6 rounded-2xl text-sm font-bold text-slate-900 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {loading
                      ? 'Procesando...'
                      : mode === 'register'
                      ? 'Registrarme y Continuar al Plan'
                      : 'Acceder al Panel'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-12 py-4 border-t border-slate-200/70 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <span>Lumina POS · Gestión Comercial Multi-Moneda y Cripto</span>
        <span>Administrador Maestro: {ADMIN_EMAIL} · Binance Pay ID: 190696956</span>
      </footer>
    </div>
  );
};
