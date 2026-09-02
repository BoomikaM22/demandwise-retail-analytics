# DEMANDWISE – Exploratory Data Analysis & Data Quality Report (D2)

## 1. Executive Summary & Data Provenance
- **Dataset Scope:** 104 historical weeks (January 2024 to December 2025), comprising 3,120 weekly records across 30 active SKUs.
- **Product Hierarchy:** 5 Core Retail Categories:
  1. Staples & Groceries (6 SKUs)
  2. Beverages & Dairy (6 SKUs)
  3. Snacks & Packaged Foods (6 SKUs)
  4. Personal Care (6 SKUs)
  5. Household Essentials (6 SKUs)
- **Monetary Aggregates:** Total Gross Realized Revenue of **₹12,19,77,844.55** (~₹12.20 Crore) across **466,026** physical units demanded.

---

## 2. Data Cleaning Decisions & Quality Audit
1. **Deduplication:** A composite key `(sku_id, week_num)` was verified across all 3,120 transaction rows. Exactly 0 duplicates were found following the deterministic pipeline ingestion.
2. **Referential Integrity:** 100% of SKUs in sales transactions matched active records in `product_catalog.csv` and `inventory_status.csv`.
3. **Missing Values:** Zero null or unmapped values occurred in primary demand and pricing fields.
4. **Data Leakage Elimination:** Autoregressive lags ($t-1, t-2, t-4, t-8, t-52$) and rolling window statistics were computed strictly on historical timestamps preceding week $t$.

---

## 3. Category Performance Analysis

| Category | Total Revenue (₹ INR) | Revenue Share | Units Sold | Avg Units / SKU | Velocity Tier |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Staples & Groceries** | ₹3,71,20,450 | 30.43% | 125,480 | 20,913 | High Velocity / Core Base |
| **Snacks & Packaged Foods** | ₹2,64,30,820 | 21.67% | 98,410 | 16,401 | High Margin / Volatile |
| **Beverages & Dairy** | ₹2,28,95,310 | 18.77% | 85,290 | 14,215 | Seasonal Summer Driver |
| **Personal Care** | ₹1,98,45,600 | 16.27% | 72,110 | 12,018 | High Margin / Steady |
| **Household Essentials** | ₹1,56,85,664 | 12.86% | 84,736 | 14,122 | Stable Consumables |

---

## 4. SKU Velocity: Fast Movers vs. Slow Movers & Dead Stock

### Top 5 Fast Movers (Volume Drivers)
1. **SKU-GRO-002: Sharbati Whole Wheat Atta 10kg** (28,450 units, ₹1.23 Cr) – Essential kitchen staple with consistent baseline velocity.
2. **SKU-GRO-005: Refined Sulphur-Free Sugar 5kg** (22,940 units, ₹57.1 Lakhs) – High throughput bulk grocery staple.
3. **SKU-SNK-003: Multigrain Roasted Nachos 200g** (21,800 units, ₹21.5 Lakhs) – High consumer snack engagement.
4. **SKU-HOU-005: Lemon Blossom Grease-Cutting Dishwash Gel 750ml** (20,410 units, ₹31.6 Lakhs) – High replenishment repeat rate.
5. **SKU-GRO-001: Royal Basmati Rice 5kg** (19,250 units, ₹1.15 Cr) – Premium grain revenue anchor.

### Bottom 5 Slow Movers
1. **SKU-PER-005: Cedarwood & Argan Nourishing Beard Oil 30ml** (4,890 units) – Niche groomer with 0.42 CV volatility.
2. **SKU-SNK-004: Handcrafted Kaju Katli Gift Box 500g** (5,780 units) – Highly clustered holiday gift item.
3. **SKU-SNK-006: Gourmet Salted Pistachios 250g** (7,210 units) – Price-sensitive luxury snack.
4. **SKU-BEV-002: Artisanal Cold Brew Coffee 250ml** (7,840 units) – Urban premium demographic.
5. **SKU-BEV-005: Roasted Almond Badam Milk Mix 500g** (8,420 units) – Winter seasonal preference.

---

## 5. Three Core Business Insights

### Insight 1: Severe Working Capital Lockup in Overstocked SKUs
- **Quantification:** 4 SKUs carry forward inventory exceeding 10 to 16 weeks of supply, immobilizing **₹4.35 Lakhs** in direct capital.
- **Root Cause:** Inflexible legacy procurement schedules ordered uniform batch sizes regardless of seasonal demand dips.
- **Prescription:** Trigger immediate 20–30% clearance discount promotions to release capital back into high-turnover staples.

### Insight 2: High Stockout Exposure Threatens High-Velocity Revenue Anchors
- **Quantification:** 12 SKUs exhibit Weeks of Supply below supplier lead times, creating an estimated **₹12.27 Lakhs** in immediate lost sales risk.
- **Root Cause:** High demand momentum during recent cycles outstripped standard reorder thresholds.
- **Prescription:** Issue emergency purchase orders today totaling MOQ-adjusted target replenishment units with prioritized supplier logistics.

### Insight 3: Non-Linear Holiday & Festival Surges Invalidate Static Min-Max Rules
- **Quantification:** Diwali and Summer promotional weeks generate **+45% to +85%** volume spikes compared to trailing 4-week moving averages.
- **Root Cause:** Traditional ERP systems reliance on trailing 30-day moving averages lags actual peak demand by 3 weeks.
- **Prescription:** Transition replenishment triggers to the forward 8-week ML forecast curve which incorporates calendar and promotional multipliers.
