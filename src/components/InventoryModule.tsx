import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Package, Search, X } from 'lucide-react';
import { ExchangeRatesData, Product, RateSettings } from '../types';
import { MultiRatePrice } from './MultiRatePrice';

interface InventoryModuleProps {
  products: Product[];
  rateSettings: RateSettings;
  exchangeRates: ExchangeRatesData;
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  rateSettings,
  exchangeRates,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openNewProductModal = () => {
    setEditingProduct({
      name: '',
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Alimentos y Bebidas',
      priceRef: 3,
      costRef: 1.8,
      stock: 30,
      unit: 'und',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;
    setSaving(true);
    try {
      await onSaveProduct(editingProduct);
      setEditingProduct(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-700">Control de Existencias y Precios</div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Inventario de Productos ({products.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fija el precio en tu Tasa de Referencia ({rateSettings.referenceCurrency}) y el sistema
            mostrará automáticamente la Tasa Primaria ({rateSettings.primaryCurrency}), Secundaria y
            Cripto.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewProductModal}
          className="liquid-btn-active px-5 py-3 rounded-2xl text-xs font-extrabold text-slate-900 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Producto</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en inventario por nombre, categoría o SKU..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Inventory Table / Grid */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-base font-bold text-slate-800">No hay productos registrados</div>
            <button
              type="button"
              onClick={openNewProductModal}
              className="liquid-btn-active px-4 py-2 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
            >
              + Agregar Primer Producto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50/60">
                  <th className="py-3.5 px-5">Producto / SKU</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Stock Disponible</th>
                  <th className="py-3.5 px-4">Costo Base</th>
                  <th className="py-3.5 px-5 text-right">Precio Multi-Tasa</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      <div className="text-xs font-mono text-slate-500">{prod.sku}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 font-medium">
                      {prod.category}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          prod.stock <= 5 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {prod.stock}
                      </span>{' '}
                      <span className="text-xs text-slate-500">{prod.unit}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-500">
                      {prod.costRef.toFixed(2)}{' '}
                      {rateSettings.referenceCurrency === 'USD' ? '$' : '€'}
                    </td>
                    <td className="py-4 px-5">
                      <MultiRatePrice
                        priceRef={prod.priceRef}
                        settings={rateSettings}
                        rates={exchangeRates}
                        size="sm"
                        align="right"
                      />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prod)}
                          className="liquid-btn p-2 rounded-xl text-slate-700 hover:text-slate-900 cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod.id)}
                          className="liquid-btn p-2 rounded-xl text-red-600 hover:text-red-700 cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-amber-700">Gestión de Inventario</div>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  {editingProduct.id ? 'Editar Producto' : '+ Agregar Nuevo Producto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  placeholder="Ej. Café Especialidad Arábica 500g"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código / SKU
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    placeholder="Ej. Víveres, Tecnología..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio en Tasa Ref ({rateSettings.referenceCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingProduct.priceRef ?? 3}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priceRef: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Costo Base ({rateSettings.referenceCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingProduct.costRef ?? 1}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        costRef: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock ?? 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidad (und, kg, caja)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'und'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, unit: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Live Preview of how this product's price will look */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Vista previa de etiquetas de precio:
                </div>
                <MultiRatePrice
                  priceRef={Number(editingProduct.priceRef) || 0}
                  settings={rateSettings}
                  rates={exchangeRates}
                  size="sm"
                  align="right"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="liquid-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="liquid-btn-active px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
