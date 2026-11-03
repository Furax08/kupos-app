import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Store,
  UserCheck,
  FileBadge,
  CheckCircle2,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { DocumentType, UserAccount } from '../types';

interface StoreSetupScreenProps {
  user: UserAccount;
  onUpdatedUser: (user: UserAccount) => void;
  onBack: () => void;
  onLogout: () => void;
}

const STORE_CATEGORIES = [
  'Abasto, Víveres y Supermercado',
  'Tecnología, Electrónica y Accesorios',
  'Moda, Ropa y Calzado',
  'Farmacia y Salud',
  'Ferretería y Repuestos',
  'Restaurante, Café y Panadería',
  'Cosmética y Cuidado Personal',
  'Comercio General / Multitienda',
];

export const StoreSetupScreen: React.FC<StoreSetupScreenProps> = ({
  user,
  onUpdatedUser,
  onBack,
  onLogout,
}) => {
  const [name, setName] = useState(user.storeProfile.name || '');
  const [address, setAddress] = useState(user.storeProfile.address || '');
  const [category, setCategory] = useState(
    user.storeProfile.category || 'Abasto, Víveres y Supermercado'
  );
  const [phone, setPhone] = useState(user.storeProfile.phone || '');
  const [legalName, setLegalName] = useState(user.legalName || '');
  const [documentType, setDocumentType] = useState<DocumentType>(user.documentType || 'Cédula');
  const [documentNumber, setDocumentNumber] = useState(user.documentNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError('Por favor completa el nombre, dirección y teléfono de tu tienda.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/store/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name,
          address,
          category,
          phone,
          legalName,
          documentType,
          documentNumber,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUpdatedUser(data.user);
      } else {
        setError(data.error || 'No se pudo guardar la tienda.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex flex-col justify-between">
      {/* Top Bar with Back & Logout Buttons */}
      <header className="flex items-center justify-between gap-4 px-6 md:px-12 py-4 border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="liquid-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display">
            Lumina POS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          <span>Titular: {user.legalName}</span>
          <span>·</span>
          <span>{user.email}</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="liquid-btn px-4 py-2 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="max-w-2xl w-full bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Suscripción Aprobada · Cuenta Desbloqueada</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display">
                Configura los datos de tu Tienda
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Completa la información de tu comercio para activar tu POS, catálogo virtual y
                facturación multi-tasa.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl liquid-btn-active flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-slate-900" />
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre de tu Tienda / Negocio
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Inversiones El Sol C.A."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ramo o Categoría Comercial
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dirección del Local / Despacho
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Calle 72 con Av. Delicias, Local 4"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teléfono / WhatsApp Comercial
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +58 414-0000000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Legal Representative Verification */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 mb-3">
                Datos Legales del Titular Registrado
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Legal Completo
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo Doc.
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  >
                    <option value="Cédula">Cédula</option>
                    <option value="DNI">DNI</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° Documento
                  </label>
                  <div className="relative">
                    <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto liquid-btn py-3.5 px-6 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex-1 liquid-btn-active py-3.5 px-6 rounded-2xl text-sm font-bold text-slate-900 cursor-pointer"
              >
                {saving ? 'Guardando Tienda...' : 'Guardar Tienda y Abrir Panel Principal →'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
