export type RiskStatus = "REORDER NOW" | "MARKDOWN / CLEAR" | "WATCH / VOLATILE" | "HEALTHY";

export interface ScoredSKU {
  sku_id: string;
  product_name: string;
  category: string;
  on_hand_inventory: number;
  on_order_inventory: number;
  lead_time_weeks: number;
  safety_stock_units: number;
  reorder_point_units: number;
  minimum_order_qty: number;
  avg_forward_weekly_demand: number;
  weeks_of_supply: number;
  demand_cv: number;
  unit_cost_inr: number;
  unit_selling_price_inr: number;
  risk_status: RiskStatus;
  recommended_order_qty: number;
  primary_driver: string;
  recommended_action: string;
  potential_lost_sales_inr: number;
  excess_capital_locked_inr: number;
  markdown_exposure_inr: number;
}

export interface InventoryFinancials {
  total_potential_lost_sales_inr: number;
  total_excess_capital_locked_inr: number;
  total_markdown_exposure_inr: number;
  total_working_capital_at_risk_inr: number;
}

export interface InventorySummary {
  as_of_date: string;
  total_skus_evaluated: number;
  status_distribution: Record<RiskStatus, number>;
  financial_impact_inr: InventoryFinancials;
  category_risk_rollup: Record<string, any>;
  scored_skus: ScoredSKU[];
}

export interface ModelMetrics {
  record_count: number;
  wape_pct: number;
  mae: number;
  bias_pct: number;
  rmse: number;
}

export interface EvaluationFold {
  fold: number;
  origin_week: number;
  horizon_weeks: string;
  description: string;
  test_records: number;
  seasonal_naive: ModelMetrics;
  ml_model: ModelMetrics;
  wape_improvement_points: number;
}

export interface ModelEvaluationResults {
  summary: {
    validation_method: string;
    number_of_folds: number;
    total_test_evaluations: number;
    primary_metric: string;
    selected_model: string;
    model_decision_rationale: string;
  };
  overall_comparison: {
    seasonal_naive_baseline: ModelMetrics;
    ml_model: ModelMetrics;
    wape_reduction_pct_points: number;
    relative_error_reduction_pct: number;
  };
  fold_breakdown: EvaluationFold[];
}

export interface BusinessInsight {
  id: string;
  title: string;
  finding: string;
  quantitative_metric: string;
  business_impact: string;
  recommendation: string;
}

export interface CategorySummary {
  category: string;
  total_revenue_inr: number;
  revenue_share_pct: number;
  total_units_sold: number;
  sku_count: number;
  avg_units_per_sku: number;
}

export interface EDASummary {
  dataset_summary: {
    total_records: number;
    sku_count: number;
    categories_count: number;
    total_units_sold: number;
    total_revenue_inr: number;
    date_range_weeks: string;
    average_weekly_revenue_inr: number;
    promotional_lift_pct: number;
  };
  category_summary: CategorySummary[];
  top_5_movers: any[];
  slow_5_movers: any[];
  business_insights: BusinessInsight[];
  weekly_trend: {
    week_num: number;
    revenue_inr: number;
    units_demanded: number;
    is_holiday_week: number;
    active_promo_count: number;
  }[];
}

export interface ForecastPoint {
  sku_id: string;
  product_name: string;
  category: string;
  forecast_week_num: number;
  horizon_step: number;
  forecast_week_date: string;
  baseline_naive_forecast: number;
  ml_demand_forecast: number;
  projected_revenue_inr: number;
  unit_cost_inr: number;
  unit_selling_price_inr: number;
  is_promo_planned: number;
  is_holiday_planned: number;
}
