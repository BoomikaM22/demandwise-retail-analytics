# DEMANDWISE – Viva & Technical Defense Preparation Guide

## 1. Project Overview in Simple Language
DEMANDWISE is an enterprise-grade retail demand forecasting and inventory analytics system. It ingests historical sales, promotions, calendar holidays, and inventory positions across 30 retail SKUs. It then predicts future weekly customer demand for the next 8 weeks and automatically translates those predictions into 4 clear operational purchasing actions: **REORDER NOW**, **MARKDOWN / CLEAR**, **WATCH / VOLATILE**, and **HEALTHY**, quantifying exact financial risks in Indian Rupees (₹ INR).

---

## 2. Architecture & Pipeline Explanation
The architecture follows clean separation of concerns across 7 core modules (D1 to D7):
- **D1 Pipeline (`src/pipeline.py`):** Ingestion, schema validation, zero-leakage feature engineering (Lags 1..52, rolling statistics, calendar harmonics).
- **D2 EDA Engine (`src/eda.py`):** Historical trend decomposition, SKU velocity categorization, demand volatility (CV), and promotional lift analysis.
- **D3 Demand Forecasting (`src/forecast.py`):** Multi-step forecasting engine implementing both Seasonal-Naive baseline and ML feature-weighted regularized regression over an 8-week horizon.
- **D4 Inventory Risk Engine (`src/risk.py`):** Computes Weeks of Supply, Lead Time Demand, Safety Stocks, MOQ-adjusted reorders, and Rupee business exposure.
- **D5 Planning Dashboard (`app/app.py` & React Web App):** Rich interactive UI with real-time filtering, forecast curves, risk matrices, and scenario simulations.
- **D6 Scoring Service (`service/` & Express API):** Real-time REST endpoints (`/api/score`, `/api/batch-score`) with schema validation and error handling.
- **D7 Executive Readout (`reports/`):** 10-slide executive presentation, data quality report, and viva defense guide.

---

## 3. Core Methodological Concepts

### Why Seasonal-Naive Baseline?
In seasonal retail domains, demand from the same week in the previous year ($y_{t-52}$) is often the strongest single predictor of recurring holiday and weather patterns. Comparing an ML model against a simple moving average is deceptive; comparing it against a **Seasonal-Naive baseline** proves whether complex feature engineering provides real business value over basic calendar memory.

### What is WAPE and Why is it Preferred over MAPE?
$$WAPE = \frac{\sum_{i=1}^N |y_i - \hat{y}_i|}{\sum_{i=1}^N y_i} \times 100\%$$
Mean Absolute Percentage Error (MAPE) divides errors by each individual actual ($|y - \hat{y}| / y$), which explodes to infinity when actual demand is zero or very small, disproportionately penalizing slow-moving items. **WAPE (Weighted Absolute Percentage Error)** weights each item's error by its volume, making it volume-neutral, mathematically robust to low-volume weeks, and the undisputed retail industry standard.

### Why Rolling-Origin Cross-Validation?
Standard K-Fold Cross-Validation randomly shuffles rows, which leaks future information into the past (look-ahead bias) and destroys temporal autocorrelation. **Rolling-Origin Cross-Validation** tests the model across multiple historical cutoffs ($T_1, T_2, T_3, T_4$), training strictly on past data ($t \le T$) and forecasting forward into unseen future weeks ($t > T$), exactly mirroring how the model operates in production.

---

## 4. 20 In-Depth Viva Questions & Sample Answers

#### Q1: What is the primary business problem DEMANDWISE solves?
**Answer:** It resolves the fundamental supply chain mismatch between customer demand and inventory availability. By providing accurate 8-week forward demand predictions and deterministic risk classifications, it prevents stockouts on high-velocity items and eliminates excess capital lockup in stagnant inventory.

#### Q2: How do you guarantee zero data leakage during feature engineering?
**Answer:** All features (autoregressive lags, 4-week/8-week rolling averages, rolling standard deviations, and trend momentum) are computed strictly using historical observations with timestamps prior to the prediction week ($t-1, t-2, \dots$). Features never touch target demand at week $t$ or beyond.

#### Q3: What is the difference between Seasonal-Naive and Naive forecasting?
**Answer:** A Naive forecast assumes next week's demand equals last week's demand ($y_t = y_{t-1}$). A Seasonal-Naive forecast assumes next week's demand equals the demand observed during the identical seasonal period in the previous year ($y_t = y_{t-52}$), which captures recurring annual peaks like Diwali and summer surges.

#### Q4: Why did DEMANDWISE achieve a lower WAPE than the Seasonal-Naive baseline?
**Answer:** Seasonal-Naive only remembers calendar seasonality from 52 weeks ago. DEMANDWISE's ML model combines seasonal lags with short-term demand momentum, promotional campaign schedules, and recent rolling averages, improving WAPE by 4.59 percentage points (21.05% vs. 25.64%).

#### Q5: How do you handle SKUs with zero or intermittent sales?
**Answer:** In intermittent or lumpy demand, MAPE fails due to division by zero. We use WAPE (aggregated sum of errors divided by aggregated sum of demand) and compute Coefficient of Variation (CV). High CV items are routed to the 'WATCH / VOLATILE' bucket with elevated safety stocks.

#### Q6: How is safety stock mathematically determined in the project?
**Answer:** Safety Stock is calculated as $SS = Z \times \sigma_{LT} = Z \times \sigma_w \times \sqrt{LeadTimeWeeks}$, where $Z = 1.65$ corresponds to a 95% service level factor, and $\sigma_w$ is the weekly demand standard deviation.

#### Q7: What formula determines the 'REORDER NOW' status?
**Answer:** An SKU triggers 'REORDER NOW' if total available inventory ($I_{on\_hand} + I_{on\_order}$) is less than Lead Time Demand plus Safety Stock ($D_{LT} + SS$), or if Weeks of Supply ($WOS$) is less than supplier lead time.

#### Q8: How is the recommended reorder quantity calculated?
**Answer:** It calculates the deficit $D_{target} - (I_{on\_hand} + I_{on\_order})$, and rounds it up to the next integer multiple of the supplier's Minimum Order Quantity (MOQ).

#### Q9: What triggers the 'MARKDOWN / CLEAR' status?
**Answer:** When an SKU holds more than 10 weeks of forward supply ($WOS > 10$), indicating inventory capital lockup and danger of expiration or obsolescence.

#### Q10: How do you quantify Potential Lost Sales in Rupees?
**Answer:** Potential Lost Sales (₹) is calculated as $Deficit\,Units \times Unit\,Selling\,Price\,(₹)$.

#### Q11: How do you calculate Excess Inventory Value in Rupees?
**Answer:** Excess Capital Locked (₹) is calculated as $(On\,Hand\,Units - (6 \times Avg\,Forward\,Weekly\,Demand)) \times Unit\,Cost\,Price\,(₹)$.

#### Q12: Why do you evaluate Bias in addition to WAPE?
**Answer:** WAPE measures the magnitude of error without direction. Bias measures whether the model is systematically over-predicting (positive bias, leading to overstocking) or under-predicting (negative bias, leading to stockouts). DEMANDWISE maintains a minimal bias of -3.01%.

#### Q13: What does the 'WATCH / VOLATILE' status mean for operations?
**Answer:** It highlights items with high demand variance ($CV > 0.35$) or inventory hovering close to safety stock thresholds. Instead of placing blind orders, buyers audit daily POS trends and review supplier reliability.

#### Q14: How does promotional elasticity affect the forward forecast?
**Answer:** Historical analysis revealed an average promotional lift of +30.0%. When a marketing promotion flag is scheduled in the 8-week horizon, the model applies a trained uplift multiplier to adjust forward demand.

#### Q15: Why is RMSE included as a supporting metric?
**Answer:** RMSE squares individual errors before averaging, making it heavily sensitive to large outliers. Tracking RMSE ensures the model avoids catastrophic forecast misses during peak festive weeks.

#### Q16: How is the Deployed Scoring Service (D6) tested?
**Answer:** We implement automated tests checking schema compliance, boundary conditions (negative stock clamped to 0, zero price handled safely), single-SKU responses, and batch processing.

#### Q17: What happens if supplier lead time doubles due to port strikes?
**Answer:** Because Lead Time Demand is dynamically calculated as $\sum_{w=1}^{LT} \hat{D}_w$, doubling lead time instantly expands the required safety buffer and recalculates the reorder point, alerting planners before stockouts hit.

#### Q18: What are the main assumptions of the inventory risk model?
**Answer:** Supplier lead time is assumed constant, inventory carrying cost rate is assumed at 22% per annum, and markdown recovery is estimated at a 30% discount haircut.

#### Q19: Why not use a deep learning model like LSTM or Transformer?
**Answer:** For 30 SKUs with 104 weekly observations (3,120 data points), deep learning architectures tend to overfit small tabular sample sizes, require massive GPU compute, and operate as black boxes. Regularized autoregressive ML achieves superior generalization, sub-second execution, and full interpretability.

#### Q20: What are the immediate next steps to productionize DEMANDWISE?
**Answer:** Connect the REST API directly to the enterprise ERP via automated webhooks, incorporate supplier transit variance distributions (probabilistic lead times), and expand to store-level hierarchical forecasting.
