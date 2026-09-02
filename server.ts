import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to safely read JSON files
function readJsonFile(relativePath: string, fallback: any = {}) {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${relativePath}:`, err);
  }
  return fallback;
}

// Helper to read CSV rows
function readCsvFile(relativePath: string): any[] {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.trim().split("\n");
      if (lines.length < 2) return [];
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      return lines.slice(1).map(line => {
        // Handle basic CSV splitting
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ""));
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"|"$/g, ""));

        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] !== undefined ? values[idx] : "";
        });
        return obj;
      });
    }
  } catch (err) {
    console.error(`Error reading CSV ${relativePath}:`, err);
  }
  return [];
}

// ----------------------------------------------------
// D6 REST API ENDPOINTS
// ----------------------------------------------------

// 1. Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "DEMANDWISE Retail Demand & Inventory Scoring Service",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// 2. Portfolio Summary & KPIs
app.get("/api/summary", (_req: Request, res: Response) => {
  const inventorySummary = readJsonFile("data/processed/inventory_summary.json", {});
  const evaluationResults = readJsonFile("data/processed/model_evaluation_results.json", {});
  const edaSummary = readJsonFile("data/processed/eda_summary.json", {});

  res.json({
    status: "success",
    inventorySummary,
    evaluationResults,
    edaDataset: edaSummary?.dataset_summary || {}
  });
});

// 3. All SKUs list with risk status & inventory details
app.get("/api/skus", (_req: Request, res: Response) => {
  const inventorySummary = readJsonFile("data/processed/inventory_summary.json", {});
  res.json({
    status: "success",
    skus: inventorySummary?.scored_skus || []
  });
});

// 4. Detailed SKU Profile & History
app.get("/api/sku/:skuId", (req: Request, res: Response) => {
  const { skuId } = req.params;
  const inventorySummary = readJsonFile("data/processed/inventory_summary.json", {});
  const allForecasts = readCsvFile("data/processed/forecast_output_6_8_weeks.csv");
  const allWeekly = readCsvFile("data/processed/weekly_sku_demand.csv");

  const skuInfo = inventorySummary?.scored_skus?.find((s: any) => s.sku_id === skuId);
  if (!skuInfo) {
    return res.status(404).json({ error: `SKU ${skuId} not found` });
  }

  const forwardForecast = allForecasts.filter((f: any) => f.sku_id === skuId);
  const historicalDemand = allWeekly.filter((w: any) => w.sku_id === skuId).map((w: any) => ({
    week_num: Number(w.week_num),
    week_date: w.week_start_date,
    demand: Number(w.units_demanded),
    revenue: Number(w.revenue_inr),
    is_promo: Number(w.is_promo) === 1,
    is_holiday: Number(w.is_holiday_week) === 1
  }));

  res.json({
    status: "success",
    sku: skuInfo,
    forwardForecast,
    historicalDemand
  });
});

// 5. EDA & Macro Insights
app.get("/api/eda", (_req: Request, res: Response) => {
  const edaSummary = readJsonFile("data/processed/eda_summary.json", {});
  res.json({
    status: "success",
    data: edaSummary
  });
});

// 6. Model Evaluation & Rolling-Origin CV
app.get("/api/evaluation", (_req: Request, res: Response) => {
  const evaluationResults = readJsonFile("data/processed/model_evaluation_results.json", {});
  res.json({
    status: "success",
    data: evaluationResults
  });
});

// 7. D6 Live Scoring Endpoint (Single SKU)
app.post("/api/score", (req: Request, res: Response) => {
  try {
    const {
      sku_id = "CUSTOM-SKU",
      product_name = "Custom Evaluation SKU",
      category = "General",
      on_hand = 0,
      on_order = 0,
      lead_time_weeks = 2,
      safety_stock = 25,
      moq = 50,
      unit_cost_inr = 100,
      unit_price_inr = 160,
      avg_weekly_demand = 80,
      demand_cv = 0.25,
      is_promo = 0
    } = req.body;

    const onHandNum = Math.max(0, Number(on_hand));
    const onOrderNum = Math.max(0, Number(on_order));
    const ltWeeks = Math.max(1, Number(lead_time_weeks));
    const ssUnits = Math.max(0, Number(safety_stock));
    const moqUnits = Math.max(1, Number(moq));
    const cost = Math.max(0.01, Number(unit_cost_inr));
    const price = Math.max(0.01, Number(unit_price_inr));
    const baseDemand = Math.max(1, Number(avg_weekly_demand));
    const cv = Math.max(0, Number(demand_cv));
    const promo = Number(is_promo) === 1 ? 1 : 0;

    // Project 8-week forward curve
    const forwardCurve: number[] = [];
    for (let h = 1; h <= 8; h++) {
      const seasonalFactor = 1.0 + 0.12 * Math.sin((h / 8.0) * Math.PI);
      const promoFactor = promo && (h === 1 || h === 2) ? 1.30 : 1.0;
      forwardCurve.push(Math.round(Math.max(5, baseDemand * seasonalFactor * promoFactor) * 10) / 10);
    }

    const avgForward = forwardCurve.reduce((a, b) => a + b, 0) / forwardCurve.length;
    const leadTimeDemand = forwardCurve.slice(0, ltWeeks).reduce((a, b) => a + b, 0);
    const totalAvailable = onHandNum + onOrderNum;
    const targetBuffer = leadTimeDemand + ssUnits;
    const weeksOfSupply = Math.round((onHandNum / avgForward) * 10) / 10;

    let riskStatus = "HEALTHY";
    let recommendedOrder = 0;
    let potentialLostSales = 0;
    let excessCapital = 0;
    let markdownExposure = 0;
    let action = "";

    if (totalAvailable < targetBuffer || weeksOfSupply < ltWeeks) {
      riskStatus = "REORDER NOW";
      const deficit = Math.max(0, targetBuffer - totalAvailable);
      recommendedOrder = Math.ceil(deficit / moqUnits) * moqUnits;
      recommendedOrder = Math.max(moqUnits, recommendedOrder);
      potentialLostSales = Math.round(deficit * price * 100) / 100;
      action = `Issue immediate PO for ${recommendedOrder} units (MOQ: ${moqUnits}). Current stock covers ${weeksOfSupply} weeks vs lead time ${ltWeeks} weeks.`;
    } else if (weeksOfSupply > 10.0) {
      riskStatus = "MARKDOWN / CLEAR";
      const excessUnits = Math.max(0, onHandNum - (avgForward * 6.0));
      excessCapital = Math.round(excessUnits * cost * 100) / 100;
      markdownExposure = Math.round(excessUnits * price * 0.30 * 100) / 100;
      action = `Overstocked! Weeks of supply (${weeksOfSupply} wks) exceeds 10-week ceiling. Halt reorders and launch a 25%-30% clearance discount.`;
    } else if (cv > 0.35 || weeksOfSupply <= ltWeeks + 1.5) {
      riskStatus = "WATCH / VOLATILE";
      potentialLostSales = Math.round(avgForward * 0.5 * price * 100) / 100;
      action = `High demand variance (CV: ${cv.toFixed(2)}) or tight safety cushion (WOS: ${weeksOfSupply} wks). Audit daily sell-through and maintain elevated buffer.`;
    } else {
      riskStatus = "HEALTHY";
      action = `Healthy stock position (${weeksOfSupply} weeks of supply). Current buffer comfortably secures lead time demand.`;
    }

    res.json({
      status: "success",
      result: {
        sku_id,
        product_name,
        category,
        risk_status: riskStatus,
        weeks_of_supply: weeksOfSupply,
        recommended_order_qty: recommendedOrder,
        potential_lost_sales_inr: potentialLostSales,
        excess_capital_locked_inr: excessCapital,
        markdown_exposure_inr: markdownExposure,
        recommended_action: action,
        forward_8_weeks_forecast: forwardCurve
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to score SKU" });
  }
});

// 8. D6 Live Batch Scoring Endpoint
app.post("/api/batch-score", (req: Request, res: Response) => {
  try {
    const items: any[] = req.body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Input 'items' must be a non-empty array" });
    }

    const results = items.map(item => {
      const onHandNum = Math.max(0, Number(item.on_hand || 0));
      const onOrderNum = Math.max(0, Number(item.on_order || 0));
      const ltWeeks = Math.max(1, Number(item.lead_time_weeks || 2));
      const ssUnits = Math.max(0, Number(item.safety_stock || 20));
      const moqUnits = Math.max(1, Number(item.moq || 25));
      const cost = Math.max(0.01, Number(item.unit_cost_inr || 100));
      const price = Math.max(0.01, Number(item.unit_price_inr || 150));
      const baseDemand = Math.max(1, Number(item.avg_weekly_demand || 60));
      const cv = Math.max(0, Number(item.demand_cv || 0.25));

      const wos = Math.round((onHandNum / baseDemand) * 10) / 10;
      const targetBuffer = (baseDemand * ltWeeks) + ssUnits;
      const totalAvailable = onHandNum + onOrderNum;

      let riskStatus = "HEALTHY";
      let recommendedOrder = 0;
      let potentialLostSales = 0;
      let excessCapital = 0;

      if (totalAvailable < targetBuffer || wos < ltWeeks) {
        riskStatus = "REORDER NOW";
        const deficit = Math.max(0, targetBuffer - totalAvailable);
        recommendedOrder = Math.ceil(deficit / moqUnits) * moqUnits;
        recommendedOrder = Math.max(moqUnits, recommendedOrder);
        potentialLostSales = Math.round(deficit * price * 100) / 100;
      } else if (wos > 10.0) {
        riskStatus = "MARKDOWN / CLEAR";
        const excess = Math.max(0, onHandNum - (baseDemand * 6.0));
        excessCapital = Math.round(excess * cost * 100) / 100;
      } else if (cv > 0.35 || wos <= ltWeeks + 1.5) {
        riskStatus = "WATCH / VOLATILE";
      }

      return {
        sku_id: item.sku_id || "SKU-UNKNOWN",
        product_name: item.product_name || "Product",
        risk_status: riskStatus,
        weeks_of_supply: wos,
        recommended_order_qty: recommendedOrder,
        potential_lost_sales_inr: potentialLostSales,
        excess_capital_locked_inr: excessCapital
      };
    });

    res.json({
      status: "success",
      total_scored: results.length,
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process batch score" });
  }
});

// 9. Documentation & Reports Endpoint
app.get("/api/reports/:reportId", (req: Request, res: Response) => {
  const { reportId } = req.params;
  const reportMap: Record<string, string> = {
    "eda": "reports/eda_data_quality_report.md",
    "executive": "reports/executive_readout.md",
    "viva": "reports/viva_demo_prep.md",
    "readme": "README.md"
  };

  const filePath = reportMap[reportId];
  if (!filePath) {
    return res.status(404).json({ error: `Report ${reportId} not found. Available: eda, executive, viva, readme` });
  }

  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), "utf-8");
    res.json({ status: "success", reportId, content });
  } catch (err) {
    res.status(500).json({ error: "Failed to read report file" });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE / SPA FALLBACK
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DEMANDWISE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
