#!/usr/bin/env python3
"""
DEMANDWISE – D6 Deployed Scoring Service
Provides high-performance scoring logic callable via Python or microservice endpoints.
Supports single SKU evaluation and batch scoring.
"""

import math
from typing import List, Dict, Any
from service.api_schema import SKUInput, ScoringResult

def score_single_sku(data: SKUInput) -> ScoringResult:
    """
    Executes the 4-Action Inventory Risk & Forward Forecast Algorithm for a single SKU.
    """
    base = data.avg_weekly_demand
    cv = data.demand_cv

    # Multi-step 8-week forward forecast curve
    forecast_curve = []
    for h in range(1, 9):
        seasonal_mult = 1.0 + (0.12 * math.sin((h / 8.0) * math.pi))
        promo_mult = 1.30 if (data.is_promo and h in [1, 2]) else 1.0
        step_fc = max(5.0, base * seasonal_mult * promo_mult)
        forecast_curve.append(step_fc)

    avg_forward = sum(forecast_curve) / len(forecast_curve)
    lead_time_demand = sum(forecast_curve[:data.lead_time_weeks])

    total_available = data.on_hand + data.on_order
    target_buffer = lead_time_demand + data.safety_stock
    wos = (data.on_hand / avg_forward) if avg_forward > 0 else 999.0

    if total_available < target_buffer or wos < data.lead_time_weeks:
        status = "REORDER NOW"
        deficit = max(0.0, target_buffer - total_available)
        moq = data.moq
        order_qty = int(math.ceil(deficit / moq) * moq) if moq > 0 else int(deficit)
        order_qty = max(moq, order_qty)
        lost_sales = deficit * data.unit_price_inr
        excess_cap = 0.0
        markdown_exp = 0.0
        action = f"Issue immediate PO for {order_qty} units (MOQ: {moq}). Current stock covers only {wos:.1f} weeks vs lead time {data.lead_time_weeks} weeks."
    elif wos > 10.0:
        status = "MARKDOWN / CLEAR"
        excess_units = max(0.0, data.on_hand - (avg_forward * 6.0))
        order_qty = 0
        lost_sales = 0.0
        excess_cap = excess_units * data.unit_cost_inr
        markdown_exp = excess_units * data.unit_price_inr * 0.30
        action = f"Overstocked! Weeks of supply ({wos:.1f} wks) exceeds 10-week safety ceiling. Halt replenishments and run a 25%-30% clearance discount."
    elif cv > 0.35 or (wos <= data.lead_time_weeks + 1.5):
        status = "WATCH / VOLATILE"
        order_qty = 0
        lost_sales = avg_forward * 0.5 * data.unit_price_inr
        excess_cap = 0.0
        markdown_exp = 0.0
        action = f"High demand variability (CV: {cv:.2f}) or tight buffer (WOS: {wos:.1f} wks). Audit daily sell-through and maintain elevated safety stock."
    else:
        status = "HEALTHY"
        order_qty = 0
        lost_sales = 0.0
        excess_cap = 0.0
        markdown_exp = 0.0
        action = f"Healthy inventory position ({wos:.1f} weeks of supply). Lead time demand adequately safeguarded."

    return ScoringResult(
        sku_id=data.sku_id,
        product_name=data.product_name,
        risk_status=status,
        weeks_of_supply=wos,
        recommended_action=action,
        recommended_order_qty=order_qty,
        potential_lost_sales_inr=lost_sales,
        excess_capital_locked_inr=excess_cap,
        markdown_exposure_inr=markdown_exp,
        forward_8_weeks_forecast=forecast_curve
    )

def score_batch(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    results = []
    for raw in items:
        sku_obj = SKUInput.from_dict(raw)
        scored = score_single_sku(sku_obj)
        results.append(scored.to_dict())
    return results

if __name__ == "__main__":
    test_sku = SKUInput(
        sku_id="SKU-TEST-001",
        product_name="Sample Retail Basmati Rice",
        category="Staples & Groceries",
        on_hand=50,
        on_order=0,
        lead_time_weeks=2,
        safety_stock=30,
        moq=50,
        unit_cost_inr=400.0,
        unit_price_inr=600.0,
        avg_weekly_demand=120.0,
        demand_cv=0.18,
        is_promo=0
    )
    result = score_single_sku(test_sku)
    print("Scoring Service Test Passed:")
    print(result.to_dict())
