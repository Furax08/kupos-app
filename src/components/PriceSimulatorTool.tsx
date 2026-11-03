import React, { useState, useEffect } from 'react';

interface PriceSimulatorToolProps {
  costStr: string;
  marginStr: string;
  priceStr: string;
  stockStr: string;
  primaryCurrency: string;
  primaryRate: number;
  secondaryCurrency: string;
  secondaryRate: number;
  onApplyScenario: (newCost: string, newMargin: string, newPrice: string) => void;
}

const PRESET_MARGINS = [15, 25, 30, 40, 50, 75, 100];

export const PriceSimulatorTool: React.FC<PriceSimulatorToolProps> = ({
  costStr,
  marginStr,
  priceStr,
  stockStr,
  primaryCurrency,
  primaryRate,
  secondaryCurrency,
  secondaryRate,
  onApplyScenario,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [simCost, setSimCost] = useState<string>(costStr || '1.00');
  const [simPrice, setSimPrice] = useState<string>(priceStr || '1.30');
  const [costVariationPct, setCostVariationPct] = useState<number>(0);
  const [promoDiscountPct, setPromoDiscountPct] = useState<number>(0);

  // Sync simulator baseline when user edits main inputs
  useEffect(() => {
    if (costStr !== undefined) setSimCost(costStr);
  }, [costStr]);

  useEffect(() => {
    if (priceStr !== undefined) setSimPrice(priceStr);
  }, [priceStr]);

  const baseCost = Math.max(0, parseFloat(simCost) || 0);
  const effectiveCost = baseCost * (1 + costVariationPct / 100);
  const basePrice = Math.max(0, parseFloat(simPrice) || 0);
  const effectivePrice = basePrice * (1 - promoDiscountPct / 100);
  const stockQty = Math.max(0, parseInt(stockStr, 10) || 0);

  const unitProfit = effectivePrice - effectiveCost;
  // Markup % over cost: ((Price - Cost) / Cost) * 100
  const markupPct = effectiveCost > 0 ? ((effectivePrice - effectiveCost) / effectiveCost) * 100 : 0;
  // Gross Margin % over revenue: ((Price - Cost) / Price) * 100
  const grossMarginPct =
    effectivePrice > 0 ? ((effectivePrice - effectiveCost) / effectivePrice) * 100 : 0;

  const totalInvestment = effectiveCost * stockQty;
  const totalExpectedRevenue = effectivePrice * stockQty;
  const totalExpectedProfit = unitProfit * stockQty;

  // Break-even units needed to recover total batch investment
  const breakEvenUnits =
    effectivePrice > 0 && stockQty > 0 ? Math.ceil(totalInvestment / effectivePrice) : 0;

  const handleSimulatedCostChange = (val: string) => {
    setSimCost(val);
    const numCost = parseFloat(val) || 0;
    const currentMargin = parseFloat(marginStr) || 30;
    if (numCost > 0) {
      const nextPrice = (numCost * (1 + currentMargin / 100)).toFixed(2);
      setSimPrice(nextPrice);
    }
  };

  const handleSimulatedPriceChange = (val: string) => {
    setSimPrice(val);
  };

  const applyCurrentSimulationToProduct = () => {
    const finalCost = effectiveCost > 0 ? effectiveCost.toFixed(2) : '0.00';
    const finalPrice = effectivePrice > 0 ? effectivePrice.toFixed(2) : '0.00';
    const finalMargin = effectiveCost > 0 ? markupPct.toFixed(1) : '0';
    onApplyScenario(finalCost, finalMargin, finalPrice);
    setCostVariationPct(0);
    setPromoDiscountPct(0);
  };

  const applyPresetScenario = (targetMarginPct: number) => {
    const costToUse = effectiveCost > 0 ? effectiveCost : parseFloat(costStr) || 0;
    if (costToUse <= 0) return;
    const calculatedPrice = (costToUse * (1 + targetMarginPct / 100)).toFixed(2);
    setSimCost(costToUse.toFixed(2));
    setSimPrice(calculatedPrice);
    setCostVariationPct(0);
    setPromoDiscountPct(0);
    onApplyScenario(costToUse.toFixed(2), String(targetMarginPct), calculatedPrice);
  };

  const isLoss = unitProfit < 0;
  const isLowMargin = !isLoss && markupPct < 15;

  return (
    <div className="w-full min-w-0 max-w-full bg-slate-900/90 border border-brand-500/30 rounded-2xl overflow-hidden transition-all">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-3 bg-gradient-to-r from-brand-900/50 via-slate-900 to-violet-900/40 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-slate-800/70 transition"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-calculator text-xs"></i>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
              <span>Simulador de Precios y Margen</span>
              <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase">
                Interactivo
              </span>
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              Toca para abrir o cerrar calculadora de escenarios y márgenes
            </span>
          </div>
        </div>
        <i
          className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-slate-400 text-xs transition-transform shrink-0`}
        ></i>
      </button>

      {isOpen && (
        <div className="p-3 sm:p-4 space-y-3.5 border-t border-slate-800 text-xs min-w-0 overflow-x-hidden">
          {/* Interactive Simulation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 text-[11px]">
                  Costo Base Simulado ($)
                </label>
                {costVariationPct !== 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      costVariationPct > 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {costVariationPct > 0 ? `+${costVariationPct}%` : `${costVariationPct}%`} = $
                    {effectiveCost.toFixed(2)}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={simCost}
                onChange={(e) => handleSimulatedCostChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
              />
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Escenario Variación Proveedor:</span>
                  <span className="font-mono text-slate-200">
                    {costVariationPct > 0 ? `+${costVariationPct}%` : `${costVariationPct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  step="5"
                  value={costVariationPct}
                  onChange={(e) => setCostVariationPct( parseInt(e.target.value, 10) )}
                  className="w-full accent-brand-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>-30%</span>
                  <button
                    type="button"
                    onClick={() => setCostVariationPct(0)}
                    className="text-brand-400 hover:underline cursor-pointer"
                  >
                    0% (Actual)
                  </button>
                  <span>+50%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 text-[11px]">
                  Precio Final Simulado ($)
                </label>
                {promoDiscountPct > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                    -{promoDiscountPct}% Oferta = ${effectivePrice.toFixed(2)}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={simPrice}
                onChange={(e) => handleSimulatedPriceChange(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 font-bold"
              />
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Simular Descuento / Oferta:</span>
                  <span className="font-mono text-violet-300">-{promoDiscountPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={promoDiscountPct}
                  onChange={(e) => setPromoDiscountPct(parseInt(e.target.value, 10))}
                  className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Sin desc.</span>
                  <button
                    type="button"
                    onClick={() => setPromoDiscountPct(0)}
                    className="text-violet-400 hover:underline cursor-pointer"
                  >
                    Reiniciar
                  </button>
                  <span>-40%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time KPI Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`p-2.5 rounded-xl border ${
                isLoss
                  ? 'bg-rose-950/40 border-rose-500/40'
                  : isLowMargin
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-emerald-950/30 border-emerald-500/30'
              }`}
            >
              <span className="text-[10px] text-slate-400 block">Ganancia / Unidad</span>
              <span
                className={`text-sm font-extrabold block mt-0.5 ${
                  isLoss ? 'text-rose-400' : isLowMargin ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {unitProfit >= 0 ? `+$${unitProfit.toFixed(2)}` : `-$${Math.abs(unitProfit).toFixed(2)}`}
              </span>
              <span className="text-[9px] text-slate-400 block">
                {(unitProfit * primaryRate).toFixed(2)} {primaryCurrency}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Recargo / Margen</span>
              <span
                className={`text-sm font-extrabold block mt-0.5 ${
                  isLoss ? 'text-rose-400' : 'text-brand-400'
                }`}
              >
                {markupPct.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 block">
                Retorno s/venta: {grossMarginPct.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">
                Ganancia Lote ({stockQty} u.)
              </span>
              <span
                className={`text-sm font-extrabold block mt-0.5 ${
                  totalExpectedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${totalExpectedProfit.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Venta total: ${totalExpectedRevenue.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Punto de Equilibrio</span>
              <span className="text-sm font-extrabold text-amber-400 block mt-0.5">
                {breakEvenUnits} {breakEvenUnits === 1 ? 'unidad' : 'unidades'}
              </span>
              <span className="text-[9px] text-slate-400 block">
                Inversión: ${totalInvestment.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Multi-currency conversion bar for simulated final price */}
          <div className="bg-slate-800/60 border border-slate-700/80 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-300 font-medium">
              <i className="fa-solid fa-tags text-brand-400 mr-1.5"></i>
              Precio Simulado en Monedas:
            </span>
            <div className="flex flex-wrap items-center gap-3 font-mono">
              <span className="text-white font-bold">${effectivePrice.toFixed(2)} USD</span>
              <span className="text-emerald-400 font-bold">
                {(effectivePrice * primaryRate).toFixed(2)} {primaryCurrency}
              </span>
              <span className="text-violet-400 font-bold">
                {(effectivePrice * secondaryRate).toLocaleString('es-CO', {
                  maximumFractionDigits: 0,
                })}{' '}
                {secondaryCurrency}
              </span>
            </div>
          </div>

          {/* Apply simulated values button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-brand-950/40 border border-brand-500/30 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-300">
              {isLoss ? (
                <span className="text-rose-400 font-semibold">
                  ⚠️ Atención: Con este escenario estarías vendiendo por debajo del costo.
                </span>
              ) : (
                <span>
                  ¿Te convence este escenario? Aplícalo directamente a los campos del producto.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={applyCurrentSimulationToProduct}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer shadow-sm transition text-center"
            >
              Aplicar al Producto ✓
            </button>
          </div>

          {/* Preset Margin Scenarios Comparison Table */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-bold text-slate-300">
                <i className="fa-solid fa-table-list mr-1.5 text-amber-400"></i>
                Escenarios Rápidos según Costo (${effectiveCost.toFixed(2)})
              </span>
              <span className="text-[10px] text-slate-400">
                Toca una fila para usar ese precio
              </span>
            </div>
            <div className="w-full overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-left text-[11px] text-slate-300">
                <thead className="bg-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="py-2 px-2">Margen</th>
                    <th className="py-2 px-2">Precio ($)</th>
                    <th className="py-2 px-2">{primaryCurrency}</th>
                    <th className="py-2 px-2 hidden sm:table-cell">Ganancia/U</th>
                    <th className="py-2 px-2 hidden sm:table-cell">Lote</th>
                    <th className="py-2 px-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {PRESET_MARGINS.map((m) => {
                    const baseC = effectiveCost > 0 ? effectiveCost : parseFloat(costStr) || 0;
                    const scenPrice = baseC * (1 + m / 100);
                    const scenUnitProfit = scenPrice - baseC;
                    const scenBatchProfit = scenUnitProfit * stockQty;
                    const isCurrentMargin = Math.abs((parseFloat(marginStr) || 0) - m) < 0.5;

                    return (
                      <tr
                        key={m}
                        onClick={() => applyPresetScenario(m)}
                        className={`hover:bg-slate-800/90 cursor-pointer transition ${
                          isCurrentMargin ? 'bg-brand-900/30' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2 font-bold text-brand-400">
                          +{m}%
                          {m === 30 && (
                            <span className="ml-1 hidden sm:inline-block text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                              Ideal
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-white">
                          ${scenPrice.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-slate-300">
                          {(scenPrice * primaryRate).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-emerald-400 font-semibold hidden sm:table-cell">
                          +${scenUnitProfit.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-emerald-300 hidden sm:table-cell">
                          +${scenBatchProfit.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyPresetScenario(m);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                              isCurrentMargin
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white border border-slate-700'
                            }`}
                          >
                            {isCurrentMargin ? 'Activo' : 'Elegir'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
