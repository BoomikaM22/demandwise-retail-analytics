import React, { useState, useEffect } from "react";
import { ScoredSKU, RiskStatus } from "../types";
import { RefreshCw, ShoppingBag, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";

interface ScenarioSimulatorProps {
  sku: ScoredSKU;
  allSkus: ScoredSKU[];
  onSelectSku: (sku: ScoredSKU) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  sku,
  allSkus,
  onSelectSku,
}) => {
  // Simulator state variables
  const [onHand, setOnHand] = useState<number>(sku.on_hand_inventory);
  const [onOrder, setOnOrder] = useState<number>(sku.on_order_inventory);
  const [leadTime, setLeadTime] = useState<number>(sku.lead_time_weeks);
  const [demandShiftPct, setDemandShiftPct] = useState<number>(0); // -50% to +100%
  const [isPromoActive, setIsPromoActive] = useState<boolean>(false);

  // Sync when parent SKU selection changes
  useEffect(() => {
    setOnHand(sku.on_hand_inventory);
    setOnOrder(sku.on_order_inventory);
    setLeadTime(sku.lead_time_weeks);
    setDemandShiftPct(0);
    setIsPromoActive(false);
  }, [sku]);

  // Real-time calculation based on simulated parameters
  const promoMultiplier = isPromoActive ? 1.30 : 1.0;
  const demandMultiplier = (1 + demandShiftPct / 100) * promoMultiplier;
  const simWeeklyDemand = Math.max(1, sku.avg_forward_weekly_demand * demandMultiplier);
  const simLeadTimeDemand = simWeeklyDemand * leadTime;
  const simTargetBuffer = simLeadTimeDemand + sku.safety_stock_units;
  const simTotalAvailable = onHand + onOrder;
  const simWos = Math.round((onHand / simWeeklyDemand) * 10) / 10;

  let simStatus: RiskStatus = "HEALTHY";
  let simRecommendedOrder = 0;
  let simLostSales = 0;
  let simExcessCapital = 0;
  let simMarkdownExposure = 0;

  if (simTotalAvailable < simTargetBuffer || simWos < leadTime) {
    simStatus = "REORDER NOW";
    const deficit = Math.max(0, simTargetBuffer - simTotalAvailable);
    const moq = sku.minimum_order_qty;
    simRecommendedOrder = Math.ceil(deficit / moq) * moq;
    simRecommendedOrder = Math.max(moq, simRecommendedOrder);
    simLostSales = Math.round(deficit * sku.unit_selling_price_inr);
  } else if (simWos > 10.0) {
    simStatus = "MARKDOWN / CLEAR";
    const excess = Math.max(0, onHand - simWeeklyDemand * 6.0);
    simExcessCapital = Math.round(excess * sku.unit_cost_inr);
    simMarkdownExposure = Math.round(excess * sku.unit_selling_price_inr * 0.30);
  } else if (sku.demand_cv > 0.35 || simWos <= leadTime + 1.5) {
    simStatus = "WATCH / VOLATILE";
    simLostSales = Math.round(simWeeklyDemand * 0.5 * sku.unit_selling_price_inr);
  } else {
    simStatus = "HEALTHY";
  }

  const resetToActual = () => {
    setOnHand(sku.on_hand_inventory);
    setOnOrder(sku.on_order_inventory);
    setLeadTime(sku.lead_time_weeks);
    setDemandShiftPct(0);
    setIsPromoActive(false);
  };

  return (
    <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dee2e6]">
        <div>
          <span className="text-[9px] uppercase font-black tracking-wider text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Interactive Supply Chain Simulator
          </span>
          <h2 className="text-base font-black text-[#1a1a1a] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
            <span>{sku.sku_id} – {sku.product_name}</span>
          </h2>
          <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
            Simulate promotional surges, supplier delays, or inventory shifts in real-time.
          </p>
        </div>

        {/* SKU Selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sku.sku_id}
            onChange={(e) => {
              const found = allSkus.find((s) => s.sku_id === e.target.value);
              if (found) onSelectSku(found);
            }}
            className="text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded px-3 py-1.5 focus:outline-none focus:border-[#1e3a8a] text-[#1a1a1a] font-bold cursor-pointer"
          >
            {allSkus.map((s) => (
              <option key={s.sku_id} value={s.sku_id}>
                {s.sku_id} ({s.product_name.slice(0, 24)}...)
              </option>
            ))}
          </select>
          <button
            onClick={resetToActual}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-[#dee2e6] hover:bg-[#f8f9fa] text-[#1a1a1a] font-bold transition"
            title="Reset to Actual Baseline"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#6c757d]" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6c757d]">
            Simulation Inputs & Stress Tests
          </h3>

          {/* On-Hand Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-bold">
              <span className="text-[#1a1a1a]">On-Hand Stock (units)</span>
              <span className="font-mono text-[#1e3a8a]">{onHand} units</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1000, sku.on_hand_inventory * 3)}
              step={10}
              value={onHand}
              onChange={(e) => setOnHand(Number(e.target.value))}
              className="w-full h-1.5 bg-[#dee2e6] rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
            />
          </div>

          {/* On-Order Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-bold">
              <span className="text-[#1a1a1a]">On-Order Stock (units)</span>
              <span className="font-mono text-[#1e3a8a]">{onOrder} units</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(500, sku.on_order_inventory * 3 || 300)}
              step={10}
              value={onOrder}
              onChange={(e) => setOnOrder(Number(e.target.value))}
              className="w-full h-1.5 bg-[#dee2e6] rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
            />
          </div>

          {/* Lead Time */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-bold">
              <span className="text-[#1a1a1a]">Supplier Lead Time (weeks)</span>
              <span className="font-mono text-[#1e3a8a]">{leadTime} weeks</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              className="w-full h-1.5 bg-[#dee2e6] rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
            />
          </div>

          {/* Demand Surge / Lull Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-bold">
              <span className="text-[#1a1a1a]">Demand Shift (% Surge / Festival)</span>
              <span
                className={`font-mono font-bold ${
                  demandShiftPct > 0 ? "text-emerald-700" : demandShiftPct < 0 ? "text-red-600" : "text-[#1a1a1a]"
                }`}
              >
                {demandShiftPct > 0 ? `+${demandShiftPct}%` : `${demandShiftPct}%`}
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={100}
              step={5}
              value={demandShiftPct}
              onChange={(e) => setDemandShiftPct(Number(e.target.value))}
              className="w-full h-1.5 bg-[#dee2e6] rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
            />
          </div>

          {/* Promotional Toggle */}
          <div className="flex items-center justify-between p-3 rounded border border-[#dee2e6] bg-[#f8f9fa]">
            <div>
              <span className="text-xs font-bold text-[#1a1a1a] block">Activate Marketing Promotion</span>
              <span className="text-[10px] text-[#6c757d] font-semibold">Applies estimated +30% promotional lift</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPromoActive}
                onChange={(e) => setIsPromoActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#dee2e6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1e3a8a]"></div>
            </label>
          </div>
        </div>

        {/* Live Simulation Outcomes Column */}
        <div className="lg:col-span-6 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6c757d]">
                Simulated Resulting Risk
              </span>
              <div>
                {simStatus === "REORDER NOW" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    <ShoppingBag className="w-2.5 h-2.5 text-red-600" />
                    REORDER NOW
                  </span>
                )}
                {simStatus === "MARKDOWN / CLEAR" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <AlertCircle className="w-2.5 h-2.5 text-indigo-600" />
                    MARKDOWN
                  </span>
                )}
                {simStatus === "WATCH / VOLATILE" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                    WATCH LIST
                  </span>
                )}
                {simStatus === "HEALTHY" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    HEALTHY
                  </span>
                )}
              </div>
            </div>

            {/* Metric Grids */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white p-3 rounded border border-[#dee2e6]">
                <span className="text-[10px] font-bold uppercase text-[#6c757d] block">Weeks of Supply</span>
                <span className="text-xl font-black font-mono text-[#1a1a1a]">{simWos.toFixed(1)} wks</span>
                <span className="text-[9px] text-[#adb5bd] font-bold block">vs {leadTime}w lead time</span>
              </div>
              <div className="bg-white p-3 rounded border border-[#dee2e6]">
                <span className="text-[10px] font-bold uppercase text-[#6c757d] block">Weekly Demand</span>
                <span className="text-xl font-black font-mono text-[#1a1a1a]">
                  {Math.round(simWeeklyDemand)} units
                </span>
                <span className="text-[9px] text-[#adb5bd] font-bold block">Base: {sku.avg_forward_weekly_demand}</span>
              </div>
              <div className="bg-white p-3 rounded border border-[#dee2e6]">
                <span className="text-[10px] font-bold uppercase text-[#6c757d] block">Recommended Order</span>
                <span className="text-xl font-black font-mono text-[#1e3a8a]">
                  {simRecommendedOrder > 0 ? `${simRecommendedOrder} units` : "0 (None)"}
                </span>
                <span className="text-[9px] text-[#adb5bd] font-bold block">MOQ: {sku.minimum_order_qty}</span>
              </div>
              <div className="bg-white p-3 rounded border border-[#dee2e6]">
                <span className="text-[10px] font-bold uppercase text-[#6c757d] block">Financial Exposure</span>
                <span className="text-xl font-black font-mono text-red-600">
                  {simLostSales > 0
                    ? `₹${simLostSales.toLocaleString("en-IN")}`
                    : simExcessCapital > 0
                    ? `₹${simExcessCapital.toLocaleString("en-IN")}`
                    : "₹0"}
                </span>
                <span className="text-[9px] text-[#adb5bd] font-bold block">
                  {simLostSales > 0 ? "Lost Sales Risk" : simExcessCapital > 0 ? "Excess Locked Capital" : "Neutral"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-[#dee2e6] text-xs text-[#495057]">
            <strong className="text-[#1a1a1a] block mb-0.5">Simulation Note:</strong>
            {simStatus === "REORDER NOW" &&
              `Available stock (${simTotalAvailable} units) fails to cover the combined lead time demand and safety stock (${Math.round(
                simTargetBuffer
              )} units). Immediate replenishment is mandated.`}
            {simStatus === "MARKDOWN / CLEAR" &&
              `Inventory levels (${onHand} units) provide ${simWos} weeks of forward supply, far exceeding the 10-week safety ceiling. Markdown discount of 25%-30% recommended to release cash flow.`}
            {simStatus === "WATCH / VOLATILE" &&
              `Inventory buffer (${simWos} wks) is near supplier lead time (${leadTime} wks). Continue monitoring closely.`}
            {simStatus === "HEALTHY" &&
              `Stock coverage (${simWos} weeks) comfortably absorbs lead time volatility while avoiding unnecessary working capital drag.`}
          </div>
        </div>
      </div>
    </div>
  );
};
