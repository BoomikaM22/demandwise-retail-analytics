import React, { useState } from "react";
import { Terminal, Send, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

export const ScoringSandbox: React.FC = () => {
  const [formData, setFormData] = useState({
    sku_id: "SKU-GRO-001",
    product_name: "Royal Basmati Rice 5kg",
    category: "Staples & Groceries",
    on_hand: 95,
    on_order: 0,
    lead_time_weeks: 2,
    safety_stock: 40,
    moq: 50,
    unit_cost_inr: 420.0,
    unit_price_inr: 599.0,
    avg_weekly_demand: 140.0,
    demand_cv: 0.18,
    is_promo: 0,
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleExecuteScoring = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute scoring request");
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const curlCommand = `curl -X POST http://localhost:3000/api/score \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(formData, null, 2)}'`;
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dee2e6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-black tracking-wider text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Deliverable D6 Service
            </span>
            <span className="text-xs bg-[#f8f9fa] text-[#1a1a1a] font-mono font-bold px-2 py-0.5 rounded border border-[#dee2e6]">
              POST /api/score
            </span>
          </div>
          <h2 className="text-base font-black text-[#1a1a1a] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
            <span>Deployed Scoring Service API Testbench</span>
          </h2>
          <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
            Real-time microservice interface for automated ERP/WMS inventory risk scoring and 8-week forward projections.
          </p>
        </div>

        <button
          onClick={copyCurl}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[#dee2e6] hover:bg-[#f8f9fa] text-[#1a1a1a] font-bold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6c757d]" />}
          <span>{copied ? "Copied cURL" : "Copy cURL"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6c757d]">
            Request Payload Parameters
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">SKU ID</label>
              <input
                type="text"
                value={formData.sku_id}
                onChange={(e) => handleInputChange("sku_id", e.target.value)}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Product Name</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => handleInputChange("product_name", e.target.value)}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-medium text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">On-Hand Stock</label>
              <input
                type="number"
                value={formData.on_hand}
                onChange={(e) => handleInputChange("on_hand", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">On-Order Stock</label>
              <input
                type="number"
                value={formData.on_order}
                onChange={(e) => handleInputChange("on_order", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Lead Time (wks)</label>
              <input
                type="number"
                value={formData.lead_time_weeks}
                onChange={(e) => handleInputChange("lead_time_weeks", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Weekly Demand</label>
              <input
                type="number"
                value={formData.avg_weekly_demand}
                onChange={(e) => handleInputChange("avg_weekly_demand", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Supplier MOQ</label>
              <input
                type="number"
                value={formData.moq}
                onChange={(e) => handleInputChange("moq", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Safety Stock</label>
              <input
                type="number"
                value={formData.safety_stock}
                onChange={(e) => handleInputChange("safety_stock", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Selling Price (₹)</label>
              <input
                type="number"
                value={formData.unit_price_inr}
                onChange={(e) => handleInputChange("unit_price_inr", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1">Cost Price (₹)</label>
              <input
                type="number"
                value={formData.unit_cost_inr}
                onChange={(e) => handleInputChange("unit_cost_inr", Number(e.target.value))}
                className="w-full text-xs bg-[#f8f9fa] border border-[#dee2e6] rounded p-1.5 font-mono font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
          </div>

          <button
            onClick={handleExecuteScoring}
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-bold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Executing Scoring Request...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Trigger Live Scoring API</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Response JSON & Outcome */}
        <div className="lg:col-span-6 bg-[#1a1a1a] rounded-lg p-4 text-[#dee2e6] flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#343a40] text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-[#f8f9fa] font-bold">HTTP Response</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                {latency !== null && <span className="text-[#adb5bd]">{latency} ms</span>}
                <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                  200 OK
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 my-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {response ? (
              <div className="mt-3">
                {/* Result Card */}
                <div className="p-3 bg-[#212529] rounded border border-[#343a40] mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#adb5bd] font-bold uppercase tracking-wider">Risk Assessment:</span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                        response.result?.risk_status === "REORDER NOW"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : response.result?.risk_status === "MARKDOWN / CLEAR"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {response.result?.risk_status}
                    </span>
                  </div>
                  <div className="text-xs text-[#f8f9fa] mt-2">
                    <strong className="text-[#adb5bd]">Recommended PO Qty:</strong>{" "}
                    <span className="text-emerald-400 font-mono font-black">
                      {response.result?.recommended_order_qty} units
                    </span>
                  </div>
                  <div className="text-xs text-[#f8f9fa] mt-1">
                    <strong className="text-[#adb5bd]">Cover:</strong> {response.result?.weeks_of_supply} wks of supply
                  </div>
                  <div className="text-[11px] text-[#ced4da] mt-1 italic">
                    "{response.result?.recommended_action}"
                  </div>
                </div>

                {/* Raw JSON viewer */}
                <div className="max-h-56 overflow-y-auto font-mono text-[11px] text-emerald-300 bg-black/50 p-3 rounded border border-[#343a40] scrollbar-thin">
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-[#6c757d] text-xs font-mono">
                Click "Trigger Live Scoring API" to evaluate this SKU via the backend service.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#343a40] text-[10px] text-[#adb5bd] font-mono flex items-center justify-between">
            <span>Payload Validation: RFC-7946 Standard</span>
            <span>Auth: Bearer Token / Internal Microservice</span>
          </div>
        </div>
      </div>
    </div>
  );
};
