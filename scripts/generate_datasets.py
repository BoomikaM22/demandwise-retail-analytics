#!/usr/bin/env python3
"""
DEMANDWISE – Dataset Generator & Pipeline Initializer
Generates realistic multi-category retail datasets covering 104 historical weeks (2024-2025/2026).
Simulates realistic retail dynamics:
- Trend, yearly/seasonal patterns (Diwali, Summer, Monsoon, Holidays)
- Price elasticity and promotional lifts
- Supply chain parameters (Lead times, on-hand, on-order, safety stock)
- Real-world challenges (slow movers, top sellers, intermittent demand, stockout risk, overstock)
"""

import os
import csv
import math
import random
from datetime import datetime, timedelta

# Fix seed for reproducibility
random.seed(42)

DATA_RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
DATA_PROC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed")

os.makedirs(DATA_RAW_DIR, exist_ok=True)
os.makedirs(DATA_PROC_DIR, exist_ok=True)

# 30 Authentic Retail SKUs across 5 Core Indian Retail / FMCG Categories
PRODUCTS = [
    # Category: Staples & Groceries
    {"sku_id": "SKU-GRO-001", "name": "Royal Basmati Rice 5kg", "category": "Staples & Groceries", "cost_inr": 420.0, "price_inr": 599.0, "base_demand": 140, "trend": 0.003, "lead_time_wks": 2, "moq": 50, "volatility": 0.15},
    {"sku_id": "SKU-GRO-002", "name": "Sharbati Whole Wheat Atta 10kg", "category": "Staples & Groceries", "cost_inr": 310.0, "price_inr": 435.0, "base_demand": 210, "trend": 0.002, "lead_time_wks": 2, "moq": 60, "volatility": 0.12},
    {"sku_id": "SKU-GRO-003", "name": "Cold-Pressed Mustard Oil 1L", "category": "Staples & Groceries", "cost_inr": 135.0, "price_inr": 195.0, "base_demand": 160, "trend": 0.001, "lead_time_wks": 3, "moq": 40, "volatility": 0.18},
    {"sku_id": "SKU-GRO-004", "name": "Organic Toor Dal 2kg", "category": "Staples & Groceries", "cost_inr": 190.0, "price_inr": 275.0, "base_demand": 125, "trend": 0.002, "lead_time_wks": 2, "moq": 40, "volatility": 0.16},
    {"sku_id": "SKU-GRO-005", "name": "Refined Sulphur-Free Sugar 5kg", "category": "Staples & Groceries", "cost_inr": 180.0, "price_inr": 249.0, "base_demand": 175, "trend": 0.001, "lead_time_wks": 1, "moq": 50, "volatility": 0.14},
    {"sku_id": "SKU-GRO-006", "name": "Assam Orthodox Whole Leaf Tea 500g", "category": "Staples & Groceries", "cost_inr": 240.0, "price_inr": 360.0, "base_demand": 95, "trend": 0.002, "lead_time_wks": 2, "moq": 30, "volatility": 0.20},

    # Category: Beverages & Dairy
    {"sku_id": "SKU-BEV-001", "name": "Authentic Masala Chai Premix 1kg", "category": "Beverages & Dairy", "cost_inr": 320.0, "price_inr": 480.0, "base_demand": 110, "trend": 0.004, "lead_time_wks": 2, "moq": 35, "volatility": 0.22},
    {"sku_id": "SKU-BEV-002", "name": "Artisanal Cold Brew Coffee 250ml (Pack of 6)", "category": "Beverages & Dairy", "cost_inr": 360.0, "price_inr": 549.0, "base_demand": 65, "trend": 0.006, "lead_time_wks": 3, "moq": 25, "volatility": 0.35},
    {"sku_id": "SKU-BEV-003", "name": "Alphonso Mango Pulp Tin 850g", "category": "Beverages & Dairy", "cost_inr": 140.0, "price_inr": 220.0, "base_demand": 80, "trend": 0.001, "lead_time_wks": 2, "moq": 30, "volatility": 0.45}, # Summer seasonal
    {"sku_id": "SKU-BEV-004", "name": "Sparkling Botanical Tonic Water 250ml", "category": "Beverages & Dairy", "cost_inr": 45.0, "price_inr": 85.0, "base_demand": 130, "trend": 0.005, "lead_time_wks": 2, "moq": 60, "volatility": 0.28},
    {"sku_id": "SKU-BEV-005", "name": "Roasted Almond Badam Milk Mix 500g", "category": "Beverages & Dairy", "cost_inr": 210.0, "price_inr": 315.0, "base_demand": 70, "trend": 0.001, "lead_time_wks": 2, "moq": 20, "volatility": 0.25},
    {"sku_id": "SKU-BEV-006", "name": "Tender Coconut Water Tetrapack 200ml (12-pk)", "category": "Beverages & Dairy", "cost_inr": 280.0, "price_inr": 420.0, "base_demand": 115, "trend": 0.003, "lead_time_wks": 1, "moq": 40, "volatility": 0.30},

    # Category: Snacks & Packaged Foods
    {"sku_id": "SKU-SNK-001", "name": "Peri Peri Roasted Foxnut Makhana 150g", "category": "Snacks & Packaged Foods", "cost_inr": 115.0, "price_inr": 189.0, "base_demand": 150, "trend": 0.005, "lead_time_wks": 2, "moq": 50, "volatility": 0.25},
    {"sku_id": "SKU-SNK-002", "name": "Dark Chocolate Quinoa Granola 400g", "category": "Snacks & Packaged Foods", "cost_inr": 220.0, "price_inr": 349.0, "base_demand": 85, "trend": 0.004, "lead_time_wks": 3, "moq": 30, "volatility": 0.30},
    {"sku_id": "SKU-SNK-003", "name": "Multigrain Roasted Nachos 200g", "category": "Snacks & Packaged Foods", "cost_inr": 60.0, "price_inr": 99.0, "base_demand": 180, "trend": 0.003, "lead_time_wks": 2, "moq": 60, "volatility": 0.20},
    {"sku_id": "SKU-SNK-004", "name": "Handcrafted Kaju Katli Gift Box 500g", "category": "Snacks & Packaged Foods", "cost_inr": 390.0, "price_inr": 599.0, "base_demand": 45, "trend": 0.002, "lead_time_wks": 1, "moq": 20, "volatility": 0.65}, # Festival spikes!
    {"sku_id": "SKU-SNK-005", "name": "Baked Oats Digestive Biscuits 300g", "category": "Snacks & Packaged Foods", "cost_inr": 50.0, "price_inr": 80.0, "base_demand": 140, "trend": 0.002, "lead_time_wks": 2, "moq": 40, "volatility": 0.18},
    {"sku_id": "SKU-SNK-006", "name": "Gourmet Salted Pistachios 250g", "category": "Snacks & Packaged Foods", "cost_inr": 290.0, "price_inr": 440.0, "base_demand": 60, "trend": 0.003, "lead_time_wks": 2, "moq": 25, "volatility": 0.32},

    # Category: Personal Care
    {"sku_id": "SKU-PER-001", "name": "Bhringraj & Onion Hair Fall Control Shampoo 300ml", "category": "Personal Care", "cost_inr": 180.0, "price_inr": 299.0, "base_demand": 105, "trend": 0.004, "lead_time_wks": 2, "moq": 40, "volatility": 0.20},
    {"sku_id": "SKU-PER-002", "name": "Neem & Salicylic Acid Clarifying Face Wash 150ml", "category": "Personal Care", "cost_inr": 120.0, "price_inr": 210.0, "base_demand": 120, "trend": 0.005, "lead_time_wks": 2, "moq": 45, "volatility": 0.22},
    {"sku_id": "SKU-PER-003", "name": "Matte Gel Sunscreen SPF 50 PA++++ 50g", "category": "Personal Care", "cost_inr": 250.0, "price_inr": 449.0, "base_demand": 90, "trend": 0.006, "lead_time_wks": 3, "moq": 30, "volatility": 0.40},
    {"sku_id": "SKU-PER-004", "name": "Deep Cleansing Activated Bamboo Charcoal Soap 125g", "category": "Personal Care", "cost_inr": 45.0, "price_inr": 89.0, "base_demand": 140, "trend": 0.002, "lead_time_wks": 1, "moq": 50, "volatility": 0.18},
    {"sku_id": "SKU-PER-005", "name": "Cedarwood & Argan Nourishing Beard Oil 30ml", "category": "Personal Care", "cost_inr": 160.0, "price_inr": 285.0, "base_demand": 40, "trend": 0.001, "lead_time_wks": 3, "moq": 20, "volatility": 0.42},
    {"sku_id": "SKU-PER-006", "name": "Hydrating Rose Water Face Toner Mist 200ml", "category": "Personal Care", "cost_inr": 110.0, "price_inr": 195.0, "base_demand": 80, "trend": 0.003, "lead_time_wks": 2, "moq": 30, "volatility": 0.26},

    # Category: Household Essentials
    {"sku_id": "SKU-HOU-001", "name": "Citrus Herbal Anti-Bacterial Floor Cleaner 2L", "category": "Household Essentials", "cost_inr": 140.0, "price_inr": 230.0, "base_demand": 130, "trend": 0.002, "lead_time_wks": 2, "moq": 40, "volatility": 0.15},
    {"sku_id": "SKU-HOU-002", "name": "Concentrated Enzymatic Liquid Laundry Detergent 1L", "category": "Household Essentials", "cost_inr": 170.0, "price_inr": 279.0, "base_demand": 165, "trend": 0.003, "lead_time_wks": 2, "moq": 50, "volatility": 0.14},
    {"sku_id": "SKU-HOU-003", "name": "Multi-Surface Disinfectant Surface Spray 500ml", "category": "Household Essentials", "cost_inr": 95.0, "price_inr": 165.0, "base_demand": 110, "trend": 0.001, "lead_time_wks": 2, "moq": 35, "volatility": 0.24},
    {"sku_id": "SKU-HOU-004", "name": "100% Biodegradable Cornstarch Garbage Bags (30 pcs)", "category": "Household Essentials", "cost_inr": 80.0, "price_inr": 140.0, "base_demand": 145, "trend": 0.004, "lead_time_wks": 1, "moq": 50, "volatility": 0.16},
    {"sku_id": "SKU-HOU-005", "name": "Lemon Blossom Grease-Cutting Dishwash Gel 750ml", "category": "Household Essentials", "cost_inr": 90.0, "price_inr": 155.0, "base_demand": 170, "trend": 0.002, "lead_time_wks": 2, "moq": 50, "volatility": 0.13},
    {"sku_id": "SKU-HOU-006", "name": "Lavender Aromatherapy Mosquito Repellent Vaporizer Pack", "category": "Household Essentials", "cost_inr": 120.0, "price_inr": 199.0, "base_demand": 95, "trend": 0.003, "lead_time_wks": 2, "moq": 30, "volatility": 0.38} # Monsoon spike
]

# Calendar Events & Holidays across 104 weeks (Starting from 2024-01-01)
# 104 weeks is 2024-01-01 through 2025-12-22
START_DATE = datetime(2024, 1, 1)

def get_calendar_events():
    events = [
        {"week": 3, "name": "Republic Day Mega Sale", "multiplier": 1.25, "categories": ["all"]},
        {"week": 11, "name": "Holi Festival", "multiplier": 1.30, "categories": ["Beverages & Dairy", "Snacks & Packaged Foods"]},
        {"week": 18, "name": "Summer Peak Kickoff", "multiplier": 1.35, "categories": ["Beverages & Dairy", "Personal Care"]},
        {"week": 28, "name": "Monsoon Wellness Drive", "multiplier": 1.20, "categories": ["Personal Care", "Household Essentials"]},
        {"week": 33, "name": "Independence Day Freedom Sale", "multiplier": 1.30, "categories": ["all"]},
        {"week": 41, "name": "Dussehra Festive Prep", "multiplier": 1.40, "categories": ["all"]},
        {"week": 44, "name": "Diwali Grand Festival", "multiplier": 1.85, "categories": ["all"]},
        {"week": 51, "name": "Christmas & Year-End Cleansing", "multiplier": 1.25, "categories": ["all"]},
        # Year 2 (2025)
        {"week": 55, "name": "Republic Day 2025 Super Deal", "multiplier": 1.25, "categories": ["all"]},
        {"week": 63, "name": "Holi 2025", "multiplier": 1.30, "categories": ["Beverages & Dairy", "Snacks & Packaged Foods"]},
        {"week": 70, "name": "Summer Heatwave Promo", "multiplier": 1.35, "categories": ["Beverages & Dairy", "Personal Care"]},
        {"week": 80, "name": "Monsoon Mega Saver", "multiplier": 1.20, "categories": ["Personal Care", "Household Essentials"]},
        {"week": 85, "name": "Independence Day Big Sale", "multiplier": 1.30, "categories": ["all"]},
        {"week": 93, "name": "Dussehra Mega Week", "multiplier": 1.45, "categories": ["all"]},
        {"week": 96, "name": "Diwali Mega Dhamaka 2025", "multiplier": 1.90, "categories": ["all"]},
        {"week": 103, "name": "Year-End Grand Clearance", "multiplier": 1.30, "categories": ["all"]}
    ]
    return events

EVENTS = get_calendar_events()

def generate_catalog():
    path = os.path.join(DATA_RAW_DIR, "product_catalog.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "sku_id", "product_name", "category", "unit_cost_inr", "unit_selling_price_inr",
            "lead_time_weeks", "minimum_order_qty", "annual_holding_cost_rate"
        ])
        for p in PRODUCTS:
            writer.writerow([
                p["sku_id"], p["name"], p["category"], f"{p['cost_inr']:.2f}", f"{p['price_inr']:.2f}",
                p["lead_time_wks"], p["moq"], "0.22"
            ])
    print(f"Created catalog: {path} ({len(PRODUCTS)} SKUs)")

def generate_calendar():
    path = os.path.join(DATA_RAW_DIR, "calendar_events.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["week_num", "event_name", "demand_multiplier", "applicable_categories"])
        for e in EVENTS:
            writer.writerow([e["week"], e["name"], e["multiplier"], "|".join(e["categories"])])
    print(f"Created calendar events: {path}")

def generate_sales_and_weekly_demand():
    path_sales = os.path.join(DATA_RAW_DIR, "sales_transactions.csv")
    path_weekly = os.path.join(DATA_PROC_DIR, "weekly_sku_demand.csv")

    sales_rows = []
    weekly_rows = []

    # Map events by week
    event_by_week = {e["week"]: e for e in EVENTS}

    # Generate 104 weeks for all 30 SKUs = 3,120 weekly records
    for w in range(1, 105):
        week_date = START_DATE + timedelta(weeks=(w - 1))
        date_str = week_date.strftime("%Y-%m-%d")
        event = event_by_week.get(w, None)

        for p in PRODUCTS:
            sku = p["sku_id"]
            cat = p["category"]
            base = p["base_demand"]
            trend = 1.0 + (p["trend"] * w)
            volatility = p["volatility"]

            # Seasonal yearly cycle (52 weeks cycle)
            cycle_phase = (w % 52) / 52.0 * 2 * math.pi
            seasonal_factor = 1.0 + 0.12 * math.sin(cycle_phase)

            # Category-specific seasonality
            if cat == "Beverages & Dairy" and (14 <= (w % 52) <= 24):
                seasonal_factor += 0.25 # Summer beverage surge
            elif cat == "Personal Care" and (14 <= (w % 52) <= 22):
                seasonal_factor += 0.20 # Summer skincare surge
            elif cat == "Household Essentials" and (26 <= (w % 52) <= 34):
                seasonal_factor += 0.18 # Monsoon protection & cleaning

            # Event multiplier
            event_mult = 1.0
            event_name = "None"
            if event:
                if "all" in event["categories"] or cat in event["categories"]:
                    event_mult = event["multiplier"]
                    event_name = event["name"]

            # Random promotional campaigns (every ~6-9 weeks)
            is_promo = 1 if ((w + hash(sku)) % 7 == 0) else 0
            discount_pct = 0.15 if is_promo else 0.0
            promo_lift = 1.30 if is_promo else 1.0

            # Random noise using log-normal or Gaussian for positive demand
            noise = random.gauss(1.0, volatility)
            raw_demand = base * trend * seasonal_factor * event_mult * promo_lift * noise
            demand = max(5, int(round(raw_demand)))

            unit_price = p["price_inr"] * (1.0 - discount_pct)
            revenue = round(demand * unit_price, 2)

            # Simulated stockout days in past (rare, but happens in supply chains)
            stockout_days = 0
            if random.random() < 0.04 and demand > base * 1.3:
                stockout_days = random.randint(1, 4)

            sales_rows.append([
                date_str, w, sku, p["name"], cat, demand, revenue,
                is_promo, f"{discount_pct:.2f}", 1 if event else 0, event_name, stockout_days
            ])

            weekly_rows.append([
                date_str, w, sku, p["name"], cat, demand, revenue,
                is_promo, discount_pct, 1 if event else 0, stockout_days
            ])

    with open(path_sales, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "week_start_date", "week_num", "sku_id", "product_name", "category",
            "units_sold", "revenue_inr", "is_promo", "discount_pct",
            "is_holiday_week", "holiday_name", "historical_stockout_days"
        ])
        writer.writerows(sales_rows)

    with open(path_weekly, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "week_start_date", "week_num", "sku_id", "product_name", "category",
            "units_demanded", "revenue_inr", "is_promo", "discount_pct",
            "is_holiday_week", "stockout_days"
        ])
        writer.writerows(weekly_rows)

    print(f"Created sales transactions: {path_sales} ({len(sales_rows)} records)")
    print(f"Created weekly SKU demand: {path_weekly} ({len(weekly_rows)} records)")

def generate_inventory_status():
    """
    Creates an authentic current inventory snapshot for all 30 SKUs.
    Explicitly includes varied, realistic business conditions:
    - 7 REORDER NOW (Stockouts / Low stock compared to forward demand)
    - 7 MARKDOWN / CLEAR (Overstock / Slow moving / Dead stock)
    - 6 WATCH / VOLATILE (Borderline safety cushion or high demand volatility)
    - 10 HEALTHY (Optimal 4-8 weeks supply buffer)
    """
    path = os.path.join(DATA_RAW_DIR, "inventory_status.csv")

    # Inventory profiles mapped deliberately to reflect the four business archetypes
    inventory_profiles = {
        # REORDER NOW: On-hand is depleted or less than lead time demand
        "SKU-GRO-001": {"on_hand": 95, "on_order": 0, "status_target": "REORDER NOW"},
        "SKU-GRO-003": {"on_hand": 110, "on_order": 50, "status_target": "REORDER NOW"},
        "SKU-BEV-002": {"on_hand": 40, "on_order": 0, "status_target": "REORDER NOW"},
        "SKU-BEV-004": {"on_hand": 75, "on_order": 0, "status_target": "REORDER NOW"},
        "SKU-SNK-001": {"on_hand": 85, "on_order": 50, "status_target": "REORDER NOW"},
        "SKU-PER-002": {"on_hand": 80, "on_order": 0, "status_target": "REORDER NOW"},
        "SKU-HOU-002": {"on_hand": 115, "on_order": 0, "status_target": "REORDER NOW"},

        # MARKDOWN / CLEAR: Excessive stock (> 10-15 weeks forward demand)
        "SKU-GRO-005": {"on_hand": 2600, "on_order": 0, "status_target": "MARKDOWN / CLEAR"},
        "SKU-BEV-003": {"on_hand": 1400, "on_order": 0, "status_target": "MARKDOWN / CLEAR"},
        "SKU-SNK-003": {"on_hand": 2400, "on_order": 100, "status_target": "MARKDOWN / CLEAR"},
        "SKU-PER-004": {"on_hand": 1950, "on_order": 0, "status_target": "MARKDOWN / CLEAR"},
        "SKU-PER-005": {"on_hand": 820, "on_order": 0, "status_target": "MARKDOWN / CLEAR"}, # Slow mover high inventory
        "SKU-HOU-003": {"on_hand": 1700, "on_order": 0, "status_target": "MARKDOWN / CLEAR"},
        "SKU-HOU-006": {"on_hand": 1500, "on_order": 0, "status_target": "MARKDOWN / CLEAR"},

        # WATCH / VOLATILE: High volatility, near lead time cushion
        "SKU-BEV-001": {"on_hand": 270, "on_order": 0, "status_target": "WATCH / VOLATILE"},
        "SKU-SNK-004": {"on_hand": 120, "on_order": 50, "status_target": "WATCH / VOLATILE"}, # High festive volatility
        "SKU-PER-003": {"on_hand": 250, "on_order": 0, "status_target": "WATCH / VOLATILE"},
        "SKU-PER-006": {"on_hand": 210, "on_order": 0, "status_target": "WATCH / VOLATILE"},
        "SKU-GRO-006": {"on_hand": 260, "on_order": 30, "status_target": "WATCH / VOLATILE"},
        "SKU-SNK-002": {"on_hand": 240, "on_order": 0, "status_target": "WATCH / VOLATILE"},

        # HEALTHY: Perfectly balanced 4 to 7 weeks supply
        "SKU-GRO-002": {"on_hand": 1250, "on_order": 200, "status_target": "HEALTHY"},
        "SKU-GRO-004": {"on_hand": 720, "on_order": 100, "status_target": "HEALTHY"},
        "SKU-BEV-005": {"on_hand": 450, "on_order": 0, "status_target": "HEALTHY"},
        "SKU-BEV-006": {"on_hand": 680, "on_order": 100, "status_target": "HEALTHY"},
        "SKU-SNK-005": {"on_hand": 820, "on_order": 0, "status_target": "HEALTHY"},
        "SKU-SNK-006": {"on_hand": 380, "on_order": 50, "status_target": "HEALTHY"},
        "SKU-PER-001": {"on_hand": 620, "on_order": 80, "status_target": "HEALTHY"},
        "SKU-HOU-001": {"on_hand": 790, "on_order": 100, "status_target": "HEALTHY"},
        "SKU-HOU-004": {"on_hand": 860, "on_order": 0, "status_target": "HEALTHY"},
        "SKU-HOU-005": {"on_hand": 980, "on_order": 120, "status_target": "HEALTHY"}
    }

    rows = []
    for p in PRODUCTS:
        sku = p["sku_id"]
        prof = inventory_profiles.get(sku, {"on_hand": int(p["base_demand"] * 5), "on_order": 0})
        on_hand = prof["on_hand"]
        on_order = prof["on_order"]
        lead_time = p["lead_time_wks"]

        # Safety stock calculation based on 95% service level factor (Z=1.65) * std_dev * sqrt(lead_time)
        weekly_std = p["base_demand"] * p["volatility"]
        safety_stock = int(math.ceil(1.65 * weekly_std * math.sqrt(lead_time)))

        reorder_point = int(math.ceil((p["base_demand"] * lead_time) + safety_stock))
        batch_moq = p["moq"]

        rows.append([
            sku, p["name"], p["category"], on_hand, on_order,
            lead_time, safety_stock, reorder_point, batch_moq,
            "2025-12-29"
        ])

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "sku_id", "product_name", "category", "on_hand_inventory", "on_order_inventory",
            "lead_time_weeks", "safety_stock_units", "reorder_point_units", "minimum_order_qty",
            "as_of_date"
        ])
        writer.writerows(rows)

    print(f"Created inventory status: {path} ({len(rows)} SKUs)")

if __name__ == "__main__":
    print("Initializing DEMANDWISE Raw & Processed Datasets...")
    generate_catalog()
    generate_calendar()
    generate_sales_and_weekly_demand()
    generate_inventory_status()
    print("All datasets generated successfully!")
