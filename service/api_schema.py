"""
DEMANDWISE – D6 Deployed Scoring Service API Schemas
Data models for single SKU and batch scoring requests and responses.
"""

from typing import List, Optional
import math

class SKUInput:
    def __init__(self, sku_id: str, product_name: str, category: str, on_hand: int,
                 on_order: int, lead_time_weeks: int, safety_stock: int, moq: int,
                 unit_cost_inr: float, unit_price_inr: float, avg_weekly_demand: float,
                 demand_cv: float = 0.25, is_promo: int = 0):
        self.sku_id = str(sku_id).strip()
        self.product_name = str(product_name).strip()
        self.category = str(category).strip()
        self.on_hand = max(0, int(on_hand))
        self.on_order = max(0, int(on_order))
        self.lead_time_weeks = max(1, int(lead_time_weeks))
        self.safety_stock = max(0, int(safety_stock))
        self.moq = max(1, int(moq))
        self.unit_cost_inr = max(0.01, float(unit_cost_inr))
        self.unit_price_inr = max(0.01, float(unit_price_inr))
        self.avg_weekly_demand = max(1.0, float(avg_weekly_demand))
        self.demand_cv = max(0.0, float(demand_cv))
        self.is_promo = int(is_promo)

    @classmethod
    def from_dict(cls, d: dict):
        if "sku_id" not in d:
            raise ValueError("Missing required field: sku_id")
        return cls(
            sku_id=d["sku_id"],
            product_name=d.get("product_name", d["sku_id"]),
            category=d.get("category", "General"),
            on_hand=int(d.get("on_hand", 0)),
            on_order=int(d.get("on_order", 0)),
            lead_time_weeks=int(d.get("lead_time_weeks", 2)),
            safety_stock=int(d.get("safety_stock", 20)),
            moq=int(d.get("moq", 25)),
            unit_cost_inr=float(d.get("unit_cost_inr", 100.0)),
            unit_price_inr=float(d.get("unit_price_inr", 150.0)),
            avg_weekly_demand=float(d.get("avg_weekly_demand", 80.0)),
            demand_cv=float(d.get("demand_cv", 0.25)),
            is_promo=int(d.get("is_promo", 0))
        )

class ScoringResult:
    def __init__(self, sku_id: str, product_name: str, risk_status: str,
                 weeks_of_supply: float, recommended_action: str,
                 recommended_order_qty: int, potential_lost_sales_inr: float,
                 excess_capital_locked_inr: float, markdown_exposure_inr: float,
                 forward_8_weeks_forecast: List[float]):
        self.sku_id = sku_id
        self.product_name = product_name
        self.risk_status = risk_status
        self.weeks_of_supply = round(weeks_of_supply, 1)
        self.recommended_action = recommended_action
        self.recommended_order_qty = recommended_order_qty
        self.potential_lost_sales_inr = round(potential_lost_sales_inr, 2)
        self.excess_capital_locked_inr = round(excess_capital_locked_inr, 2)
        self.markdown_exposure_inr = round(markdown_exposure_inr, 2)
        self.forward_8_weeks_forecast = [round(f, 1) for f in forward_8_weeks_forecast]

    def to_dict(self):
        return {
            "sku_id": self.sku_id,
            "product_name": self.product_name,
            "risk_status": self.risk_status,
            "weeks_of_supply": self.weeks_of_supply,
            "recommended_action": self.recommended_action,
            "recommended_order_qty": self.recommended_order_qty,
            "potential_lost_sales_inr": self.potential_lost_sales_inr,
            "excess_capital_locked_inr": self.excess_capital_locked_inr,
            "markdown_exposure_inr": self.markdown_exposure_inr,
            "forward_8_weeks_forecast": self.forward_8_weeks_forecast
        }
