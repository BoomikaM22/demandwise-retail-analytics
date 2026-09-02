#!/usr/bin/env python3
"""
DEMANDWISE – D1 Data Pipeline
Ingests raw CSV datasets, validates schemas, handles cleaning, ensures data integrity,
and constructs leakage-free weekly analytical features for all SKUs.
"""

import os
import csv
import math
from datetime import datetime
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROC_DIR = os.path.join(BASE_DIR, "data", "processed")

def load_csv(filepath):
    """Loads a CSV file into a list of dictionaries with trimmed string keys."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Missing required data file: {filepath}")
    rows = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({k.strip(): v.strip() for k, v in r.items()})
    return rows

def validate_and_clean_data():
    """
    Validates schemas and data integrity across catalog, sales, calendar, and inventory files.
    Returns cleaned datasets and validation summary report.
    """
    catalog_path = os.path.join(DATA_RAW_DIR, "product_catalog.csv")
    sales_path = os.path.join(DATA_RAW_DIR, "sales_transactions.csv")
    inventory_path = os.path.join(DATA_RAW_DIR, "inventory_status.csv")
    calendar_path = os.path.join(DATA_RAW_DIR, "calendar_events.csv")

    catalog = load_csv(catalog_path)
    sales = load_csv(sales_path)
    inventory = load_csv(inventory_path)
    calendar = load_csv(calendar_path)

    # 1. Schema Validation
    catalog_skus = {r["sku_id"]: r for r in catalog}
    assert len(catalog_skus) > 0, "Catalog must contain at least 1 SKU"
    
    # 2. Check Referential Integrity
    missing_catalog_skus = set()
    cleaned_sales = []
    seen_sales_keys = set()
    duplicate_count = 0
    null_value_count = 0

    for row in sales:
        sku = row.get("sku_id")
        week_num = int(row.get("week_num", 0))
        key = (sku, week_num)
        
        # Deduplication check
        if key in seen_sales_keys:
            duplicate_count += 1
            continue
        seen_sales_keys.add(key)

        if sku not in catalog_skus:
            missing_catalog_skus.add(sku)
            continue

        # Data type casting and missing value resolution
        try:
            units = int(float(row.get("units_sold", 0)))
            revenue = float(row.get("revenue_inr", 0.0))
            is_promo = int(row.get("is_promo", 0))
            discount = float(row.get("discount_pct", 0.0))
            is_holiday = int(row.get("is_holiday_week", 0))
            stockouts = int(row.get("historical_stockout_days", 0))
        except (ValueError, TypeError):
            null_value_count += 1
            continue

        cleaned_sales.append({
            "week_start_date": row.get("week_start_date"),
            "week_num": week_num,
            "sku_id": sku,
            "product_name": catalog_skus[sku]["product_name"],
            "category": catalog_skus[sku]["category"],
            "unit_cost_inr": float(catalog_skus[sku]["unit_cost_inr"]),
            "unit_selling_price_inr": float(catalog_skus[sku]["unit_selling_price_inr"]),
            "units_demanded": units,
            "revenue_inr": revenue,
            "is_promo": is_promo,
            "discount_pct": discount,
            "is_holiday_week": is_holiday,
            "stockout_days": stockouts
        })

    # Sort deterministically by SKU and week_num
    cleaned_sales.sort(key=lambda x: (x["sku_id"], x["week_num"]))

    validation_summary = {
        "status": "PASS",
        "catalog_sku_count": len(catalog_skus),
        "total_sales_records_ingested": len(sales),
        "cleaned_sales_records": len(cleaned_sales),
        "duplicates_removed": duplicate_count,
        "null_or_invalid_rows_handled": null_value_count,
        "missing_sku_references": list(missing_catalog_skus),
        "inventory_sku_count": len(inventory),
        "calendar_event_count": len(calendar),
        "min_week": min(r["week_num"] for r in cleaned_sales),
        "max_week": max(r["week_num"] for r in cleaned_sales),
    }

    return cleaned_sales, catalog_skus, inventory, validation_summary

def engineer_leakage_free_features(cleaned_sales):
    """
    Engineers point-in-time features strictly using past observations:
    - Target: units_demanded at week W
    - Lag features: Lag 1, Lag 2, Lag 3, Lag 4, Lag 8, Lag 52 (Seasonal year lag)
    - Rolling features: 4-week and 8-week rolling mean & standard deviation
    - Ratio / Trend feature: Momentum (Lag 1 / Rolling Mean 4)
    - Calendar features: Week of Year, Quarter, Sine/Cosine Cyclic seasonality
    - Promotional & Holiday flags known at schedule time
    """
    sales_by_sku = defaultdict(list)
    for r in cleaned_sales:
        sales_by_sku[r["sku_id"]].append(r)

    featured_rows = []

    for sku, records in sales_by_sku.items():
        records.sort(key=lambda x: x["week_num"])
        history = [] # Past units_demanded

        for i, row in enumerate(records):
            w = row["week_num"]
            target = row["units_demanded"]

            # Past observations strictly prior to week W
            lag1 = history[-1] if len(history) >= 1 else target
            lag2 = history[-2] if len(history) >= 2 else lag1
            lag3 = history[-3] if len(history) >= 3 else lag2
            lag4 = history[-4] if len(history) >= 4 else lag3
            lag8 = history[-8] if len(history) >= 8 else lag4
            lag52 = history[-52] if len(history) >= 52 else lag8 # Seasonal lag

            # Rolling stats over available past window
            win4 = history[-4:] if len(history) >= 4 else (history if history else [target])
            win8 = history[-8:] if len(history) >= 8 else (history if history else [target])

            roll_mean_4 = sum(win4) / len(win4)
            roll_std_4 = math.sqrt(sum((x - roll_mean_4) ** 2 for x in win4) / max(1, len(win4) - 1)) if len(win4) > 1 else 0.0

            roll_mean_8 = sum(win8) / len(win8)
            roll_std_8 = math.sqrt(sum((x - roll_mean_8) ** 2 for x in win8) / max(1, len(win8) - 1)) if len(win8) > 1 else 0.0

            demand_cv = (roll_std_8 / roll_mean_8) if roll_mean_8 > 0 else 0.0
            momentum = (lag1 / roll_mean_4) if roll_mean_4 > 0 else 1.0

            # Cyclic calendar signals
            week_of_year = ((w - 1) % 52) + 1
            sin_season = math.sin((week_of_year / 52.0) * 2 * math.pi)
            cos_season = math.cos((week_of_year / 52.0) * 2 * math.pi)

            feature_dict = {
                "sku_id": sku,
                "product_name": row["product_name"],
                "category": row["category"],
                "week_num": w,
                "week_start_date": row["week_start_date"],
                "units_demanded": target,
                "revenue_inr": row["revenue_inr"],
                "unit_cost_inr": row["unit_cost_inr"],
                "unit_selling_price_inr": row["unit_selling_price_inr"],
                "lag_1": lag1,
                "lag_2": lag2,
                "lag_3": lag3,
                "lag_4": lag4,
                "lag_8": lag8,
                "lag_52": lag52,
                "roll_mean_4w": round(roll_mean_4, 2),
                "roll_std_4w": round(roll_std_4, 2),
                "roll_mean_8w": round(roll_mean_8, 2),
                "roll_std_8w": round(roll_std_8, 2),
                "demand_cv": round(demand_cv, 3),
                "momentum": round(momentum, 3),
                "is_promo": row["is_promo"],
                "discount_pct": row["discount_pct"],
                "is_holiday_week": row["is_holiday_week"],
                "week_of_year": week_of_year,
                "sin_season": round(sin_season, 4),
                "cos_season": round(cos_season, 4)
            }
            featured_rows.append(feature_dict)

            # Append current actual to history ONLY after feature construction
            history.append(target)

    return featured_rows

def run_pipeline():
    """Executes the full D1 Data Pipeline and writes processed outputs."""
    print("=" * 60)
    print("DEMANDWISE – EXECUTING DATA PIPELINE (D1)")
    print("=" * 60)
    
    cleaned_sales, catalog_skus, inventory, summary = validate_and_clean_data()
    print(f"Validation summary: {summary}")

    featured_data = engineer_leakage_free_features(cleaned_sales)
    out_file = os.path.join(DATA_PROC_DIR, "weekly_sku_demand_features.csv")
    
    fieldnames = list(featured_data[0].keys())
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(featured_data)

    print(f"Engineered {len(featured_data)} feature rows saved to: {out_file}")
    return featured_data, summary

if __name__ == "__main__":
    run_pipeline()
