import React, { useState } from 'react';
import { ProductMultiRatePrice, RatesConfig } from './ProductMultiRatePrice';

interface WeightProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  image: string;
}

interface WeightSelectorModalProps {
  product: WeightProduct;
  rates: RatesConfig;
  onConfirm: (productId: string, weightKg: number, label: string) => void;
  onClose: () => void;
}

interface WeightPreset {
  label: string;
  grams: number;
  kg: number;
}

const WEIGHT_PRESETS: WeightPreset[] = [
  { label: '100g', grams: 100, kg: 0.1 },
  { label: '200g', grams: 200, kg: 0.2 },
  { label: '250g', grams: 250, kg: 0.25 },
  { label: '500g', grams: 500, kg: 0.5 },
  { label: '750g', grams: 750, kg: 0.75 },
  { label: '1kg', grams: 1000, kg: 1.0 },
];

export const formatWeightLabel = (kg: number, unit: string = 'peso'): string => {
  if (unit !== 'peso') {
    return `${Number(kg.toFixed(3))} ${unit}`;
  }
  const grams = Math.round(kg * 1000);
  if (grams < 1000) {
    return `${grams}g`;
  }
  if (grams === 1000) {
    return '1kg';
  }
  return `${Number(kg.toFixed(3))}kg (${grams}g)`;
};

export const WeightSelectorModal: React.FC<WeightSelectorModalProps> = ({
  product,
  rates,
  onConfirm,
  onClose,
}) => {
  const [selectedGrams, setSelectedGrams] = useState<string>('250');
  const [customAmountPrimary, setCustomAmountPrimary] = useState<string>('');

  const gramsNum = Math.max(0, parseFloat(selectedGrams) || 0);
  const weightKg = gramsNum / 1000;
  const totalUSD = product.price * weightKg;

  const handlePresetClick = (preset: WeightPreset) => {
    setSelectedGrams(String(preset.grams));
    const calcPrimary = product.price * preset.kg * (rates.primaryRate || 1);
    setCustomAmountPrimary(calcPrimary.toFixed(2));
  };

  const handleGramsChange = (val: string) => {
    setSelectedGrams(val);
    const g = parseFloat(val) || 0;
    const kg = g / 1000;
    const calcPrimary = product.price * kg * (rates.primaryRate || 1);
    setCustomAmountPrimary(calcPrimary > 0 ? calcPrimary.toFixed(2) : '');
  };

  const handlePrimaryAmountChange = (val: string) => {
    setCustomAmountPrimary(val);
    const amountPrimary = parseFloat(val) || 0;
    const pricePerKgPrimary = product.price * (rates.primaryRate || 1);
    if (pricePerKgPrimary > 0 && amountPrimary >= 0) {
      const kg = amountPrimary / pricePerKgPrimary;
      const g = Math.round(kg * 1000);
      setSelectedGrams(g > 0 ? String(g) : '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightKg <= 0) return;
    const label = formatWeightLabel(weightKg, product.unit);
    onConfirm(product.id, weightKg, label);
  };

  const unitName = product.unit === 'litros' ? 'Litros / ml' : product.unit === 'metros' ? 'Metros / cm' : 'Peso (Gramos / Kg)';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700"
          />
          <div>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
              <i className="fa-solid fa-scale-balanced mr-1"></i>Venta por {unitName}
            </span>
            <h3 className="text-sm font-extrabold text-white mt-0.5">{product.name}</h3>
            <p className="text-[10px] text-slate-400">
              Precio por Kg: ${(product.price * (rates.primaryRate || 1)).toFixed(2)}{' '}
              {rates.primaryCurrency} (${product.price.toFixed(2)} USD/Kg) • Stock: {product.stock}{' '}
              Kg
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ minWidth: 0, minHeight: 36 }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
        >
          <i className="fa-solid fa-arrow-left text-amber-400"></i>
          <span>Volver</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Preset Buttons: 100g, 200g, 250g, 500g, 750g, 1kg */}
        <div>
          <label className="block font-bold text-slate-200 mb-2">
            Selecciona cuánto se está vendiendo:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {WEIGHT_PRESETS.map((preset) => {
              const isSelected = Math.round(gramsNum) === preset.grams;
              const presetPricePrimary =
                product.price * preset.kg * (rates.primaryRate || 1);
              const presetPriceUSD = product.price * preset.kg;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`min-h-[56px] p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-600/30 scale-[1.02]'
                      : 'bg-slate-900 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <span className="text-sm font-extrabold">{preset.label}</span>
                  <span
                    className={`text-[10px] font-bold mt-0.5 ${
                      isSelected ? 'text-emerald-200' : 'text-emerald-400'
                    }`}
                  >
                    {presetPricePrimary.toFixed(2)} {rates.primaryCurrency}
                  </span>
                  <span
                    className={`text-[9px] ${
                      isSelected ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    ${presetPriceUSD.toFixed(2)} {rates.refCurrency || 'USD'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Grams or Custom Money Amount */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/90 border border-slate-700 p-3 rounded-2xl">
          <div>
            <label className="block text-[10px] font-semibold text-slate-300 mb-1">
              Cantidad en Gramos (g)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={selectedGrams}
                onChange={(e) => handleGramsChange(e.target.value)}
                placeholder="Ej. 250"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white font-extrabold text-sm pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                g
              </span>
            </div>
            <span className="text-[10px] text-brand-400 font-semibold block mt-1">
              Equivale a: {weightKg.toFixed(3)} Kg
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-emerald-400 mb-1">
              O cobrar por monto ({rates.primaryCurrency})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={customAmountPrimary}
              onChange={(e) => handlePrimaryAmountChange(e.target.value)}
              placeholder={`Monto en ${rates.primaryCurrency}`}
              className="w-full bg-slate-800 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-400 font-extrabold text-sm"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Calcula los gramos automáticamente
            </span>
          </div>
        </div>

        {/* Live Multi-Rate Total Preview for the Selected Weight */}
        <div className="bg-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Total a cobrar por {formatWeightLabel(weightKg, product.unit)}:
            </span>
            <span className="text-[10px] font-bold text-amber-400">
              {weightKg.toFixed(3)} Kg
            </span>
          </div>
          <ProductMultiRatePrice basePriceUSD={totalUSD} rates={rates} />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={weightKg <= 0 || weightKg > product.stock}
            className="flex-1 min-h-[48px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer transition flex items-center justify-center"
          >
            <i className="fa-solid fa-cart-plus mr-1.5"></i>
            Agregar {formatWeightLabel(weightKg, product.unit)} al Carrito
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] min-w-[88px] bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-semibold cursor-pointer flex items-center justify-center"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
