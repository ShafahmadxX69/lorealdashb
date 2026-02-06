
import React, { useState, useMemo } from 'react';
import { DashboardData, ProductionLineItem } from '../types';

interface DashboardProps {
  data: DashboardData;
  insights: string;
  isGeneratingInsights: boolean;
  onGenerateInsights: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, insights, isGeneratingInsights, onGenerateInsights }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    // Find indices of invoices that match the search term (e.g., "INV-250001")
    const matchingInvoiceIndices = data.invoices
      .map((inv, idx) => (
        inv.invoiceTitle.toLowerCase().includes(term) || 
        inv.brand.toLowerCase().includes(term)
      ) ? idx : -1)
      .filter(idx => idx !== -1);

    return data.items.filter(item => {
      const matchesBasic = 
        item.poNo.toLowerCase().includes(term) ||
        item.woNo.toLowerCase().includes(term) ||
        item.partNo.toLowerCase().includes(term) ||
        item.customer.toLowerCase().includes(term);
      
      // Check if this item has any quantity allocated to a matching invoice
      const matchesInvoice = matchingInvoiceIndices.some(idx => (item.invoiceQtys[idx] || 0) > 0);
      
      return matchesBasic || matchesInvoice;
    });
  }, [data.items, data.invoices, searchTerm]);

  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    data.items.forEach(i => {
      map[i.customer] = (map[i.customer] || 0) + i.poQty;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [data.items]);

  const topReworkItems = useMemo(() => {
    return [...data.items]
      .filter(item => item.reworkQty > 0)
      .sort((a, b) => b.reworkQty - a.reworkQty)
      .slice(0, 5);
  }, [data.items]);

  const productionRatio = (data.summary.totalStockIn / data.summary.totalPoQty) * 100;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-slate-900">PPIC</span> <span className="text-blue-600">BEST BASE</span>
          </h1>
          <p className="text-slate-500 font-medium">Production & Inventory Real-time Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Sync Active</span>
          </div>
          <button 
            onClick={onGenerateInsights}
            disabled={isGeneratingInsights}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            {isGeneratingInsights ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-robot"></i>}
            {isGeneratingInsights ? 'Analyzing...' : 'AI Insights'}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total PO Qty" value={data.summary.totalPoQty} icon="fa-shopping-cart" color="indigo" />
        <StatCard title="Total Stock In" value={data.summary.totalStockIn} icon="fa-box-open" color="emerald" />
        <StatCard title="Remaining" value={data.summary.totalRemaining} icon="fa-clock" color="amber" />
        <StatCard title="Rework Qty" value={data.summary.totalRework} icon="fa-tools" color="rose" />
        <StatCard title="Inventory" value={data.summary.totalInventory} icon="fa-warehouse" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-chart-pie text-6xl text-indigo-600"></i>
              </div>
              <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6 self-start">Production Completion</h3>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#2563eb" strokeWidth="8" 
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * productionRatio) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">{Math.round(productionRatio)}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Achieved</span>
                </div>
              </div>
              <p className="mt-6 text-sm text-slate-500 text-center font-medium">
                {data.summary.totalStockIn.toLocaleString()} / {data.summary.totalPoQty.toLocaleString()} units
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest">High Rework Alerts</h3>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">Action Required</span>
              </div>
              <div className="space-y-4">
                {topReworkItems.length > 0 ? topReworkItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{item.partNo}</span>
                      <span className="text-[10px] text-slate-400">{item.woNo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-rose-500">{item.reworkQty} units</div>
                        <div className="text-[9px] text-slate-400">Rework</div>
                      </div>
                      <div className="w-1.5 h-8 bg-rose-50 rounded-full overflow-hidden">
                        <div 
                          className="w-full bg-rose-500" 
                          style={{ height: `${Math.min((item.reworkQty / item.poQty) * 100 * 5, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-400 italic text-sm">No significant rework detected</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-slate-800 font-bold">Line Items Registry</h3>
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Search PO, WO, Part, INV-, or Customer..."
                  className="bg-slate-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">PO / WO</th>
                    <th className="px-6 py-4">Customer / Item</th>
                    <th className="px-6 py-4">Part No</th>
                    <th className="px-6 py-4 text-center">Quantities (PO | In | Inv)</th>
                    <th className="px-6 py-4 text-center">Rework</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.slice(0, 50).map((item, idx) => {
                    const isCompleted = item.stockIn >= item.poQty;
                    const percent = Math.min((item.stockIn / item.poQty) * 100, 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.poNo}</div>
                          <div className="text-[10px] text-slate-400 font-mono uppercase">{item.woNo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700">{item.customer}</div>
                          <div className="text-xs text-slate-500">{item.itemType}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold border border-slate-200">{item.partNo}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100">
                              <div className="text-[9px] text-slate-400 uppercase font-black">PO</div>
                              <div className="font-bold text-slate-800">{item.poQty}</div>
                            </div>
                            <div className={`px-2 py-1 rounded border ${isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                              <div className="text-[9px] uppercase font-black opacity-60">In</div>
                              <div className="font-bold">{item.stockIn}</div>
                            </div>
                            <div className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded">
                              <div className="text-[9px] uppercase font-black opacity-60">Inv</div>
                              <div className="font-bold">{item.finishedGoodsInventory}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.reworkQty > 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-600 font-black text-[11px] border border-rose-100">
                              <i className="fas fa-tools text-[9px]"></i>
                              {item.reworkQty}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 min-w-[140px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center px-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {isCompleted ? 'COMPLETED' : 'NOT COMPLETED'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{Math.round(percent)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                              <div 
                                className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="p-16 text-center text-slate-400">
                  <div className="text-4xl mb-3"><i className="fas fa-search"></i></div>
                  <p className="italic">No records found for "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <i className="fas fa-brain text-8xl"></i>
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-sparkles text-blue-400"></i> AI Executive Summary
            </h3>
            {insights ? (
              <div className="text-sm leading-relaxed space-y-3 prose prose-invert max-w-none">
                {insights.split('\n').map((line, i) => (
                  <p key={i} className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{line.replace(/^[*-]\s*/, '')}</span>
                  </p>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <i className="fas fa-chart-line text-4xl mb-4 opacity-50 block"></i>
                <p className="text-sm">Click "AI Insights" to analyze current production trends and rework patterns.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Top Customers Volume</h3>
            <div className="space-y-4">
              {topCustomers.map(([name, val], idx) => {
                const percentage = (val / topCustomers[0][1]) * 100;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>{name}</span>
                      <span>{val.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000`} 
                        style={{ width: `${percentage}%`, backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][idx] }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Upcoming Exports</h3>
            <div className="space-y-4">
              {data.invoices.slice(0, 10).map((inv, idx) => (
                <div 
                  key={idx} 
                  className="flex gap-4 group cursor-pointer"
                  onClick={() => setSearchTerm(inv.invoiceTitle)}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${idx === 0 ? 'bg-blue-600 border-blue-200' : 'bg-slate-200 border-slate-100'}`}></div>
                    {idx < 9 && <div className="w-[2px] bg-slate-100 h-full mt-1"></div>}
                  </div>
                  <div className="pb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{inv.exportDate || 'TBD'}</div>
                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{inv.invoiceTitle}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{inv.brand}</div>
                    <div className="mt-2 flex items-center gap-3">
                       <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                         {inv.totalQty.toLocaleString()} units
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100',
    amber: 'bg-amber-50 text-amber-600 shadow-amber-100',
    rose: 'bg-rose-50 text-rose-600 shadow-rose-100',
    blue: 'bg-blue-50 text-blue-600 shadow-blue-100',
  };
  
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className={`w-10 h-10 ${colorMap[color]} rounded-2xl flex items-center justify-center mb-4 text-lg transition-transform group-hover:scale-110`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-black text-slate-800 mt-1">{value.toLocaleString()}</div>
    </div>
  );
};

export default Dashboard;
