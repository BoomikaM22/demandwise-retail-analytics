import React, { useState, useEffect } from "react";
import { 
  Header, 
  NavTab 
} from "./components/Header";
import { MetricCard } from "./components/MetricCard";
import { DemandChart } from "./components/DemandChart";
import { RiskMatrixTable } from "./components/RiskMatrixTable";
import { ScenarioSimulator } from "./components/ScenarioSimulator";
import { ScoringSandbox } from "./components/ScoringSandbox";
import { ModelEvaluationView } from "./components/ModelEvaluationView";
import { ReportsViewer } from "./components/ReportsViewer";
import { AcceptanceChecklist } from "./components/AcceptanceChecklist";
import { 
  ScoredSKU, 
  InventorySummary, 
  ModelEvaluationResults, 
  EDASummary, 
  ForecastPoint 
} from "./types";
import { 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Sparkles, 
  Package, 
  Layers, 
  Sliders, 
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  PackageCheck
} from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Core datasets
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<ModelEvaluationResults | null>(null);
  const [edaSummary, setEdaSummary] = useState<EDASummary | null>(null);
  const [selectedSku, setSelectedSku] = useState<ScoredSKU | null>(null);
  const [skuForecasts, setSkuForecasts] = useState<ForecastPoint[]>([]);

  // Fetch initial summary from server
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, evalRes, edaRes] = await Promise.all([
          fetch("/api/summary"),
          fetch("/api/evaluation"),
          fetch("/api/eda")
        ]);

        if (!sumRes.ok) throw new Error("Failed to load inventory summary");
        const sumData = await sumRes.json();
        const evalData = await evalRes.json();
        const edaData = await edaRes.json();

        setInventorySummary(sumData.inventorySummary);
        setEvaluationResults(evalData.data);
        setEdaSummary(edaData.data);

        // Select first SKU by default
        const skus = sumData.inventorySummary?.scored_skus || [];
        if (skus.length > 0) {
          setSelectedSku(skus[0]);
        }
      } catch (err: any) {
        console.error("Error loading application data:", err);
        setError(err.message || "Failed to initialize DEMANDWISE");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch forecast points whenever selectedSku changes
  useEffect(() => {
    if (!selectedSku) return;
    async function loadSkuForecast() {
      try {
        const res = await fetch(`/api/sku/${selectedSku.sku_id}`);
        if (res.ok) {
          const data = await res.json();
          setSkuForecasts(data.forwardForecast || []);
        }
      } catch (err) {
        console.error("Error loading SKU forecast:", err);
      }
    }
    loadSkuForecast();
  }, [selectedSku?.sku_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold mb-4 animate-bounce">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Loading DEMANDWISE Analytics Engine...</h1>
        <p className="text-xs text-slate-400 mt-2 font-mono">Initializing 104-week retail time-series pipelines...</p>
      </div>
    );
  }

  if (error || !inventorySummary || !evaluationResults || !edaSummary) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-rose-950/60 border border-rose-800 p-6 rounded-xl max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Initialization Error</h2>
          <p className="text-xs text-rose-300 mt-2">{error || "Data files missing"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const skus = inventorySummary.scored_skus || [];
  const fin = inventorySummary.financial_impact_inr;
  const dist = inventorySummary.status_distribution;
  const comp = evaluationResults.overall_comparison;

  return (
    <div className="min-h-screen bg-[#f1f3f5] text-[#1a1a1a] flex flex-col font-sans selection:bg-[#1e3a8a] selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalSkus={skus.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW                                  */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* 4 Primary Executive KPIs - High Density Connected Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#dee2e6] bg-white rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#dee2e6] shadow-xs">
              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#6c757d]">
                  <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest">Stockout Lost Sales</span>
                  <ShoppingCart className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black tracking-tighter text-red-600">
                    ₹{fin.total_potential_lost_sales_inr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                    Urgent
                  </span>
                </div>
                <p className="text-[10px] text-[#6c757d] font-semibold mt-2">12 SKUs with critical stockout deficit</p>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#6c757d]">
                  <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest">Excess Capital Locked</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black tracking-tighter text-amber-600">
                    ₹{fin.total_excess_capital_locked_inr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    Holding Drag
                  </span>
                </div>
                <p className="text-[10px] text-[#6c757d] font-semibold mt-2">4 SKUs exceeding 10 weeks of supply</p>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#6c757d]">
                  <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest">Forecast Accuracy (WAPE)</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black tracking-tighter text-[#1e3a8a]">
                    {comp.ml_model.wape_pct}%
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    +{comp.wape_reduction_pct_points}% Gain
                  </span>
                </div>
                <p className="text-[10px] text-[#6c757d] font-semibold mt-2">vs 25.64% Seasonal-Naive baseline</p>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#6c757d]">
                  <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest">Working Capital at Risk</span>
                  <Layers className="w-3.5 h-3.5 text-[#6c757d]" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black tracking-tighter text-[#1a1a1a]">
                    ₹{fin.total_working_capital_at_risk_inr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-50 text-[#1e3a8a] border border-blue-200">
                    30 SKUs
                  </span>
                </div>
                <p className="text-[10px] text-[#6c757d] font-semibold mt-2">Lost Sales + Trapped Inventory</p>
              </div>
            </div>

            {/* 4-Quadrant Inventory Risk Distribution Strip */}
            <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
                    <span>Portfolio Inventory Health Status Breakdown (D4)</span>
                  </h3>
                  <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
                    Deterministic 4-quadrant action distribution based on 8-week forward demand vs lead time buffers.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("risk-grid")}
                  className="flex items-center gap-1 text-xs font-bold text-[#1e3a8a] hover:underline transition"
                >
                  <span>Open Full Decision Grid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Visual Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setActiveTab("risk-grid")}
                  className="p-3.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-red-700 font-bold text-[10px] uppercase">
                    <span>REORDER NOW</span>
                    <ShoppingCart className="w-3 h-3" />
                  </div>
                  <div className="text-2xl font-black font-mono text-red-700 mt-1">
                    {dist["REORDER NOW"]} <span className="text-[10px] font-normal text-red-600">SKUs</span>
                  </div>
                  <span className="text-[10px] text-red-600 font-semibold block mt-1">Immediate stockout exposure</span>
                </div>

                <div
                  onClick={() => setActiveTab("risk-grid")}
                  className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-indigo-700 font-bold text-[10px] uppercase">
                    <span>MARKDOWN / CLEAR</span>
                    <AlertCircle className="w-3 h-3" />
                  </div>
                  <div className="text-2xl font-black font-mono text-indigo-700 mt-1">
                    {dist["MARKDOWN / CLEAR"]} <span className="text-[10px] font-normal text-indigo-600">SKUs</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold block mt-1">WOS &gt; 10 weeks capital drag</span>
                </div>

                <div
                  onClick={() => setActiveTab("risk-grid")}
                  className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-amber-800 font-bold text-[10px] uppercase">
                    <span>WATCH / VOLATILE</span>
                    <ShieldAlert className="w-3 h-3" />
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-800 mt-1">
                    {dist["WATCH / VOLATILE"]} <span className="text-[10px] font-normal text-amber-700">SKUs</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold block mt-1">High variance (CV &gt; 0.35)</span>
                </div>

                <div
                  onClick={() => setActiveTab("risk-grid")}
                  className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-emerald-800 font-bold text-[10px] uppercase">
                    <span>HEALTHY</span>
                    <PackageCheck className="w-3 h-3" />
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                    {dist["HEALTHY"]} <span className="text-[10px] font-normal text-emerald-700">SKUs</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Optimal 4–8 weeks coverage</span>
                </div>
              </div>
            </div>

            {/* 3 Core Business Insights (D2) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#1e3a8a]" />
                <h3 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a]">
                  Three Core Business Insights & Strategic Prescriptions (D2)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {edaSummary.business_insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-wider text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Strategic Finding
                      </span>
                      <h4 className="text-sm font-black text-[#1a1a1a] mt-2 mb-1.5">{ins.title}</h4>
                      <p className="text-xs text-[#495057] leading-relaxed mb-3">{ins.finding}</p>

                      <div className="p-2.5 rounded bg-[#f8f9fa] border border-[#dee2e6] text-xs font-mono text-[#1a1a1a] mb-3">
                        <span className="text-[#6c757d] block text-[9px] font-bold uppercase">Impact Metric:</span>
                        {ins.quantitative_metric}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#dee2e6] text-xs text-[#495057]">
                      <strong className="text-[#1a1a1a] block mb-0.5">Recommended Action:</strong>
                      {ins.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Performance & SKU Velocity Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Category Breakdown */}
              <div className="lg:col-span-6 bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
                <h3 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
                  <span>Category Revenue & Velocity Overview</span>
                </h3>
                <div className="space-y-3">
                  {edaSummary.category_summary.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#1a1a1a]">{cat.category}</span>
                        <span className="font-mono text-[#1e3a8a]">
                          ₹{cat.total_revenue_inr.toLocaleString("en-IN")} ({cat.revenue_share_pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1e3a8a] rounded-full"
                          style={{ width: `${cat.revenue_share_pct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#adb5bd] font-bold uppercase">
                        <span>{cat.sku_count} Active SKUs</span>
                        <span>{cat.total_units_sold.toLocaleString("en-IN")} units sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast Movers vs Slow Movers */}
              <div className="lg:col-span-6 bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
                    <span>Top Volume Drivers vs Slow Movers</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Top 3 Volume Drivers (Fast Movers)
                      </span>
                      <div className="space-y-1.5">
                        {edaSummary.top_5_movers.slice(0, 3).map((s) => (
                          <div
                            key={s.sku_id}
                            className="flex items-center justify-between p-2 rounded bg-[#f8f9fa] border border-[#f1f3f5] text-xs font-medium"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#1a1a1a]">{s.sku_id}</span>
                              <span className="text-[#6c757d] ml-2 truncate max-w-[160px] inline-block align-bottom">
                                {s.product_name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-emerald-700">
                              {Number(s.total_units).toLocaleString("en-IN")} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                        Slow Moving Lines (Dead Stock Risk)
                      </span>
                      <div className="space-y-1.5">
                        {edaSummary.slow_5_movers.slice(0, 3).map((s) => (
                          <div
                            key={s.sku_id}
                            className="flex items-center justify-between p-2 rounded bg-[#f8f9fa] border border-[#f1f3f5] text-xs font-medium"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#1a1a1a]">{s.sku_id}</span>
                              <span className="text-[#6c757d] ml-2 truncate max-w-[160px] inline-block align-bottom">
                                {s.product_name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-amber-700">
                              {Number(s.total_units).toLocaleString("en-IN")} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dee2e6] flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-[#adb5bd] uppercase">3,120 records audited</span>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="text-xs font-bold text-[#1e3a8a] hover:underline"
                  >
                    View Full EDA Report &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DEMAND FORECASTING & WAPE                          */}
        {/* ========================================================= */}
        {activeTab === "forecasting" && (
          <div className="space-y-5">
            {/* Forecast SKU Selector & Visual Curve */}
            <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dee2e6] mb-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
                    <span>Weekly SKU Demand Forecasting Engine (D3)</span>
                  </h2>
                  <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
                    8-week forward horizon predictions comparing regularized ML against 52-week Seasonal-Naive baseline.
                  </p>
                </div>

                {/* SKU Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">Inspect SKU:</span>
                  <select
                    value={selectedSku?.sku_id || ""}
                    onChange={(e) => {
                      const found = skus.find((s) => s.sku_id === e.target.value);
                      if (found) setSelectedSku(found);
                    }}
                    className="text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded px-3 py-1.5 focus:outline-none focus:border-[#1e3a8a] text-[#1a1a1a] font-bold cursor-pointer"
                  >
                    {skus.map((s) => (
                      <option key={s.sku_id} value={s.sku_id}>
                        {s.sku_id} – {s.product_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chart Component */}
              <DemandChart
                data={skuForecasts}
                skuName={selectedSku?.product_name}
                leadTimeWeeks={selectedSku?.lead_time_weeks}
              />
            </div>

            {/* Model Evaluation & Rolling-Origin Backtesting */}
            <ModelEvaluationView evaluation={evaluationResults} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: INVENTORY RISK GRID                                */}
        {/* ========================================================= */}
        {activeTab === "risk-grid" && (
          <div className="space-y-5">
            <RiskMatrixTable
              skus={skus}
              selectedSkuId={selectedSku?.sku_id}
              onSelectSku={(sku) => {
                setSelectedSku(sku);
                setActiveTab("simulator");
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: WHAT-IF SIMULATOR                                  */}
        {/* ========================================================= */}
        {activeTab === "simulator" && selectedSku && (
          <div className="space-y-5">
            <ScenarioSimulator
              sku={selectedSku}
              allSkus={skus}
              onSelectSku={(sku) => setSelectedSku(sku)}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SCORING SERVICE (D6)                               */}
        {/* ========================================================= */}
        {activeTab === "scoring-api" && (
          <div className="space-y-5">
            <ScoringSandbox />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: REPORTS & EXECUTIVE READOUT (D7)                    */}
        {/* ========================================================= */}
        {activeTab === "reports" && (
          <div className="space-y-5">
            <ReportsViewer initialReport="executive" />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: ZIDIO ACCEPTANCE CHECKLIST                         */}
        {/* ========================================================= */}
        {activeTab === "acceptance" && (
          <div className="space-y-5">
            <AcceptanceChecklist />
          </div>
        )}
      </main>

      {/* High Density Footer */}
      <footer className="bg-white border-t border-[#dee2e6] mt-10 py-3 text-[10px] font-medium text-[#adb5bd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#1a1a1a]">DEMANDWISE</span>
            <span>•</span>
            <span className="text-[#6c757d] font-bold">Retail Demand & Inventory Analytics</span>
            <span>•</span>
            <span className="text-[#1e3a8a] font-bold font-mono">100% Zidio Engagement Compliance</span>
          </div>
          <div className="flex items-center gap-3 text-[#adb5bd]">
            <span>D1–D7 End-to-End System</span>
            <span>•</span>
            <span>Express REST Engine</span>
            <span>•</span>
            <span>Port 3000 Ingress</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
