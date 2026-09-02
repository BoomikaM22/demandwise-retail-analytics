import React, { useState } from "react";
import { Presentation, FileText, HelpCircle, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface ReportsViewerProps {
  initialReport?: "executive" | "viva" | "eda" | "readme";
}

export const ReportsViewer: React.FC<ReportsViewerProps> = ({ initialReport = "executive" }) => {
  const [activeReport, setActiveReport] = useState<"executive" | "viva" | "eda" | "readme">(initialReport);
  const [currentSlide, setCurrentSlide] = useState(1);

  // 10-Slide Deck for Deliverable D7
  const slides = [
    {
      slideNumber: 1,
      title: "Business Problem & Retail Inventory Dilemma",
      subtitle: "The Cost of Imbalance in FMCG Supply Chains",
      bullets: [
        "Retail profitability is constrained by two critical failure modes: Stockouts causing lost revenue and customer defection, vs Overstocking tying up capital and driving costly markdowns.",
        "Traditional ERP systems rely on trailing 30-day moving averages that consistently lag demand inflection points.",
        "Seasonal holiday spikes (Diwali, summer beverages) and marketing promotions create non-linear demand shocks.",
        "DEMANDWISE delivers multi-step 8-week forward demand forecasts paired with deterministic 4-quadrant inventory risk classifications."
      ],
      speakerNotes: "Highlight to executives that demand forecasting is not an academic exercise; every 1% in forecast error translates directly into balance sheet working capital inefficiency."
    },
    {
      slideNumber: 2,
      title: "Data Foundations & Portfolio Scale",
      subtitle: "104 Weeks of Ingested Retail History",
      bullets: [
        "Ingested Dataset: 104 historical weeks (2024 to 2025) comprising 3,120 weekly SKU observations.",
        "Catalog Scope: 30 active SKUs across 5 core categories: Staples, Beverages, Snacks, Personal Care, and Household.",
        "Financial Volume: 466,026 units demanded representing ₹12.19 Crore in historical gross realized sales.",
        "Data Hygiene: 100% referential integrity across sales, catalog, and inventory files; zero data leakage."
      ],
      speakerNotes: "Reassure stakeholders that the data pipeline is fully validated and verified point-in-time."
    },
    {
      slideNumber: 3,
      title: "Exploratory Data Analysis & Macro Insights",
      subtitle: "Category Velocity & Seasonality Dynamics",
      bullets: [
        "Category Contribution: Staples & Groceries drives 30.4% of gross revenue, followed by Snacks (21.7%) and Beverages (18.8%).",
        "Seasonality Patterns: Beverages surge +35% during Q2 summer months; Gifting snacks spike +85% during Diwali festive weeks.",
        "Promotional Elasticity: Historical promotional campaigns yield an average volume uplift of +30.0%.",
        "Velocity Disparity: Fast movers demand over 28,000 units annually, while slow movers experience intermittent, volatile demand."
      ],
      speakerNotes: "Demonstrate that the EDA was critical in shaping model features like sinusoidal calendar harmonics and promotional flags."
    },
    {
      slideNumber: 4,
      title: "Leakage-Free Feature Engineering",
      subtitle: "Point-in-Time Temporal Discipline",
      bullets: [
        "Autoregressive Lags: L1, L2, L4, L8, and annual L52 computed strictly using observations preceding prediction week t.",
        "Rolling Statistics: 4-week and 8-week moving averages and standard deviations quantify short-term momentum.",
        "Cyclic Calendar Encoding: Sine and cosine harmonics model annual seasonal peaks smoothly without hardcoded calendar thresholds.",
        "Zero Look-Ahead Bias: Guaranteed point-in-time isolation prevents synthetic over-fitting."
      ],
      speakerNotes: "Emphasize how temporal discipline prevents artificial model over-optimism."
    },
    {
      slideNumber: 5,
      title: "Forecasting Approach & Baseline Selection",
      subtitle: "Seasonal-Naive vs. Feature-Weighted Machine Learning",
      bullets: [
        "The Benchmark: 52-Week Seasonal-Naive algorithm projecting identical calendar week demand from the prior year (y_{t-52}).",
        "Why Seasonal-Naive: Establishes a rigorous, domain-appropriate retail benchmark that accounts for annual seasonality.",
        "DEMANDWISE ML Forecaster: Regularized multi-step feature-weighted regression combining historical lags, recent trend, calendar harmonics, and promotional uplifts.",
        "Operational Value: Sub-second inference latency, full parameter interpretability, and robust generalization."
      ],
      speakerNotes: "Explain why simple moving averages are insufficient benchmarks for seasonal retail."
    },
    {
      slideNumber: 6,
      title: "Model Validation & WAPE Accuracy",
      subtitle: "4-Fold Rolling-Origin Cross-Validation Results",
      bullets: [
        "Validation Strategy: 4-Fold Rolling-Origin CV (Cutoffs: Weeks 80, 86, 92, 98) with multi-step 6-week horizon testing.",
        "Seasonal-Naive Baseline: 25.64% WAPE | Bias: -9.03%",
        "DEMANDWISE ML Forecaster: 21.05% WAPE | Bias: -3.01%",
        "Net Performance Gain: +4.59 percentage point WAPE improvement (17.9% relative error reduction).",
        "Elimination of Negative Bias: Protects supply chains from chronic under-ordering before peak festival weeks."
      ],
      speakerNotes: "Highlight the 17.9% relative error reduction and the near-zero bias metric."
    },
    {
      slideNumber: 7,
      title: "4-Quadrant Inventory Risk Framework",
      subtitle: "Translating Forecasts into Deterministic Supply Chain Actions",
      bullets: [
        "REORDER NOW (12 SKUs): Total available inventory < Lead Time Demand + Safety Stock. Immediate PO recommended.",
        "MARKDOWN / CLEAR (4 SKUs): Weeks of supply > 10 weeks. Capital immobilized; clearance pricing recommended.",
        "WATCH / VOLATILE (5 SKUs): High demand variability (CV > 0.35) or borderline safety cover. Daily POS monitoring required.",
        "HEALTHY (9 SKUs): Balanced coverage (4 to 8 weeks) comfortably securing lead time demand."
      ],
      speakerNotes: "Explain how this framework bridges the gap between data science and warehouse procurement teams."
    },
    {
      slideNumber: 8,
      title: "Financial Business Impact in Indian Rupees (₹ INR)",
      subtitle: "Quantifying Working Capital and Revenue Protection",
      bullets: [
        "Stockout Exposure Avoided: ₹12,27,214.22 in gross lost sales protected by expediting 12 urgent reorders.",
        "Excess Inventory Capital Locked: ₹4,35,243.00 trapped in overstocked SKUs requiring proactive liquidation.",
        "Markdown Exposure: ₹1,30,572.90 in projected margin haircut if excess stock is liquidated at 30% discount.",
        "Total Working Capital at Risk: ₹16,62,457.22 actively managed and optimized via DEMANDWISE."
      ],
      speakerNotes: "Walk executives through the Rupee figures. Note that the system ROI is demonstrated on day 1."
    },
    {
      slideNumber: 9,
      title: "Recommended Implementation Roadmap",
      subtitle: "Immediate, Short-Term, and Medium-Term Actions",
      bullets: [
        "Days 1–3 (Immediate): Issue emergency Purchase Orders for 12 'REORDER NOW' SKUs, adjusted to supplier MOQ.",
        "Weeks 1–2 (Short-Term): Implement 20–30% promotional clearance discounts for the 4 overstocked lines to unlock ₹4.35 Lakhs.",
        "Month 1 (Medium-Term): Integrate the DEMANDWISE REST Scoring API (POST /api/score) into existing enterprise ERP/WMS.",
        "Ongoing: Establish weekly automated retraining cadence and rolling-origin accuracy tracking."
      ],
      speakerNotes: "Provide a concrete 30-day playbook that operations teams can immediately execute."
    },
    {
      slideNumber: 10,
      title: "Assumptions, Limitations & Next Horizons",
      subtitle: "Architectural Scalability & Future Research",
      bullets: [
        "Operational Assumptions: Supplier lead times and unit purchasing costs are currently modeled as deterministic.",
        "Identified Limitations: Does not yet capture store-to-store cross-docking or brand substitution elasticities.",
        "Next Horizons: Multi-echelon regional DC-to-store distribution network optimization.",
        "Conclusion: DEMANDWISE delivers an auditable, highly accurate, and production-ready supply chain decision system."
      ],
      speakerNotes: "Close by presenting future research directions and opening the floor for executive Q&A."
    }
  ];

  // 20 Viva Q&A items
  const vivaItems = [
    {
      q: "What is the primary business problem DEMANDWISE solves?",
      a: "It resolves the costly mismatch between retail customer demand and inventory positions. By forecasting weekly demand 8 weeks in advance and categorizing SKUs into 4 deterministic action buckets, it prevents stockouts on fast-movers and releases trapped working capital from overstocked lines."
    },
    {
      q: "How do you ensure zero data leakage in feature engineering?",
      a: "All features (lags 1 through 52, 4-week and 8-week rolling averages, and demand momentum) are engineered strictly using historical records preceding the prediction week t (e.g. t-1, t-2). Features never access demand from week t or beyond."
    },
    {
      q: "What is the difference between Seasonal-Naive and Naive forecasting?",
      a: "A Naive forecast assumes demand next week equals last week (y_t = y_{t-1}). A Seasonal-Naive forecast assumes demand next week equals the demand observed during the identical calendar week in the previous year (y_t = y_{t-52}), capturing annual seasonality like Diwali and summer surges."
    },
    {
      q: "Why is WAPE preferred over MAPE in retail demand forecasting?",
      a: "MAPE divides error by actual demand for each individual observation, causing division by zero or extreme distortion on low-volume or zero-sales weeks. WAPE divides the sum of absolute errors by the total actual demand, making it volume-neutral, mathematically robust, and the retail industry standard."
    },
    {
      q: "Why use Rolling-Origin Cross-Validation instead of standard K-Fold CV?",
      a: "Standard K-Fold shuffles rows randomly, which breaks temporal autocorrelation and leaks future data into past training folds. Rolling-origin cross-validation mimics production by training strictly on data up to origin T and testing forward into unseen future weeks."
    },
    {
      q: "What was the quantitative outcome of the model evaluation?",
      a: "Across 4 rolling-origin folds (720 test evaluations), the Seasonal-Naive baseline achieved 25.64% WAPE with -9.03% bias. The DEMANDWISE ML Forecaster achieved 21.05% WAPE with -3.01% bias, delivering a +4.59 percentage point improvement (17.9% relative error reduction)."
    },
    {
      q: "What mathematical condition triggers the 'REORDER NOW' status?",
      a: "An SKU triggers REORDER NOW if total available inventory (On-Hand + On-Order) is less than Lead Time Demand plus Safety Stock, or if Weeks of Supply is less than supplier lead time."
    },
    {
      q: "How is the recommended reorder quantity calculated?",
      a: "It computes the deficit between the target inventory buffer and total available inventory, and rounds it up to the next integer multiple of the supplier's Minimum Order Quantity (MOQ)."
    },
    {
      q: "What mathematical condition triggers 'MARKDOWN / CLEAR'?",
      a: "When an SKU has more than 10 weeks of forward supply (WOS > 10.0), indicating capital lockup and risk of spoilage or obsolescence."
    },
    {
      q: "How is Potential Lost Sales calculated in Indian Rupees (₹)?",
      a: "Potential Lost Sales (₹) = Deficit Units × Unit Selling Price (₹)."
    },
    {
      q: "How is Excess Inventory Capital calculated in Indian Rupees (₹)?",
      a: "Excess Capital Locked (₹) = (On-Hand Units - (6 × Forward Average Weekly Demand)) × Unit Cost Price (₹)."
    },
    {
      q: "What does the 'WATCH / VOLATILE' status mean for operations?",
      a: "It flags SKUs with high demand volatility (Coefficient of Variation CV > 0.35) or borderline safety stock cover. Planners audit daily POS sales before placing bulk orders."
    },
    {
      q: "How is safety stock calculated in the project?",
      a: "Safety Stock is calculated as Z × σ_LT = 1.65 × σ_w × sqrt(LeadTimeWeeks), where Z=1.65 provides a 95% service level factor."
    },
    {
      q: "How was promotional elasticity integrated into the forward forecast?",
      a: "Historical EDA demonstrated an average promotional lift of +30.0%. When a promotional marketing campaign is flagged in the forward horizon, a trained multiplier adjusts the baseline forecast upward."
    },
    {
      q: "Why was bias evaluated in addition to WAPE?",
      a: "WAPE measures the average magnitude of error without direction. Bias indicates if the model is systematically over-predicting (overstocking risk) or under-predicting (stockout risk). DEMANDWISE maintains a minimal bias of -3.01%."
    },
    {
      q: "How does the Deployed Scoring Service (D6) handle edge cases?",
      a: "Negative stock inputs are clamped safely to 0, missing SKU IDs return HTTP 400 Bad Request, lead times are bounded to minimum 1 week, and zero or negative prices are guarded against division errors."
    },
    {
      q: "What happens if a supplier's lead time unexpectedly increases?",
      a: "Lead Time Demand is dynamically calculated as the sum of forward forecasts across lead time weeks. Increasing lead time expands the required safety buffer and recalculates the reorder point immediately in the simulator."
    },
    {
      q: "Why not use an end-to-end Deep Learning model like LSTM or Transformer?",
      a: "For 30 SKUs with 104 weekly observations (3,120 rows), deep neural networks tend to overfit tabular data, operate as black boxes, and require substantial compute. Regularized autoregressive ML offers superior generalization, sub-second latency, and full transparency."
    },
    {
      q: "How do you determine fast movers vs slow movers?",
      a: "We rank SKUs by annual demand volume and turnover velocity. The top 5 fast movers generate over 112,000 units, while slow movers have low velocity and higher CV."
    },
    {
      q: "What are the immediate next steps to productionize DEMANDWISE?",
      a: "Hook the REST API directly into ERP purchasing webhooks, incorporate supplier transit variability distributions, and add store-level hierarchical reconciliation."
    }
  ];

  return (
    <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
      {/* Top Report Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dee2e6]">
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
            <span>Project Reports & Deliverables (D2, D7, Viva)</span>
          </h2>
          <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
            Access executive presentations, data quality reports, and technical defense materials.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#f8f9fa] p-1 rounded border border-[#dee2e6]">
          <button
            onClick={() => setActiveReport("executive")}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-bold transition ${
              activeReport === "executive"
                ? "bg-white text-[#1e3a8a] border border-[#dee2e6] shadow-xs"
                : "text-[#6c757d] hover:text-[#1a1a1a]"
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>Executive Deck (D7)</span>
          </button>

          <button
            onClick={() => setActiveReport("viva")}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-bold transition ${
              activeReport === "viva"
                ? "bg-white text-[#1e3a8a] border border-[#dee2e6] shadow-xs"
                : "text-[#6c757d] hover:text-[#1a1a1a]"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Viva Prep (20 Q&A)</span>
          </button>

          <button
            onClick={() => setActiveReport("eda")}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-bold transition ${
              activeReport === "eda"
                ? "bg-white text-[#1e3a8a] border border-[#dee2e6] shadow-xs"
                : "text-[#6c757d] hover:text-[#1a1a1a]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>EDA Report (D2)</span>
          </button>

          <button
            onClick={() => setActiveReport("readme")}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-bold transition ${
              activeReport === "readme"
                ? "bg-white text-[#1e3a8a] border border-[#dee2e6] shadow-xs"
                : "text-[#6c757d] hover:text-[#1a1a1a]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#6c757d]" />
            <span>Project README</span>
          </button>
        </div>
      </div>

      {/* REPORT CONTENT: EXECUTIVE SLIDE DECK (D7) */}
      {activeReport === "executive" && (
        <div className="mt-5">
          {/* Slide Deck Controller */}
          <div className="flex items-center justify-between bg-[#1a1a1a] text-white p-3.5 rounded-t-lg">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold bg-[#212529] text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded">
                SLIDE {currentSlide} OF {slides.length}
              </span>
              <span className="text-xs font-black uppercase tracking-tight">DEMANDWISE Executive Presentation (D7)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
                disabled={currentSlide === 1}
                className="p-1 rounded bg-[#2b3035] hover:bg-[#343a40] disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => Math.min(slides.length, prev + 1))}
                disabled={currentSlide === slides.length}
                className="p-1 rounded bg-[#2b3035] hover:bg-[#343a40] disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Slide Canvas */}
          <div className="bg-[#f8f9fa] border-x border-b border-[#dee2e6] p-6 rounded-b-lg min-h-[360px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1e3a8a]">
                {slides[currentSlide - 1].subtitle}
              </span>
              <h3 className="text-xl font-black text-[#1a1a1a] mt-1 mb-5">
                {slides[currentSlide - 1].title}
              </h3>

              <div className="space-y-3">
                {slides[currentSlide - 1].bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#495057] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] mt-1.5 shrink-0"></span>
                    <span className="leading-relaxed">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Speaker Notes Box */}
            <div className="mt-6 pt-3 border-t border-[#dee2e6] bg-white p-3 rounded border text-xs text-[#495057]">
              <strong className="text-[#1a1a1a] block mb-0.5">Executive Presentation Note:</strong>
              {slides[currentSlide - 1].speakerNotes}
            </div>
          </div>

          {/* Quick Slide Navigation Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {slides.map((s) => (
              <button
                key={s.slideNumber}
                onClick={() => setCurrentSlide(s.slideNumber)}
                className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  currentSlide === s.slideNumber
                    ? "bg-[#1e3a8a] text-white shadow-xs"
                    : "bg-white border border-[#dee2e6] hover:bg-[#f8f9fa] text-[#495057]"
                }`}
              >
                {s.slideNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REPORT CONTENT: VIVA TECHNICAL PREPARATION (20 Q&A) */}
      {activeReport === "viva" && (
        <div className="mt-5 space-y-3">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-900 font-medium">
            <strong>Viva & Technical Defense Ready:</strong> 20 rigorous technical questions and answers covering data pipeline leakage prevention, WAPE vs MAPE, rolling-origin cross-validation, inventory risk formulas, and rupee business impact.
          </div>

          <div className="space-y-2">
            {vivaItems.map((item, idx) => (
              <div key={idx} className="bg-[#f8f9fa] border border-[#dee2e6] rounded p-3 transition hover:border-[#ced4da]">
                <h4 className="text-xs font-bold text-[#1a1a1a] flex items-baseline gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#1e3a8a] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                    Q{idx + 1}
                  </span>
                  <span>{item.q}</span>
                </h4>
                <p className="text-xs text-[#495057] mt-1.5 pl-7 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT CONTENT: EDA & DATA QUALITY REPORT (D2) */}
      {activeReport === "eda" && (
        <div className="mt-5 space-y-4 text-xs text-[#495057]">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-[#1e3a8a]">
            <h3 className="font-black text-xs uppercase mb-0.5">D2 Exploratory Data Analysis & Data Quality Summary</h3>
            <p className="text-xs font-medium">Full verification of 104 historical weeks, 3,120 records, 30 active SKUs, and zero synthetic leakage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#dee2e6] rounded p-4">
              <h4 className="font-bold text-[#1a1a1a] text-xs uppercase mb-2">Category Contribution</h4>
              <ul className="space-y-2">
                <li className="flex justify-between border-b border-[#dee2e6] pb-1">
                  <span>Staples & Groceries</span>
                  <span className="font-mono font-bold text-[#1e3a8a]">₹3.71 Cr (30.4%)</span>
                </li>
                <li className="flex justify-between border-b border-[#dee2e6] pb-1">
                  <span>Snacks & Packaged Foods</span>
                  <span className="font-mono font-bold text-[#1e3a8a]">₹2.64 Cr (21.7%)</span>
                </li>
                <li className="flex justify-between border-b border-[#dee2e6] pb-1">
                  <span>Beverages & Dairy</span>
                  <span className="font-mono font-bold text-[#1e3a8a]">₹2.29 Cr (18.8%)</span>
                </li>
                <li className="flex justify-between border-b border-[#dee2e6] pb-1">
                  <span>Personal Care</span>
                  <span className="font-mono font-bold text-[#1e3a8a]">₹1.98 Cr (16.3%)</span>
                </li>
                <li className="flex justify-between">
                  <span>Household Essentials</span>
                  <span className="font-mono font-bold text-[#1e3a8a]">₹1.57 Cr (12.9%)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-[#dee2e6] rounded p-4">
              <h4 className="font-bold text-[#1a1a1a] text-xs uppercase mb-2">Quality Decisions & Findings</h4>
              <ul className="space-y-2 list-disc pl-4 text-[#495057]">
                <li><strong>Deduplication:</strong> 0 duplicate (sku_id, week_num) records detected across 3,120 rows.</li>
                <li><strong>Referential Integrity:</strong> 100% SKU match between catalog and transactions.</li>
                <li><strong>Promotional Lift:</strong> Marketing campaigns generate an average +30.0% volume surge.</li>
                <li><strong>Seasonality:</strong> Non-linear Q2 summer beverages (+35%) and Q4 Diwali gifting spikes (+85%).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: README */}
      {activeReport === "readme" && (
        <div className="mt-5 p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded text-xs text-[#495057] space-y-2 font-mono">
          <h3 className="font-bold text-[#1a1a1a] text-xs uppercase">DEMANDWISE – System Quick Reference</h3>
          <p>
            An enterprise-grade, leakage-free retail demand forecasting and inventory analytics system.
          </p>
          <div className="bg-[#1a1a1a] text-emerald-300 p-3 rounded border border-[#343a40] overflow-x-auto text-[11px]">
            <code>
              python3 src/pipeline.py      # D1 Data Pipeline & Feature Engineering<br />
              python3 src/eda.py           # D2 EDA & Data Quality<br />
              python3 src/forecast.py      # D3 Demand Forecasting Engine<br />
              python3 src/evaluation.py    # Rolling-Origin CV & WAPE<br />
              python3 src/risk.py          # D4 Inventory Risk Scoring (₹ INR)<br />
              python3 tests/test_all.py    # Automated Test Suite (100% Pass)<br />
              streamlit run app/app.py     # D5 Standalone Streamlit Dashboard<br />
              npm start                    # Deployed Full-Stack Service (Port 3000)
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
