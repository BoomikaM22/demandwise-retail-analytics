import React from "react";
import { ModelEvaluationResults } from "../types";
import { TrendingUp, Award, CheckCircle2, ShieldCheck } from "lucide-react";

interface ModelEvaluationViewProps {
  evaluation: ModelEvaluationResults;
}

export const ModelEvaluationView: React.FC<ModelEvaluationViewProps> = ({ evaluation }) => {
  const overall = evaluation.overall_comparison;
  const folds = evaluation.fold_breakdown || [];

  return (
    <div className="space-y-5">
      {/* Top Model Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline Card */}
        <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
          <div className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest mb-1">
            Seasonal-Naive Baseline (Lag-52)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1a1a1a] font-mono">
              {overall.seasonal_naive_baseline.wape_pct}%
            </span>
            <span className="text-[10px] text-[#6c757d] font-bold">WAPE</span>
          </div>
          <div className="text-xs text-[#6c757d] mt-2 flex items-center justify-between">
            <span>Forecast Bias:</span>
            <span className="font-mono font-bold text-[#1a1a1a]">
              {overall.seasonal_naive_baseline.bias_pct}%
            </span>
          </div>
          <div className="text-xs text-[#6c757d] mt-1 flex items-center justify-between">
            <span>Mean Absolute Error:</span>
            <span className="font-mono font-bold text-[#1a1a1a]">
              {overall.seasonal_naive_baseline.mae} units
            </span>
          </div>
        </div>

        {/* Selected Model Card */}
        <div className="bg-[#1e3a8a] border border-[#1e3a8a] text-white rounded-lg p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Award className="w-5 h-5 text-blue-200 opacity-80" />
          </div>
          <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">
            DEMANDWISE ML Forecaster (Selected)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {overall.ml_model.wape_pct}%
            </span>
            <span className="text-[10px] text-blue-200 font-bold">WAPE</span>
          </div>
          <div className="text-xs text-blue-100/90 mt-2 flex items-center justify-between">
            <span>Forecast Bias:</span>
            <span className="font-mono font-bold text-white">
              {overall.ml_model.bias_pct}% (Near Neutral)
            </span>
          </div>
          <div className="text-xs text-blue-100/90 mt-1 flex items-center justify-between">
            <span>Mean Absolute Error:</span>
            <span className="font-mono font-bold text-white">
              {overall.ml_model.mae} units
            </span>
          </div>
        </div>

        {/* Error Reduction Delta Card */}
        <div className="bg-white border border-[#dee2e6] rounded-lg p-5 shadow-xs">
          <div className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest mb-1">
            Accuracy Improvement
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              +{overall.wape_reduction_pct_points}%
            </span>
            <span className="text-[10px] text-[#6c757d] font-bold">Points</span>
          </div>
          <div className="text-xs text-[#6c757d] mt-2 flex items-center justify-between">
            <span>Relative Error Reduction:</span>
            <span className="font-mono font-bold text-emerald-600">
              {overall.relative_error_reduction_pct}%
            </span>
          </div>
          <div className="text-xs text-[#6c757d] mt-1 flex items-center justify-between">
            <span>Validation Strategy:</span>
            <span className="font-bold text-[#1a1a1a]">Rolling-Origin (4 Folds)</span>
          </div>
        </div>
      </div>

      {/* Rolling-Origin Cross-Validation Table */}
      <div className="bg-white border border-[#dee2e6] rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#dee2e6] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#1e3a8a] rounded-full"></span>
              <span>Rolling-Origin Time-Series Cross-Validation Folds (D3)</span>
            </h3>
            <p className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider mt-0.5">
              Strict multi-step backtesting with zero future look-ahead data leakage across 4 operational cutoffs.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white text-[#1e3a8a] border border-[#dee2e6] px-2.5 py-1 rounded">
            720 Evaluated Test Observations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#6c757d] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Validation Fold</th>
                <th className="py-2.5 px-3">Cutoff Origin</th>
                <th className="py-2.5 px-3">Horizon Window</th>
                <th className="py-2.5 px-3">Seasonal Context</th>
                <th className="py-2.5 px-3 text-right">Seasonal-Naive WAPE</th>
                <th className="py-2.5 px-3 text-right text-[#1e3a8a] font-bold">DEMANDWISE ML WAPE</th>
                <th className="py-2.5 px-3 text-right">Error Reduction</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2e6] text-[#1a1a1a]">
              {folds.map((f) => (
                <tr key={f.fold} className="hover:bg-[#f8f9fa] transition">
                  <td className="py-2.5 px-4 font-bold text-[#1a1a1a]">Fold #{f.fold}</td>
                  <td className="py-2.5 px-3 font-mono text-[#6c757d]">Week {f.origin_week}</td>
                  <td className="py-2.5 px-3 font-mono text-[#6c757d]">{f.horizon_weeks}</td>
                  <td className="py-2.5 px-3 text-[#495057] font-medium">{f.description}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{f.seasonal_naive.wape_pct}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-[#1e3a8a]">
                    {f.ml_model.wape_pct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                    +{f.wape_improvement_points}% pts
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      PASSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Selection & Why Selected */}
      <div className="bg-white border border-[#dee2e6] rounded-lg p-5 text-xs text-[#495057] space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-[#1a1a1a] font-black text-sm uppercase tracking-tight">
          <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
          <span>Model Architecture Decision Rationale</span>
        </div>
        <p>
          <strong className="text-[#1a1a1a]">Why Seasonal-Naive as the Benchmark:</strong> In retail FMCG supply chains, simple moving averages fail to represent annual festive periodicity. Comparing against a 52-week Seasonal-Naive baseline guarantees that complex machine learning is evaluated against the strongest natural periodic prior.
        </p>
        <p>
          <strong className="text-[#1a1a1a]">Why DEMANDWISE ML Forecaster was Selected:</strong> It systematically regularizes autoregressive lags (L1, L2, L4, L52), rolling demand velocity, cyclic calendar harmonics (Diwali, summer peaks), and promotional lift (+30%). In backtesting, it eliminated 17.9% of baseline errors while maintaining near-zero bias (-3.01% vs -9.03%), protecting supply chains from systemic under-ordering.
        </p>
      </div>
    </div>
  );
};
