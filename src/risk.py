#!/usr/bin/env python3
"""
DEMANDWISE – D4 Inventory Risk Scoring & Decision Engine
Evaluates every SKU against forward multi-week demand forecasts, supplier lead times,
and on-hand / on-order inventory to assign deterministic business action statuses:
1. REORDER NOW (Stockout risk, immediate replenishment required)
2. MARKDOWN / CLEAR (Overstock / dead stock risk, capital lockup)
3. WATCH / VOLATILE (Demand volatility or near-threshold safety buffer)
4. HEALTHY (Optimal stock balance)

Quantifies business impact in Indian Rupees (₹ INR):
- Potential Lost Sales (₹)
- Excess Capital Locked (₹)
- Markdown Value Exposure (₹)
- Recommended Order Quantities (MOQ-adjusted)
"""

import os
import csv
import json
import math
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROC_DIR = os.path.join(BASE_DIR, "data", "processed")

def load_csv(filepath):
    rows = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({k.strip(): v.strip() for k, v in r.items()})
    return rows

def compute_inventory_risk():
    print("=" * 60)
    print("DEMANDWISE – INVENTORY RISK SCORING & DECISION ENGINE (D4)")
    print("=" * 60)

    inv_path = os.path.join(DATA_RAW_DIR, "inventory_status.csv")
    catalog_path = os.path.join(DATA_RAW_DIR, "product_catalog.csv")
    forecast_path = os.path.join(DATA_PROC_DIR, "forecast_output_6_8_weeks.csv")
    eda_path = os.path.join(DATA_PROC_DIR, "eda_summary.json")

    inventory = load_csv(inv_path)
    catalog = load_csv(catalog_path)
    forecast = load_csv(forecast_path)

    # Load EDA stats for CV and volatility profiling
    sku_cv_map = {}
    if os.path.exists(eda_path):
        with open(eda_path, "r", encoding="utf-8") as f:
            eda_data = json.load(f)
            for item in eda_data.get("sku_inventory_profile", []):
                sku_cv_map[item["sku_id"]] = item.get("demand_cv", 0.25)

    catalog_map = {r["sku_id"]: r for r in catalog}

    # Group 8-week forward forecast by SKU
    sku_forward_forecast = defaultdict(list)
    for r in forecast:
        sku_forward_forecast[r["sku_id"]].append(float(r["ml_demand_forecast"]))

    scored_skus = []
    category_risk_rollup = defaultdict(lambda: {"reorder": 0, "markdown": 0, "watch": 0, "healthy": 0, "lost_sales_inr": 0.0, "excess_cost_inr": 0.0})

    total_lost_sales_inr = 0.0
    total_excess_capital_inr = 0.0
    total_markdown_exposure_inr = 0.0
    status_counts = {"REORDER NOW": 0, "MARKDOWN / CLEAR": 0, "WATCH / VOLATILE": 0, "HEALTHY": 0}

    for inv in inventory:
        sku = inv["sku_id"]
        cat_info = catalog_map.get(sku, {})

        on_hand = int(inv["on_hand_inventory"])
        on_order = int(inv["on_order_inventory"])
        lead_time = int(inv["lead_time_weeks"])
        safety_stock = int(inv["safety_stock_units"])
        reorder_point = int(inv["reorder_point_units"])
        moq = int(inv["minimum_order_qty"])

        cost_price = float(cat_info.get("unit_cost_inr", 100.0))
        selling_price = float(cat_info.get("unit_selling_price_inr", 150.0))
        category = cat_info.get("category", "General")

        forward_demands = sku_forward_forecast.get(sku, [100.0] * 8)
        avg_forward_weekly = sum(forward_demands) / len(forward_demands) if forward_demands else 100.0

        # Lead time demand (sum of forecast over lead time weeks)
        lead_time_demand = sum(forward_demands[:lead_time]) if len(forward_demands) >= lead_time else (avg_forward_weekly * lead_time)

        # Weeks of Supply based on forward demand
        weeks_of_supply = round(on_hand / avg_forward_weekly, 1) if avg_forward_weekly > 0 else 999.0
        total_available = on_hand + on_order
        cv = sku_cv_map.get(sku, 0.25)

        # Target inventory buffer (Lead time demand + Safety stock)
        target_buffer = lead_time_demand + safety_stock

        # Classification Logic
        # 1. REORDER NOW: Deficit during lead time or stock is below safety cushion
        if total_available < target_buffer or weeks_of_supply < lead_time:
            risk_status = "REORDER NOW"
            reason = f"On-hand ({on_hand}) + On-order ({on_order}) is below lead-time demand + safety stock ({target_buffer:.0f} units). Current cover {weeks_of_supply} wks < {lead_time} wks lead time."
            
            # Stockout deficit calculation
            deficit = max(0.0, target_buffer - total_available)
            # Round reorder quantity up to nearest MOQ multiple
            recommended_order = int(math.ceil(deficit / moq) * moq) if moq > 0 else int(deficit)
            recommended_order = max(moq, recommended_order)

            potential_lost_sales = round(deficit * selling_price, 2)
            excess_capital_locked = 0.0
            markdown_exposure = 0.0
            action = f"Issue immediate PO for {recommended_order} units (MOQ: {moq}). Expedite shipment with 1st tier supplier."

        # 2. MARKDOWN / CLEAR: Excessive stock (WOS > 10 weeks)
        elif weeks_of_supply > 10.0:
            risk_status = "MARKDOWN / CLEAR"
            reason = f"Excessive inventory holding ({on_hand} units = {weeks_of_supply} weeks of supply). Significant capital lockup exceeds 10-week safety ceiling."
            
            # Safe 6-week target inventory
            safe_target = avg_forward_weekly * 6.0
            excess_units = max(0.0, on_hand - safe_target)
            recommended_order = 0

            potential_lost_sales = 0.0
            excess_capital_locked = round(excess_units * cost_price, 2)
            markdown_exposure = round(excess_units * selling_price * 0.30, 2) # 30% markdown discount loss
            action = f"Halt all incoming procurements. Activate 20%-30% clearance discount promotional bundle to liquidate {int(excess_units)} excess units."

        # 3. WATCH / VOLATILE: High demand coefficient of variation or near-borderline cover
        elif cv > 0.35 or (weeks_of_supply <= lead_time + 1.5):
            risk_status = "WATCH / VOLATILE"
            reason = f"Elevated demand volatility (CV = {cv:.2f}) or tight safety cushion (WOS: {weeks_of_supply} wks vs Lead Time {lead_time} wks)."
            
            recommended_order = 0
            potential_lost_sales = round(avg_forward_weekly * 0.5 * selling_price, 2)
            excess_capital_locked = 0.0
            markdown_exposure = 0.0
            action = "Audit daily POS sell-through and supplier delivery SLA. Re-evaluate reorder trigger at next weekly cycle."

        # 4. HEALTHY: Balanced stock
        else:
            risk_status = "HEALTHY"
            reason = f"Well-balanced stock coverage ({weeks_of_supply} weeks) comfortably covers supplier lead time ({lead_time} wks) with stable volatility (CV: {cv:.2f})."
            
            recommended_order = 0
            potential_lost_sales = 0.0
            excess_capital_locked = 0.0
            markdown_exposure = 0.0
            action = "Maintain regular monitoring cadence. No procurement or discounting action required."

        status_counts[risk_status] += 1
        total_lost_sales_inr += potential_lost_sales
        total_excess_capital_inr += excess_capital_locked
        total_markdown_exposure_inr += markdown_exposure

        # Rollup by category
        cat_roll = category_risk_rollup[category]
        if risk_status == "REORDER NOW":
            cat_roll["reorder"] += 1
        elif risk_status == "MARKDOWN / CLEAR":
            cat_roll["markdown"] += 1
        elif risk_status == "WATCH / VOLATILE":
            cat_roll["watch"] += 1
        else:
            cat_roll["healthy"] += 1
        cat_roll["lost_sales_inr"] += potential_lost_sales
        cat_roll["excess_cost_inr"] += excess_capital_locked

        scored_skus.append({
            "sku_id": sku,
            "product_name": inv["product_name"],
            "category": category,
            "on_hand_inventory": on_hand,
            "on_order_inventory": on_order,
            "lead_time_weeks": lead_time,
            "safety_stock_units": safety_stock,
            "reorder_point_units": reorder_point,
            "minimum_order_qty": moq,
            "avg_forward_weekly_demand": round(avg_forward_weekly, 1),
            "weeks_of_supply": weeks_of_supply,
            "demand_cv": round(cv, 3),
            "unit_cost_inr": cost_price,
            "unit_selling_price_inr": selling_price,
            "risk_status": risk_status,
            "recommended_order_qty": recommended_order,
            "primary_driver": reason,
            "recommended_action": action,
            "potential_lost_sales_inr": potential_lost_sales,
            "excess_capital_locked_inr": excess_capital_locked,
            "markdown_exposure_inr": markdown_exposure
        })

    # Save to CSV
    out_csv = os.path.join(DATA_PROC_DIR, "inventory_risk_scored.csv")
    fieldnames = list(scored_skus[0].keys())
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scored_skus)

    # Save JSON summary
    summary = {
        "as_of_date": "2025-12-29",
        "total_skus_evaluated": len(scored_skus),
        "status_distribution": status_counts,
        "financial_impact_inr": {
            "total_potential_lost_sales_inr": round(total_lost_sales_inr, 2),
            "total_excess_capital_locked_inr": round(total_excess_capital_inr, 2),
            "total_markdown_exposure_inr": round(total_markdown_exposure_inr, 2),
            "total_working_capital_at_risk_inr": round(total_lost_sales_inr + total_excess_capital_inr, 2)
        },
        "category_risk_rollup": dict(category_risk_rollup),
        "scored_skus": scored_skus
    }

    out_json = os.path.join(DATA_PROC_DIR, "inventory_summary.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Risk scoring completed for {len(scored_skus)} SKUs.")
    print(f"Status distribution: {status_counts}")
    print(f"Potential Lost Sales:  ₹{total_lost_sales_inr:,.2f}")
    print(f"Excess Capital Locked: ₹{total_excess_capital_inr:,.2f}")
    print(f"Results written to: {out_csv} and {out_json}")
    return summary

if __name__ == "__main__":
    compute_inventory_risk()
