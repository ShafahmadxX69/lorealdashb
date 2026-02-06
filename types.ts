
export interface InvoiceMetadata {
  brand: string;
  exportDate: string;
  totalQty: number;
  containerInfo: string;
  invoiceTitle: string;
}

export interface ProductionLineItem {
  poNo: string;
  woNo: string;
  partNo: string;
  customer: string;
  itemType: string;
  size: string;
  color: string;
  poQty: number;
  stockIn: number;
  remaining: number;
  usedForShipment: number;
  readyForShipment: number;
  reworkQty: number;
  finishedGoodsInventory: number;
  invoiceQtys: number[]; // From columns Q onwards
}

export interface DashboardData {
  invoices: InvoiceMetadata[];
  items: ProductionLineItem[];
  summary: {
    totalPoQty: number;
    totalStockIn: number;
    totalRemaining: number;
    totalRework: number;
    totalInventory: number;
  };
}
