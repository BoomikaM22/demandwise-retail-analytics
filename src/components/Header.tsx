import React from "react";
import { 
  BarChart3, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  Terminal, 
  FileText, 
  CheckCircle2, 
  Sliders
} from "lucide-react";

export type NavTab = 
  | "overview" 
  | "forecasting" 
  | "risk-grid" 
  | "simulator" 
  | "scoring-api" 
  | "reports" 
  | "acceptance";

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  totalSkus: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, totalSkus }) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "overview", label: "Executive Overview", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "forecasting", label: "Demand Forecast & WAPE", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "risk-grid", label: "Inventory Risk Grid", icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: `${totalSkus}` },
    { id: "simulator", label: "What-If Simulator", icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: "scoring-api", label: "Scoring Service (D6)", icon: <Terminal className="w-3.5 h-3.5" />, badge: "REST" },
    { id: "reports", label: "Executive Readout (D7)", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "acceptance", label: "Zidio Acceptance", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
  ];

  return (
    <header className="bg-white border-b border-[#dee2e6] text-[#1a1a1a] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1e3a8a] text-white p-2 rounded flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-black tracking-tight text-[#1a1a1a]">
                DEMAND<span className="text-[#1e3a8a]">WISE</span>
              </h1>
              <div className="h-6 w-px bg-[#dee2e6] mx-3"></div>
              <span className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider hidden sm:inline-block">
                Retail Analytics Engine
              </span>
            </div>
          </div>

          {/* High Density Context Filters & System status */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex flex-col px-3 border-r border-[#dee2e6]">
              <span className="text-[10px] text-[#adb5bd] uppercase font-bold">Category</span>
              <span className="text-xs font-bold text-[#1a1a1a]">30 Active SKUs</span>
            </div>
            <div className="hidden md:flex flex-col px-3 border-r border-[#dee2e6]">
              <span className="text-[10px] text-[#adb5bd] uppercase font-bold">Horizon</span>
              <span className="text-xs font-bold text-[#1a1a1a]">8 Weeks (D3)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f8f9fa] border border-[#dee2e6] rounded text-xs font-bold font-mono text-[#1e3a8a]">
              <span>₹ INR Base</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="hidden sm:inline">LIVE</span>
            </div>
          </div>
        </div>

        {/* High Density Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-1.5 border-t border-[#dee2e6] scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#1e3a8a] text-white shadow-xs"
                    : "text-[#6c757d] hover:text-[#1a1a1a] hover:bg-[#f8f9fa]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#dee2e6] text-[#495057]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
