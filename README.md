# DEMANDWISE – Retail Demand & Inventory Analytics

> **Official Project Implementation – Zidio Development Engagement Brief**  
> **Brand Identity:** DEMANDWISE  
> **Domain:** Retail Demand Forecasting, Time-Series Machine Learning & Inventory Capital Optimization  

---

## 1. Executive Summary & Business Problem
Retail enterprises face an acute dual-edge dilemma:
1. **Stockout Risk (Under-forecasting):** Running out of high-velocity inventory causes direct lost revenue, lost customer goodwill, and competitor brand switching.
2. **Overstock Risk (Over-forecasting):** Storing excess stock immobilizes working capital, incurs holding costs (~22% p.a.), and forces distressed markdowns.

Traditional ERPs rely on static 30-day trailing moving averages that fail during holiday surges (Diwali, Dussehra, Summer) and promotional campaigns. **DEMANDWISE** resolves this through an end-to-end analytics platform delivering 8-week forward SKU-level forecasts, rigorous rolling-origin cross-validation, an interpretable 4-quadrant inventory risk engine, and concrete financial impact in Indian Rupees (₹ INR).

---

## 2. Project Architecture & Directory Structure

```
DEMANDWISE/
├── data/
│   ├── raw/
│   │   ├── product_catalog.csv          # 30 Active SKUs, category hierarchy, unit cost/price, lead times, MOQ
│   │   ├── sales_transactions.csv       # 3,120 records (104 historical weeks, 2024-2025)
│   │   ├── inventory_status.csv         # Current on-hand, on-order, safety stocks, reorder points
│   │   └── calendar_events.csv          # Indian holiday & festival multipliers (Diwali, Holi, Republic Day)
│   └── processed/
│       ├── weekly_sku_demand.csv        # Aggregated weekly demand series
│       ├── weekly_sku_demand_features.csv # Leakage-free lag & rolling feature store
│       ├── forecast_output_6_8_weeks.csv# Forward 8-week predictions (Naive vs ML Forecaster)
│       ├── model_evaluation_results.json# 4-Fold rolling-origin CV metrics (WAPE, Bias, MAE)
│       ├── inventory_risk_scored.csv    # SKU-level 4-quadrant classifications & actions
│       ├── inventory_summary.json       # Portfolio-level Rupee risk rollups
│       └── eda_summary.json             # Statistical EDA & business insights
├── src/
│   ├── pipeline.py                      # D1: Schema validation & point-in-time feature engineering
│   ├── eda.py                           # D2: Data health audit, SKU velocity, & business insights
│   ├── forecast.py                      # D3: Seasonal-Naive baseline & feature-weighted ML model
│   ├── evaluation.py                    # Backtesting: 4-Fold rolling-origin cross-validation & WAPE
│   └── risk.py                          # D4: Inventory decision grid & Rupee financial quantification
├── app/
│   └── app.py                           # D5: Standalone Streamlit planning dashboard
├── service/
│   ├── scoring_service.py               # D6: Real-time scoring logic (single SKU & batch)
│   ├── api_schema.py                    # Pydantic / input validation dataclass schemas
│   └── README.md                        # Microservice API specifications & examples
├── reports/
│   ├── eda_data_quality_report.md       # D2: Comprehensive data audit & category analysis
│   ├── executive_readout.md             # D7: 10-Slide executive presentation & strategic roadmap
│   └── viva_demo_prep.md                # Viva defense guide with 20 technical interview Q&A
├── tests/
│   └── test_all.py                      # Automated test suite (Pipeline, Forecast, Risk, Service)
├── server.ts                            # Full-Stack Express API server + Vite middleware
├── src/App.tsx                          # React 19 Interactive Enterprise Planning Web Platform
├── Dockerfile                           # Containerized production deployment
├── Procfile                             # Cloud deployment process manager
├── render.yaml                          # Render infrastructure as code
├── vercel.json                          # Vercel deployment configuration
└── requirements.txt                     # Python dependencies
```

---

## 3. Zidio Deliverable Compliance (D1 – D7 Acceptance Verification)

| Deliverable | Scope | Status | Acceptance Verification Evidence |
| :--- | :--- | :---: | :--- |
| **D1** | Data Pipeline | **PASSED (✓)** | Ingests 4 raw datasets, validates referential integrity across 30 SKUs, cleans duplicates, engineers point-in-time features with zero look-ahead leakage. |
| **D2** | Data Quality & EDA | **PASSED (✓)** | 104-week trend decomposition, SKU velocity distribution (fast vs slow movers), demand CV volatility, promotional lift (+30.0%), and 3 quantified business insights. |
| **D3** | Demand Forecasting | **PASSED (✓)** | 8-week horizon forecasting, Seasonal-Naive ($y_{t-52}$) benchmark, 4-fold rolling-origin CV (W80-W98), WAPE of 21.05% vs 25.64% baseline (+4.59 pp gain). |
| **D4** | Inventory Risk Scoring | **PASSED (✓)** | Reconciled 4-quadrant decisioning: Reorder Now, Markdown/Clear, Watch/Volatile, Healthy. Exact Rupee impact on lost sales, excess capital, and markdowns. |
| **D5** | Planning Dashboard | **PASSED (✓)** | Usable Streamlit planning dashboard (`app/app.py`) + responsive React 19 web app with live filtering, forecast curves, and interactive scenario simulator. |
| **D6** | Deployed Scoring Service | **PASSED (✓)** | REST API endpoints (`POST /api/score`, `POST /api/batch-score`) with input validation, edge-case safety, and schema documentation. |
| **D7** | Executive Readout | **PASSED (✓)** | 10-slide executive presentation (`reports/executive_readout.md`), data quality report, and 20 in-depth Viva prep questions with answers. |

---

## 4. Key Metrics & Analytical Results

### Model Accuracy vs. Baseline (Rolling-Origin Cross-Validation)
- **Validation Protocol:** 4-Fold Rolling-Origin CV across historical origins (Week 80, 86, 92, 98) with multi-step forward testing.
- **Seasonal-Naive Baseline WAPE:** **25.64%** (Bias: -9.03%)
- **DEMANDWISE ML Forecaster WAPE:** **21.05%** (Bias: -3.01%)
- **Net Improvement:** **+4.59 percentage points** (17.9% relative reduction in forecast error).

### Portfolio Risk & Rupee Business Impact
- **Total Catalog:** 30 Active SKUs across 5 Core FMCG Categories.
- **REORDER NOW (12 SKUs):** ₹12,27,214.22 in Potential Lost Sales if unaddressed.
- **MARKDOWN / CLEAR (4 SKUs):** ₹4,35,243.00 trapped in excess inventory; ₹1,30,572.90 in markdown haircut exposure.
- **WATCH / VOLATILE (5 SKUs):** High volatility ($CV > 0.35$) requiring active monitoring.
- **HEALTHY (9 SKUs):** 4 to 8 weeks of optimal forward coverage.

---

## 5. Quick Start & Execution Guide

### Running with Python:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run data pipeline & feature engineering (D1)
python3 src/pipeline.py

# 3. Run exploratory data analysis (D2)
python3 src/eda.py

# 4. Generate 8-week forward demand forecasts (D3)
python3 src/forecast.py

# 5. Run rolling-origin cross-validation & WAPE evaluation
python3 src/evaluation.py

# 6. Execute inventory risk engine & Rupee impact (D4)
python3 src/risk.py

# 7. Run automated test suite
python3 tests/test_all.py

# 8. Launch Streamlit planning dashboard (D5)
streamlit run app/app.py
```

### Running the Deployed Full-Stack Web Platform (Port 3000):
```bash
npm install
npm run dev
# Open http://localhost:3000
```
