
import { DashboardData, InvoiceMetadata, ProductionLineItem } from '../types';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1XoV7020NTZk1kzqn3F2ks3gOVFJ5arr5NVgUdewWPNQ/export?format=csv&gid=1100244896';

function parseCSV(csvText: string): string[][] {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && csvText[i + 1] === '\n') i++;
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(SHEET_URL);
  if (!response.ok) throw new Error('Failed to fetch spreadsheet data');
  const csvText = await response.text();
  const rows = parseCSV(csvText);

  // Parse Invoices Metadata (Rows 1-5, starting from Column Q (index 16))
  const invoices: InvoiceMetadata[] = [];
  if (rows.length >= 5) {
    const startCol = 16; // Column Q
    for (let col = startCol; col < rows[0].length; col++) {
      if (!rows[0][col]) break;
      invoices.push({
        brand: rows[0][col] || '',
        exportDate: rows[1][col] || '',
        totalQty: parseInt(rows[2][col]) || 0,
        containerInfo: rows[3][col] || '',
        invoiceTitle: rows[4][col] || '',
      });
    }
  }

  // Parse Line Items (Row 6 onwards, index 5)
  const items: ProductionLineItem[] = [];
  for (let i = 5; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue; // Skip empty rows

    const invoiceQtys: number[] = [];
    for (let col = 16; col < r.length; col++) {
      invoiceQtys.push(parseInt(r[col]) || 0);
    }

    items.push({
      poNo: r[0] || '',
      woNo: r[1] || '',
      partNo: r[2] || '',
      customer: r[3] || '',
      itemType: r[4] || '',
      size: r[5] || '',
      color: r[7] || '', // Column H is index 7
      poQty: parseInt(r[8]) || 0, // I
      stockIn: parseInt(r[9]) || 0, // J
      remaining: parseInt(r[10]) || 0, // K
      usedForShipment: parseInt(r[11]) || 0, // L
      readyForShipment: parseInt(r[12]) || 0, // M
      reworkQty: parseInt(r[13]) || 0, // N
      finishedGoodsInventory: parseInt(r[14]) || 0, // O
      invoiceQtys,
    });
  }

  // Calculate Summary
  const summary = items.reduce(
    (acc, item) => ({
      totalPoQty: acc.totalPoQty + item.poQty,
      totalStockIn: acc.totalStockIn + item.stockIn,
      totalRemaining: acc.totalRemaining + item.remaining,
      totalRework: acc.totalRework + item.reworkQty,
      totalInventory: acc.totalInventory + item.finishedGoodsInventory,
    }),
    { totalPoQty: 0, totalStockIn: 0, totalRemaining: 0, totalRework: 0, totalInventory: 0 }
  );

  return { invoices, items, summary };
}
