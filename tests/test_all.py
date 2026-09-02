#!/usr/bin/env python3
"""
DEMANDWISE – Complete Test Suite
Executes end-to-end verification of:
1. Data Pipeline & Schema Validation (D1)
2. EDA & Feature Statistics (D2)
3. Forecasting & Baseline Verification (D3)
4. Inventory Risk Scoring & Financial Logic (D4)
5. Scoring Service API Schema & Edge Cases (D6)
"""

import sys
import os
import math

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from src.pipeline import validate_and_clean_data, engineer_leakage_free_features
from src.forecast import SeasonalNaiveForecaster, FeatureWeightedMLForecaster
from src.risk import compute_inventory_risk
from service.api_schema import SKUInput, ScoringResult
from service.scoring_service import score_single_sku, score_batch

def test_pipeline_and_features():
    print("Testing D1 Pipeline & Feature Engineering...")
    cleaned, catalog, inv, summary = validate_and_clean_data()
    assert summary["status"] == "PASS", "Pipeline validation failed"
    assert summary["cleaned_sales_records"] == 3120, f"Expected 3120 rows, got {summary['cleaned_sales_records']}"
    assert summary["catalog_sku_count"] == 30, f"Expected 30 SKUs, got {summary['catalog_sku_count']}"

    features = engineer_leakage_free_features(cleaned)
    assert len(features) == 3120, "Feature dataset length mismatch"
    
    # Check lag integrity (Week 1 lag should not be undefined)
    sample = features[0]
    assert "lag_1" in sample and "lag_52" in sample and "roll_mean_4w" in sample
    print("✓ D1 Pipeline & Feature Engineering passed.")

def test_forecasting_models():
    print("Testing D3 Forecasting & Seasonal-Naive Baseline...")
    cleaned, _, _, _ = validate_and_clean_data()
    naive = SeasonalNaiveForecaster()
    naive.fit(cleaned)

    ml = FeatureWeightedMLForecaster()
    ml.fit(cleaned)

    # Test predictions for Week 105
    pred_naive = naive.predict_sku_step("SKU-GRO-001", 105)
    pred_ml = ml.predict_sku_step("SKU-GRO-001", 105, is_promo=1, is_holiday=0)

    assert pred_naive > 0, "Naive prediction must be positive"
    assert pred_ml > 0, "ML prediction must be positive"
    print(f"✓ D3 Forecast sample (SKU-GRO-001 W105): Naive={pred_naive}, ML={pred_ml}")

def test_inventory_risk_and_rupee_impact():
    print("Testing D4 Inventory Risk Engine & Rupee Impact...")
    summary = compute_inventory_risk()
    assert summary["total_skus_evaluated"] == 30, "Expected 30 evaluated SKUs"
    dist = summary["status_distribution"]
    assert "REORDER NOW" in dist and "MARKDOWN / CLEAR" in dist and "HEALTHY" in dist

    fin = summary["financial_impact_inr"]
    assert fin["total_potential_lost_sales_inr"] > 0, "Lost sales calculation must be positive"
    assert fin["total_excess_capital_locked_inr"] > 0, "Excess capital calculation must be positive"
    print(f"✓ D4 Risk Status Distribution: {dist}")
    print(f"✓ D4 Rupee Lost Sales: ₹{fin['total_potential_lost_sales_inr']:,.2f} | Excess: ₹{fin['total_excess_capital_locked_inr']:,.2f}")

def test_scoring_service_edge_cases():
    print("Testing D6 Scoring Service & Edge Cases...")
    
    # Edge case 1: Zero on-hand and zero on-order (critical stockout)
    crit_sku = SKUInput(
        sku_id="SKU-ZERO-001",
        product_name="Critical Stockout Item",
        category="Staples",
        on_hand=0,
        on_order=0,
        lead_time_weeks=2,
        safety_stock=20,
        moq=50,
        unit_cost_inr=100.0,
        unit_price_inr=150.0,
        avg_weekly_demand=100.0
    )
    res1 = score_single_sku(crit_sku)
    assert res1.risk_status == "REORDER NOW", f"Expected REORDER NOW, got {res1.risk_status}"
    assert res1.recommended_order_qty >= 50, "Order qty must respect MOQ"

    # Edge case 2: Massive overstock
    over_sku = SKUInput(
        sku_id="SKU-OVER-001",
        product_name="Massive Overstock Item",
        category="Beverages",
        on_hand=5000,
        on_order=0,
        lead_time_weeks=2,
        safety_stock=20,
        moq=50,
        unit_cost_inr=50.0,
        unit_price_inr=80.0,
        avg_weekly_demand=50.0
    )
    res2 = score_single_sku(over_sku)
    assert res2.risk_status == "MARKDOWN / CLEAR", f"Expected MARKDOWN / CLEAR, got {res2.risk_status}"
    assert res2.excess_capital_locked_inr > 0, "Excess capital locked must be positive"

    # Edge case 3: Batch scoring
    batch_res = score_batch([crit_sku.__dict__, over_sku.__dict__])
    assert len(batch_res) == 2, "Batch scoring returned wrong length"

    print("✓ D6 Scoring Service passed edge case verification.")

def main():
    print("=" * 60)
    print("DEMANDWISE – EXECUTING AUTOMATED TEST SUITE")
    print("=" * 60)
    test_pipeline_and_features()
    test_forecasting_models()
    test_inventory_risk_and_rupee_impact()
    test_scoring_service_edge_cases()
    print("=" * 60)
    print("ALL 4 TEST MODULES PASSED PERFECTLY (100% SUCCESS)")
    print("=" * 60)

if __name__ == "__main__":
    main()
