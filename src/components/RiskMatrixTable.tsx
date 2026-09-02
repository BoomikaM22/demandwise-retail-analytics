import React, { useState, useMemo } from "react";
import { ScoredSKU, RiskStatus } from "../types";
import { Search, ArrowUpDown, ShieldAlert, PackageCheck, AlertCircle, ShoppingCart } from "lucide-react";

interface RiskMatrixTableProps {
  skus: ScoredSKU[];
  onSelectSku: (sku: ScoredSKU) => void;
  selectedSkuId?: string;
}

export const RiskMatrixTable: React.FC<RiskMatrixTableProps> = ({
  skus,
  onSelectSku,
  selectedSkuId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"lost_sales" | "excess_capital" | "wos" | "sku">("lost_sales");
  const [sortAsc, setSortAsc] = useState(false);

  const categories = useMemo(() => {
    return ["ALL", ...Array.from(new Set(skus.map((s) => s.category)))];
  }, [skus]);

  const statuses: (RiskStatus | "ALL")[] = ["ALL", "REORDER NOW", "MARKDOWN / CLEAR", "WATCH / VOLATILE", "HEALTHY"];

  const filteredSkus = useMemo(() => {
    return skus.filter((item) => {
      const matchesSearch =
        item.sku_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesStat = selectedStatus === "ALL" || item.risk_status === selectedStatus;
      return matchesSearch && matchesCat && matchesStat;
    });
  }, [skus, searchTerm, selectedCategory, selectedStatus]);

  const sortedSkus = useMemo(() => {
    return [...filteredSkus].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === "lost_sales") {
        valA = a.potential_lost_sales_inr;
        valB = b.potential_lost_sales_inr;
      } else if (sortBy === "excess_capital") {
        valA = a.excess_capital_locked_inr;
        valB = b.excess_capital_locked_inr;
      } else if (sortBy === "wos") {
        valA = a.weeks_of_supply;
        valB = b.weeks_of_supply;
      } else {
        return sortAsc ? a.sku_id.localeCompare(b.sku_id) : b.sku_id.localeCompare(a.sku_id);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredSkus, sortBy, sortAsc]);

  const toggleSort = (col: "lost_sales" | "excess_capital" | "wos" | "sku") => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  const statusBadge = (status: RiskStatus) => {
    switch (status) {
      case "REORDER NOW":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            <ShoppingCart className="w-2.5 h-2.5 text-red-600" />
            REORDER NOW
          </span>
        );
      case "MARKDOWN / CLEAR":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
            <AlertCircle className="w-2.5 h-2.5 text-indigo-600" />
            MARKDOWN
          </span>
        );
      case "WATCH / VOLATILE":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
            WATCH LIST
          </span>
        );
      case "HEALTHY":
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            <PackageCheck className="w-2.5 h-2.5 text-emerald-600" />
            HEALTHY
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#dee2e6] rounded-lg shadow-xs overflow-hidden">
      {/* Control Bar: Filters, Category, Search */}
      <div className="p-3 border-b border-[#dee2e6] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#adb5bd] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-[#dee2e6] rounded focus:outline-none focus:border-[#1e3a8a] text-[#1a1a1a] font-medium"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-white border border-[#dee2e6] rounded px-2.5 py-1 focus:outline-none focus:border-[#1e3a8a] text-[#1a1a1a] font-medium cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-[#dee2e6] rounded px-2.5 py-1 focus:outline-none focus:border-[#1e3a8a] text-[#1a1a1a] font-medium cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Action Statuses" : s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">
          Showing <strong className="text-[#1a1a1a] font-black">{sortedSkus.length}</strong> of {skus.length} SKUs
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#dee2e6] text-[10px] font-black uppercase text-[#6c757d] bg-[#f8f9fa]">
              <th className="py-2.5 px-3 cursor-pointer hover:text-[#1a1a1a]" onClick={() => toggleSort("sku")}>
                <div className="flex items-center gap-1">
                  <span>SKU & Product Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">On Hand</th>
              <th className="py-2.5 px-3 text-right">On Order</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1a1a1a]" onClick={() => toggleSort("wos")}>
                <div className="flex items-center justify-end gap-1">
                  <span>WOS</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Lead Time</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1a1a1a]" onClick={() => toggleSort("lost_sales")}>
                <div className="flex items-center justify-end gap-1 text-red-600">
                  <span>Lost Sales (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-[#1a1a1a]" onClick={() => toggleSort("excess_capital")}>
                <div className="flex items-center justify-end gap-1 text-amber-600">
                  <span>Excess Capital (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium divide-y divide-[#f8f9fa]">
            {sortedSkus.map((sku) => {
              const isSelected = sku.sku_id === selectedSkuId;
              return (
                <tr
                  key={sku.sku_id}
                  onClick={() => onSelectSku(sku)}
                  className={`border-b border-[#f8f9fa] hover:bg-[#f8f9fa] cursor-pointer transition ${
                    isSelected ? "bg-[#1e3a8a]/5 font-semibold" : ""
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="font-mono font-bold text-[#1a1a1a]">{sku.sku_id}</div>
                    <div className="text-[11px] text-[#6c757d] truncate max-w-[200px]">{sku.product_name}</div>
                  </td>
                  <td className="py-2 px-3 text-[#6c757d]">{sku.category}</td>
                  <td className="py-2 px-3">{statusBadge(sku.risk_status)}</td>
                  <td className="py-2 px-3 text-right font-mono">{sku.on_hand_inventory}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#6c757d]">
                    {sku.on_order_inventory > 0 ? `+${sku.on_order_inventory}` : "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        sku.weeks_of_supply < sku.lead_time_weeks
                          ? "bg-red-100 text-red-700"
                          : sku.weeks_of_supply > 10
                          ? "bg-amber-100 text-amber-800"
                          : "text-[#1a1a1a]"
                      }`}
                    >
                      {sku.weeks_of_supply.toFixed(1)}w
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[#6c757d]">{sku.lead_time_weeks}w</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                    {sku.potential_lost_sales_inr > 0
                      ? `₹${sku.potential_lost_sales_inr.toLocaleString("en-IN")}`
                      : "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">
                    {sku.excess_capital_locked_inr > 0
                      ? `₹${sku.excess_capital_locked_inr.toLocaleString("en-IN")}`
                      : "-"}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSku(sku);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold rounded bg-[#1e3a8a] hover:bg-[#1e40af] text-white transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
            {sortedSkus.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#adb5bd] text-xs font-semibold">
                  No SKUs match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
