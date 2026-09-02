import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeType?: "danger" | "warning" | "success" | "neutral";
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  badge,
  badgeType = "neutral",
  icon,
}) => {
  const badgeClasses = {
    danger: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    neutral: "bg-blue-50 text-[#1e3a8a] border-blue-200",
  }[badgeType];

  const valueClasses = {
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-700",
    neutral: "text-[#1e3a8a]",
  }[badgeType];

  return (
    <div className="bg-white border border-[#dee2e6] rounded-lg p-5 flex flex-col justify-between transition hover:border-[#ced4da]">
      <div className="flex items-center justify-between text-[#6c757d] mb-1">
        <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-widest">{title}</span>
        {icon && <div className="text-[#adb5bd]">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-2xl font-black tracking-tighter ${valueClasses}`}>{value}</span>
        {badge && (
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      {subtext && <p className="text-[10px] text-[#6c757d] font-semibold mt-2">{subtext}</p>}
    </div>
  );
};
