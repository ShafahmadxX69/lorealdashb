
import React, { useState, useMemo } from 'react';
import { DashboardData, ProductionLineItem, InvoiceMetadata } from '../types';

interface DashboardProps {
  data: DashboardData;
  insights: string;
  isGeneratingInsights: boolean;
  onGenerateInsights: () => void;
  onRefresh: () => void;
}

type Language = 'en' | 'zh' | 'id';

/**
 * Robust date parser for common spreadsheet formats like DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD
 */
const parseSpreadsheetDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Try standard parsing
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY or D/M/YYYY
  const parts = dateStr.split(/[/.-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    if (parts[0].length === 4) {
      d = new Date(year, month, day);
    } else {
      const fullYear = year < 100 ? 2000 + year : year;
      d = new Date(fullYear, month, day);
    }
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const translations = {
  en: {
    ppic: 'PPIC',
    bestBase: 'BEST BASE',
    subtitle: 'Production & Inventory Real-time Intelligence',
    live: 'Live Sync Active',
    aiInsights: 'AI Insights',
    analyzing: 'Analyzing...',
    totalPo: 'Total PO Qty',
    totalIn: 'Total Stock In',
    remaining: 'Remaining',
    rework: 'Rework Qty',
    inventory: 'Inventory',
    productionCompletion: 'Production Completion',
    achieved: 'Achieved',
    highReworkAlerts: 'High Rework Alerts',
    actionRequired: 'Action Required',
    noRework: 'No significant rework detected',
    registry: 'Line Items Registry',
    search: 'Search PO, WO, Part, INV-, or Customer...',
    powo: 'PO / WO',
    customerItem: 'Customer / Item',
    partNo: 'Part No',
    quantities: 'Quantities (PO | In | Inv)',
    status: 'Status',
    completed: 'COMPLETED',
    notCompleted: 'NOT COMPLETED',
    aiSummary: 'AI Executive Summary',
    clickInsights: 'Click "AI Insights" to analyze current production trends.',
    topCustomers: 'Top Customers Volume',
    upcomingExports: 'Upcoming Exports',
    units: 'units',
    refresh: 'Refresh',
    language: 'Language',
    analytics: 'Analytics & Trends',
    exportBrandDist: 'Export Volume by Brand',
    shipmentTimeline: 'Shipment Qty History',
    productionByBrand: 'Production by Brand (Stock In)',
    noData: 'No data available',
    brandReport: 'Global Brand Performance Report',
    completion: 'Completion',
    shipProgress: 'Ship Progress',
    filterMonth: 'Filter Month',
    allMonths: 'All Months'
  },
  zh: {
    ppic: '生产计划',
    bestBase: 'BEST BASE',
    subtitle: '生产与库存实时智能系统',
    live: '实时同步激活',
    aiInsights: 'AI 见解',
    analyzing: '分析中...',
    totalPo: '总采购量',
    totalIn: '总进货量',
    remaining: '剩余量',
    rework: '返工数量',
    inventory: '库存',
    productionCompletion: '生产完成率',
    achieved: '已达成',
    highReworkAlerts: '高返工警报',
    actionRequired: '需要采取行动',
    noRework: '未检测到重大返工',
    registry: '行项目注册表',
    search: '搜索 PO、WO、零件、INV- 或客户...',
    powo: '采购单 / 工单',
    customerItem: '客户 / 项目',
    partNo: '零件编号',
    quantities: '数量 (PO | 进货 | 库存)',
    status: '状态',
    completed: '已完成',
    notCompleted: '未完成',
    aiSummary: 'AI 执行摘要',
    clickInsights: '点击“AI 见解”分析当前生产趋势。',
    topCustomers: '主要客户成交量',
    upcomingExports: '即将出口',
    units: '个',
    refresh: '刷新',
    language: '语言',
    analytics: '分析与趋势',
    exportBrandDist: '各品牌出口量',
    shipmentTimeline: '出货数量历史',
    productionByBrand: '各品牌产量 (进货)',
    noData: '暂无数据',
    brandReport: '全球品牌绩效报告',
    completion: '完成率',
    shipProgress: '发货进度',
    filterMonth: '过滤月份',
    allMonths: '所有月份'
  },
  id: {
    ppic: 'PPIC',
    bestBase: 'BEST BASE',
    subtitle: 'Intelijen Real-time Produksi & Inventaris',
    live: 'Sinkronisasi Hidup',
    aiInsights: 'Wawasan AI',
    analyzing: 'Menganalisis...',
    totalPo: 'Total Qty PO',
    totalIn: 'Total Stock In',
    remaining: 'Sisa',
    rework: 'Qty Rework',
    inventory: 'Inventaris',
    productionCompletion: 'Penyelesaian Produksi',
    achieved: 'Tercapai',
    highReworkAlerts: 'Peringatan Rework Tinggi',
    actionRequired: 'Tindakan Diperlukan',
    noRework: 'Tidak ada rework signifikan terdeteksi',
    registry: 'Daftar Item Produksi',
    search: 'Cari PO, WO, Part, INV-, atau Pelanggan...',
    powo: 'PO / WO',
    customerItem: 'Pelanggan / Item',
    partNo: 'No Part',
    quantities: 'Kuantitas (PO | In | Inv)',
    status: 'Status',
    completed: 'SELESAI',
    notCompleted: 'BELUM SELESAI',
    aiSummary: 'Ringkasan Eksekutif AI',
    clickInsights: 'Klik "Wawasan AI" untuk menganalisis tren produksi.',
    topCustomers: 'Volume Pelanggan Teratas',
    upcomingExports: 'Ekspor Mendatang',
    units: 'unit',
    refresh: 'Segarkan',
    language: 'Bahasa',
    analytics: 'Analitik & Tren',
    exportBrandDist: 'Volume Ekspor per Merek',
    shipmentTimeline: 'Riwayat Qty Pengiriman',
    productionByBrand: 'Produksi per Merek (Stock In)',
    noData: 'Tidak ada data',
    brandReport: 'Laporan Kinerja Merek Global',
    completion: 'Penyelesaian',
    shipProgress: 'Progres Kirim',
    filterMonth: 'Filter Bulan',
    allMonths: 'Semua Bulan'
  }
};

const Dashboard: React.FC<DashboardProps> = ({ data, insights, isGeneratingInsights, onGenerateInsights, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const t = translations[lang];

  // Derive available months from invoices for the filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    data.invoices.forEach(inv => {
      const date = parseSpreadsheetDate(inv.exportDate);
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse(); 
  }, [data.invoices]);

  // Color map for brands
  const brandColors = useMemo(() => {
    const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];
    const map: Record<string, string> = {};
    let idx = 0;
    data.invoices.forEach(inv => {
      if (inv.brand && !map[inv.brand]) {
        map[inv.brand] = palette[idx % palette.length];
        idx++;
      }
    });
    // Also include customer names from items
    data.items.forEach(item => {
        if (item.customer && !map[item.customer]) {
          map[item.customer] = palette[idx % palette.length];
          idx++;
        }
    });
    return map;
  }, [data.invoices, data.items]);

  // Filter invoices based on selected month
  const filteredInvoices = useMemo(() => {
    if (selectedMonth === 'all') return data.invoices;
    return data.invoices.filter(inv => {
      const date = parseSpreadsheetDate(inv.exportDate);
      if (!date) return false;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  }, [data.invoices, selectedMonth]);

  // Comprehensive brand aggregation for the "Report"
  const fullBrandReport = useMemo(() => {
    const report: Record<string, {
      po: number;
      stockIn: number;
      rework: number;
      inventory: number;
      shipped: number;
    }> = {};

    data.items.forEach(i => {
      const brand = i.customer || 'Unassigned';
      if (!report[brand]) {
        report[brand] = { po: 0, stockIn: 0, rework: 0, inventory: 0, shipped: 0 };
      }
      report[brand].po += i.poQty;
      report[brand].stockIn += i.stockIn;
      report[brand].rework += i.reworkQty;
      report[brand].inventory += i.finishedGoodsInventory;
      report[brand].shipped += i.usedForShipment;
    });

    return Object.entries(report).sort((a, b) => b[1].po - a[1].po);
  }, [data.items]);

  const exportByBrand = useMemo(() => {
    const brands: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      if (inv.brand) {
        brands[inv.brand] = (brands[inv.brand] || 0) + inv.totalQty;
      }
    });
    return Object.entries(brands).sort((a, b) => b[1] - a[1]);
  }, [filteredInvoices]);

  const shipmentByDateAndBrand = useMemo(() => {
    const dates: Record<string, Record<string, number>> = {};
    filteredInvoices.forEach(inv => {
      if (inv.exportDate && inv.brand) {
        if (!dates[inv.exportDate]) dates[inv.exportDate] = {};
        dates[inv.exportDate][inv.brand] = (dates[inv.exportDate][inv.brand] || 0) + inv.totalQty;
      }
    });
    return Object.entries(dates).sort((a, b) => {
      const dA = parseSpreadsheetDate(a[0])?.getTime() || 0;
      const dB = parseSpreadsheetDate(b[0])?.getTime() || 0;
      return dA - dB;
    });
  }, [filteredInvoices]);

  const productionByBrand = useMemo(() => {
    const map: Record<string, number> = {};
    data.items.forEach(i => {
      const key = i.customer || i.itemType || 'Unknown';
      map[key] = (map[key] || 0) + i.stockIn;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [data.items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return data.items;
    
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
      const matchesInvoice = matchingInvoiceIndices.some(idx => (item.invoiceQtys[idx] || 0) > 0);
      return matchesBasic || matchesInvoice;
    });
  }, [data.items, data.invoices, searchTerm]);

  const productionRatio = (data.summary.totalStockIn / (data.summary.totalPoQty || 1)) * 100;

  const MonthSelector = () => (
    <select 
      value={selectedMonth} 
      onChange={(e) => setSelectedMonth(e.target.value)}
      className="bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none rounded-lg px-2 py-1 appearance-none hover:bg-slate-100 transition-colors"
    >
      <option value="all">{t.allMonths}</option>
      {availableMonths.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-black">{t.ppic}</span> <span className="text-blue-600">{t.bestBase}</span>
            </h1>
            <p className="text-slate-500 font-medium">{t.subtitle}</p>
          </div>
          <button 
            onClick={onRefresh}
            title={t.refresh}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          <div className="relative group">
            <button className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              <i className="fas fa-globe text-blue-500"></i>
              <span>{lang.toUpperCase()}</span>
              <i className="fas fa-chevron-down text-[10px] opacity-40"></i>
            </button>
            <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-50 overflow-hidden">
              {(['en', 'zh', 'id'] as Language[]).map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l)}
                  className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-blue-50 transition-colors ${lang === l ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                >
                  {l === 'en' ? 'English' : l === 'zh' ? 'Mandarin' : 'Bahasa'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 hidden sm:flex">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t.live}</span>
          </div>

          <button 
            onClick={onGenerateInsights}
            disabled={isGeneratingInsights}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            {isGeneratingInsights ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-robot"></i>}
            {isGeneratingInsights ? t.analyzing : t.aiInsights}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title={t.totalPo} value={data.summary.totalPoQty} icon="fa-shopping-cart" color="indigo" />
        <StatCard title={t.totalIn} value={data.summary.totalStockIn} icon="fa-box-open" color="emerald" />
        <StatCard title={t.remaining} value={data.summary.totalRemaining} icon="fa-clock" color="amber" />
        <StatCard title={t.rework} value={data.summary.totalRework} icon="fa-tools" color="rose" />
        <StatCard title={t.inventory} value={data.summary.totalInventory} icon="fa-warehouse" color="blue" />
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most Brand Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group/chart h-[400px] overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
              <i className="fas fa-tags text-indigo-500"></i> {t.exportBrandDist}
            </h3>
            <MonthSelector />
          </div>
          <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {exportByBrand.length > 0 ? exportByBrand.map(([brand, qty], idx) => {
              const max = exportByBrand[0][1] || 1;
              const percent = (qty / max) * 100;
              const color = brandColors[brand] || '#6366f1';
              return (
                <div key={brand} className="group cursor-default">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span className="truncate max-w-[140px]">{brand}</span>
                    <span>{qty.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className="h-full transition-all duration-1000 group-hover:opacity-80" 
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              );
            }) : <div className="text-center py-10 text-slate-400 text-sm italic">{t.noData}</div>}
          </div>
        </div>

        {/* Shipment Qty History - Limited to 10 entries to avoid overflow */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group/chart h-[400px] overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
              <i className="fas fa-truck-loading text-emerald-500"></i> {t.shipmentTimeline}
            </h3>
            <MonthSelector />
          </div>
          <div className="flex-grow flex items-end justify-around gap-2 min-h-[160px] px-2 pb-14 relative">
            {shipmentByDateAndBrand.length > 0 ? (() => {
              const maxTotal = Math.max(...shipmentByDateAndBrand.map(d => (Object.values(d[1]) as number[]).reduce((a: number, b: number) => a + b, 0)), 1);
              // Limit to last 10 points to ensure labels and bars don't overlap horizontally
              return shipmentByDateAndBrand.slice(-10).map(([date, brandData]) => {
                const totalForDate = (Object.values(brandData) as number[]).reduce((a: number, b: number) => a + b, 0);
                const totalHeightPercent = (Number(totalForDate) / Number(maxTotal)) * 100;

                return (
                  <div key={date} className="flex flex-col items-center flex-1 group/bar h-full justify-end min-w-0">
                    <div className="relative w-full flex flex-col items-center h-full justify-end">
                      <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap shadow-xl">
                        <div className="font-bold border-b border-slate-600 pb-1 mb-1">{date}</div>
                        {Object.entries(brandData).map(([b, q]) => (
                          <div key={b} className="flex justify-between gap-4">
                            <span>{b}</span>
                            <span className="font-bold">{q.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="pt-1 mt-1 border-t border-slate-600 flex justify-between gap-4 text-emerald-400">
                          <span>Total</span>
                          <span>{totalForDate.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-[1px] w-full items-end" style={{ height: `${Math.max(totalHeightPercent, 2)}%` }}>
                        {Object.entries(brandData).map(([brand, qty]) => {
                          const brandHeight = (Number(qty) / Number(totalForDate)) * 100;
                          return (
                            <div 
                              key={brand}
                              className="flex-1 rounded-t-sm transition-all duration-700 hover:opacity-80"
                              style={{ 
                                height: `${brandHeight}%`, 
                                backgroundColor: brandColors[brand] || '#10b981',
                                minHeight: '1px'
                              }}
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Fixed rotated labels with specific orientation to prevent clipping */}
                    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 rotate-45 origin-top-left whitespace-nowrap opacity-60">
                      {date.split(/[/.-]/).slice(0, 2).join('/')}
                    </div>
                  </div>
                );
              });
            })() : <div className="w-full text-center py-10 text-slate-400 text-sm italic">{t.noData}</div>}
          </div>
        </div>

        {/* Brand Production */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[400px] overflow-hidden">
          <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
            <i className="fas fa-industry text-blue-500"></i> {t.productionByBrand}
          </h3>
          <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {productionByBrand.length > 0 ? productionByBrand.map(([brand, qty], idx) => {
              const max = (productionByBrand[0][1] || 1);
              const percent = (qty / max) * 100;
              const color = brandColors[brand] || '#3b82f6';
              return (
                <div key={brand} className="group cursor-default">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span className="truncate max-w-[140px]">{brand}</span>
                    <span>{qty.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className="h-full transition-all duration-1000 group-hover:opacity-80" 
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              );
            }) : <div className="text-center py-10 text-slate-400 text-sm italic">{t.noData}</div>}
          </div>
        </div>
      </div>

      {/* Main Grid: Completion + Alerts + Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-chart-pie text-6xl text-indigo-600"></i>
              </div>
              <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6 self-start">{t.productionCompletion}</h3>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#2563eb" strokeWidth="8" 
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * Math.min(productionRatio, 100)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">{Math.round(productionRatio)}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t.achieved}</span>
                </div>
              </div>
              <p className="mt-6 text-sm text-slate-500 text-center font-medium">
                {data.summary.totalStockIn.toLocaleString()} / {data.summary.totalPoQty.toLocaleString()} {t.units}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest">{t.highReworkAlerts}</h3>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">{t.actionRequired}</span>
              </div>
              <div className="space-y-4">
                {data.items.filter(i => i.reworkQty > 0).sort((a,b) => b.reworkQty - a.reworkQty).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{item.partNo}</span>
                      <span className="text-[10px] text-slate-400">{item.customer}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-rose-500">{item.reworkQty.toLocaleString()} {t.units}</div>
                        <div className="text-[9px] text-slate-400">{t.rework}</div>
                      </div>
                      <div className="w-1.5 h-8 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                        <div 
                          className="w-full bg-rose-500" 
                          style={{ height: `${Math.min((item.reworkQty / (item.poQty || 1)) * 100 * 5, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-slate-800 font-bold">{t.registry}</h3>
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder={t.search}
                  className="bg-slate-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
              <table className="w-full text-left text-sm whitespace-nowrap sticky-header">
                <thead className="bg-slate-50/50 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4">{t.powo}</th>
                    <th className="px-6 py-4">{t.customerItem}</th>
                    <th className="px-6 py-4">{t.partNo}</th>
                    <th className="px-6 py-4 text-center">{t.quantities}</th>
                    <th className="px-6 py-4 text-center">{t.rework}</th>
                    <th className="px-6 py-4 text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.slice(0, 100).map((item, idx) => {
                    const isCompleted = item.stockIn >= item.poQty && item.poQty > 0;
                    const percent = item.poQty > 0 ? Math.min((item.stockIn / item.poQty) * 100, 100) : 0;
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
                            <div className="px-2 py-1 bg-slate-50 rounded border border-slate-100 min-w-[50px]">
                              <div className="text-[9px] text-slate-400 uppercase font-black">PO</div>
                              <div className="font-bold text-slate-800">{item.poQty.toLocaleString()}</div>
                            </div>
                            <div className={`px-2 py-1 rounded border min-w-[50px] ${isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                              <div className="text-[9px] uppercase font-black opacity-60">In</div>
                              <div className="font-bold">{item.stockIn.toLocaleString()}</div>
                            </div>
                            <div className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded min-w-[50px]">
                              <div className="text-[9px] uppercase font-black opacity-60">Inv</div>
                              <div className="font-bold">{item.finishedGoodsInventory.toLocaleString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.reworkQty > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-rose-600 font-black text-sm">{item.reworkQty.toLocaleString()}</span>
                              <span className="text-[9px] text-rose-400 font-bold uppercase">{t.rework}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 min-w-[140px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center px-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {isCompleted ? t.completed : t.notCompleted}
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
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <i className="fas fa-brain text-8xl"></i>
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
              <i className="fas fa-sparkles text-blue-400"></i> {t.aiSummary}
            </h3>
            {insights ? (
              <div className="text-sm leading-relaxed space-y-3 prose prose-invert max-none">
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
                <p className="text-sm">{t.clickInsights}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">{t.upcomingExports}</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {data.invoices.length > 0 ? data.invoices.map((inv, idx) => (
                <div 
                  key={idx} 
                  className="flex gap-4 group cursor-pointer"
                  onClick={() => setSearchTerm(inv.brand)}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 ${idx === 0 ? 'bg-blue-600 border-blue-200' : 'bg-slate-200 border-slate-100'}`}></div>
                    {idx < data.invoices.length - 1 && <div className="w-[2px] bg-slate-100 h-full mt-1"></div>}
                  </div>
                  <div className="pb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{inv.exportDate || 'TBD'}</div>
                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-xs">{inv.invoiceTitle}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{inv.brand}</div>
                    <div className="mt-2 flex items-center gap-3">
                       <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-black">
                         {inv.totalQty.toLocaleString()} {t.units}
                       </span>
                    </div>
                  </div>
                </div>
              )) : <div className="text-center py-4 text-slate-400 text-xs italic">{t.noData}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Global Brand Performance Report Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-slate-800 font-black flex items-center gap-3">
            <i className="fas fa-file-contract text-blue-600"></i>
            {t.brandReport}
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Brand / Customer</th>
                <th className="px-6 py-4 text-center">PO Total</th>
                <th className="px-6 py-4 text-center">Production</th>
                <th className="px-6 py-4 text-center">{t.completion}</th>
                <th className="px-6 py-4 text-center">Exported</th>
                <th className="px-6 py-4 text-center">{t.shipProgress}</th>
                <th className="px-6 py-4 text-center">Inventory</th>
                <th className="px-6 py-4 text-center">Rework</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fullBrandReport.map(([brand, metrics]) => {
                const compRatio = metrics.po > 0 ? (metrics.stockIn / metrics.po) * 100 : 0;
                const shipRatio = metrics.stockIn > 0 ? (metrics.shipped / metrics.stockIn) * 100 : 0;
                const color = brandColors[brand] || '#94a3b8';

                return (
                  <tr key={brand} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: color }}></div>
                        <div className="font-black text-slate-800 uppercase tracking-tight">{brand}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">
                      {metrics.po.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {metrics.stockIn.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-blue-600">{Math.round(compRatio)}%</span>
                        <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min(compRatio, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {metrics.shipped.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-emerald-600">{Math.round(shipRatio)}%</span>
                        <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(shipRatio, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black border border-indigo-100">
                        {metrics.inventory.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {metrics.rework > 0 ? (
                        <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-xs font-black border border-rose-100">
                          {metrics.rework.toLocaleString()}
                        </span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
