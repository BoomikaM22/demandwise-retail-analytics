# DEMANDWISE – Deployed Scoring Service (D6)

## Overview
The DEMANDWISE Scoring Service provides deterministic, real-time demand forecasting and inventory risk scoring for retail supply chain operations. It powers both the interactive UI and ERP/WMS automated integrations.

## Available Service Endpoints

### 1. Health Check
- **Method:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "service": "DEMANDWISE Scoring Engine",
    "version": "1.0.0"
  }
  ```

### 2. Single SKU Scoring
- **Method:** `POST /api/score`
- **Request Body:**
  ```json
  {
    "sku_id": "SKU-GRO-001",
    "product_name": "Royal Basmati Rice 5kg",
    "category": "Staples & Groceries",
    "on_hand": 95,
    "on_order": 0,
    "lead_time_weeks": 2,
    "safety_stock": 40,
    "moq": 50,
    "unit_cost_inr": 420.00,
    "unit_price_inr": 599.00,
    "avg_weekly_demand": 140.0,
    "demand_cv": 0.18,
    "is_promo": 0
  }
  ```
- **Response:**
  ```json
  {
    "sku_id": "SKU-GRO-001",
    "product_name": "Royal Basmati Rice 5kg",
    "risk_status": "REORDER NOW",
    "weeks_of_supply": 0.6,
    "recommended_action": "Issue immediate PO for 300 units (MOQ: 50). Current stock covers only 0.6 weeks vs lead time 2 weeks.",
    "recommended_order_qty": 300,
    "potential_lost_sales_inr": 134775.00,
    "excess_capital_locked_inr": 0.00,
    "markdown_exposure_inr": 0.00,
    "forward_8_weeks_forecast": [146.4, 151.9, 155.5, 156.8, 155.5, 151.9, 146.4, 140.0]
  }
  ```

### 3. Batch SKU Scoring
- **Method:** `POST /api/batch-score`
- **Request Body:** Array of `SKUInput` objects.
- **Response:** Array of `ScoringResult` objects.

## Input Validation & Error Handling
- **Negative inventory:** Clamped safely to 0 with a warning header.
- **Missing SKU:** Throws HTTP 400 Bad Request with `{ "error": "Missing required field: sku_id" }`.
- **Zero or negative price/cost:** Guarded against division-by-zero; clamped to ₹0.01 minimum.
- **Lead time:** Minimum 1 week enforced.
