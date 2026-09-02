import React, { useState } from "react";
import { ForecastPoint } from "../types";

interface DemandChartProps {
  data: ForecastPoint[];
  skuName?: string;
  leadTimeWeeks?: number;
}

export const DemandChart: React.FC<DemandChartProps> = ({ data, skuName, leadTimeWeeks = 2 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm">
        No forecast data available
      </div>
    );
  }

  // Chart dimensions
  const width = 760;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max value for Y scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(Number(d.ml_demand_forecast), Number(d.baseline_naive_forecast))),
    50
  ) * 1.15;

  const minVal = 0;

  // Coordinate mappers
  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padding.top + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight;
  };

  // Build SVG path strings
  const mlPoints = data.map((d, i) => `${getX(i)},${getY(Number(d.ml_demand_forecast))}`);
  const mlPath = `M ${mlPoints.join(" L ")}`;

  const naivePoints = data.map((d, i) => `${getX(i)},${getY(Number(d.baseline_naive_forecast))}`);
  const naivePath = `M ${naivePoints.join(" L ")}`;

  // Area under ML curve
  const mlAreaPath = `${mlPath} L ${getX(data.length - 1)},${getY(0)} L ${getX(0)},${getY(0)} Z`;

  return (
    <div className="bg-white border border-[#dee2e6] rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
            <span>8-Week Forward Demand Curve {skuName ? `• ${skuName}` : ""}</span>
          </h3>
          <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
            DEMANDWISE ML Forecaster vs 52-Week Seasonal-Naive Baseline
          </p>
        </div>

        {/* High Density Legend */}
        <div className="flex items-center gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#1e3a8a] rounded-xs"></span>
            <span className="text-[#1a1a1a]">ML FORECAST</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 border-t-2 border-dashed border-[#adb5bd]"></span>
            <span className="text-[#6c757d]">SEASONAL-NAIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#adb5bd]">
            <span className="w-2 h-2 rounded-xs bg-[#1e3a8a]/15 border border-[#1e3a8a]/40"></span>
            <span>LEAD TIME ({leadTimeWeeks}W)</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="mlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + plotHeight * (1 - ratio);
            const labelVal = Math.round(minVal + (maxVal - minVal) * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f3f5"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-[#adb5bd] font-mono font-bold"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Lead Time Shading Area */}
          {leadTimeWeeks > 0 && leadTimeWeeks <= data.length && (
            <rect
              x={getX(0)}
              y={padding.top}
              width={getX(Math.min(leadTimeWeeks - 1, data.length - 1)) - getX(0)}
              height={plotHeight}
              fill="#1e3a8a"
              fillOpacity="0.04"
            />
          )}

          {/* ML Area fill */}
          <path d={mlAreaPath} fill="url(#mlGradient)" />

          {/* Seasonal Naive Line (Dashed) */}
          <path
            d={naivePath}
            fill="none"
            stroke="#adb5bd"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* ML Curve Line (Solid) */}
          <path
            d={mlPath}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const mlX = getX(i);
            const mlY = getY(Number(d.ml_demand_forecast));
            const isHovered = hoverIndex === i;

            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                {/* Vertical hover crosshair */}
                {isHovered && (
                  <line
                    x1={mlX}
                    y1={padding.top}
                    x2={mlX}
                    y2={padding.top + plotHeight}
                    stroke="#dee2e6"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={mlX}
                  cy={mlY}
                  r={isHovered ? 5 : 3}
                  fill={isHovered ? "#1e3a8a" : "#ffffff"}
                  stroke="#1e3a8a"
                  strokeWidth="2"
                />

                {/* X-axis week label */}
                <text
                  x={mlX}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold ${isHovered ? "fill-[#1e3a8a]" : "fill-[#6c757d]"}`}
                >
                  W{d.forecast_week_num}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white text-xs px-3.5 py-2 rounded-lg shadow-lg border border-[#334155] pointer-events-none z-20 flex gap-4"
          >
            <div>
              <span className="text-[#94a3b8] block text-[9px] font-bold uppercase">Week {data[hoverIndex].forecast_week_num}</span>
              <span className="text-emerald-400 font-bold font-mono">
                ML: {data[hoverIndex].ml_demand_forecast} units
              </span>
            </div>
            <div className="border-l border-[#334155] pl-3">
              <span className="text-[#94a3b8] block text-[9px] font-bold uppercase">Baseline Naive</span>
              <span className="text-amber-400 font-mono font-bold">
                {data[hoverIndex].baseline_naive_forecast} units
              </span>
            </div>
            <div className="border-l border-[#334155] pl-3">
              <span className="text-[#94a3b8] block text-[9px] font-bold uppercase">Revenue Proj.</span>
              <span className="text-white font-mono font-bold">
                ₹{Number(data[hoverIndex].projected_revenue_inr).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
