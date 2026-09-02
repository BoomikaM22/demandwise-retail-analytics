# DEMANDWISE – Executive Readout (D7)
## Strategic Retail Demand Forecasting & Inventory Optimization
*Prepared for Executive Leadership & Supply Chain Committee*

---

### Slide 1: Business Problem & Context
- **The Core Dilemma:** Retail profitability is eroded at both extremes: stockouts cause immediate lost sales and customer churn, while overstocking traps critical cash flow in holding costs and spoilage.
- **The Challenge:** Trailing 30-day moving averages fail to anticipate seasonal festival spikes (Diwali, Summer surges) and promotional lifts, leading to reactionary procurement.
- **The Solution:** DEMANDWISE – an end-to-end intelligent retail demand forecasting and inventory risk analytics engine providing 8-week forward visibility and deterministic procurement actions.

---

### Slide 2: Data Foundations & Scale
- **Historical Scope:** 104 Weeks (2 Full Operating Years: Jan 2024 to Dec 2025).
- **Portfolio:** 30 Active SKUs across 5 Core FMCG Categories (Staples, Beverages, Snacks, Personal Care, Household).
- **Volume & Value:** 466,026 Units Demanded generating ₹12.19 Crore in historical gross sales.
- **Data Integrity:** Fully audited, zero missing values, zero synthetic leakage, referentially verified against inventory status and product master catalogs.

---

### Slide 3: Exploratory Data Analysis & Macro Trends
- **Category Powerhouses:** Staples & Groceries generates 30.4% of total revenue, followed by Snacks (21.7%) and Beverages (18.8%).
- **Seasonality Signals:** Non-linear demand cycles—Summer beverages rise +35% during Q2; Confectionery and gift packs spike +85% during Q4 Diwali festive weeks.
- **Promotional Elasticity:** Active promotional campaigns deliver an average volume lift of **+30.0%**.

---

### Slide 4: Forecasting Approach & Leakage Prevention
- **Granularity:** Weekly SKU-level forecasting over an 8-week planning horizon.
- **Point-in-Time Discipline:** Strict prevention of look-ahead data leakage. All feature representations (Lag 1 to Lag 52, 4w/8w rolling means, momentum) use data timestamped prior to prediction week $T$.
- **Seasonal Harmonics:** Trigonometric sine/cosine features capture annual cyclicality without overfitting arbitrary calendar dates.

---

### Slide 5: Model Selection vs. Seasonal-Naive Baseline
- **The Baseline:** Seasonal-Naive algorithm projecting prior-year corresponding week demand ($y_{t-52}$) adjusted by recent trend momentum.
- **The ML Forecaster:** Feature-weighted multi-step regression forecaster regularizing autoregressive lags, rolling statistics, calendar seasonality, and promotional signals.
- **Why Selected:** Balances high interpretability, instant sub-second scoring latency, and superior robustness against demand shocks.

---

### Slide 6: Model Validation & WAPE Accuracy
- **Validation Protocol:** 4-Fold Rolling-Origin Time-Series Cross-Validation (Cutoffs: Weeks 80, 86, 92, 98).
- **Primary Metric:** WAPE (Weighted Absolute Percentage Error) & Mean Percentage Bias.
- **Backtest Results:**
  - **Seasonal-Naive Baseline:** **25.64% WAPE** | Bias: -9.03%
  - **DEMANDWISE ML Model:** **21.05% WAPE** | Bias: -3.01%
  - **Outcome:** **+4.59 percentage point WAPE improvement** (17.9% relative error reduction) with near-zero systematic bias.

---

### Slide 7: 4-Quadrant Inventory Risk Framework
Every SKU is evaluated across 8-week forward demand against on-hand, on-order, lead time, and safety stocks:
1. **REORDER NOW (12 SKUs):** Immediate stockout threat; available stock covers less than lead time demand.
2. **MARKDOWN / CLEAR (4 SKUs):** Severe capital lockup; stock exceeds 10 weeks of forward demand.
3. **WATCH / VOLATILE (5 SKUs):** Elevated demand volatility ($CV > 0.35$) or tight buffer ($WOS \le LT + 1.5$).
4. **HEALTHY (9 SKUs):** Perfectly balanced buffer (4 to 8 weeks of supply).

---

### Slide 8: Rupee (₹ INR) Financial Business Impact
- **Potential Lost Sales Avoided:** **₹12,27,214.22** across 12 stockout-prone SKUs if replenishments are triggered now.
- **Excess Capital Trapped:** **₹4,35,243.00** immobilized in overstocked lines (e.g. Sugar 5kg, Alphonso Pulp, Nachos).
- **Terminal Markdown Exposure:** **₹1,30,572.90** in gross margin loss if slow movers are not liquidated systematically.
- **Total Working Capital at Risk:** **₹16,62,457.22** addressable directly through DEMANDWISE recommendations.

---

### Slide 9: Recommended Operational Action Plan
1. **Immediate (Days 1–3):** Issue expedited Purchase Orders for the 12 "REORDER NOW" items totaling MOQ-adjusted target replenishment units.
2. **Short-Term (Weeks 1–2):** Deploy targeted 20–30% promotional discount bundles on the 4 overstocked SKUs to accelerate cash conversion.
3. **Medium-Term (Month 1):** Shift ERP replenishment parameters from static 30-day trailing averages to DEMANDWISE 8-week forward forecast schedules.
4. **Automation:** Integrate ERP procurement webhooks with the DEMANDWISE REST Scoring API (`/api/score`).

---

### Slide 10: Limitations & Next Steps
- **Data Limitations:** Supplier lead time variability (late deliveries) was modeled as deterministic; real-world PO transit times vary by $\pm 4$ days.
- **Future Enhancements:**
  - Incorporate external macroeconomic indicators (Inflation, fuel surcharges).
  - Implement SKU substitution elasticity when top brands stock out.
  - Multi-echelon regional distribution center (DC to Store) network modeling.
