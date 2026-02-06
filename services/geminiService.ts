
import { GoogleGenAI } from "@google/genai";
import { DashboardData } from "../types";

export async function getAiInsights(data: DashboardData): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summaryContext = `
    Production Summary:
    - Total PO Qty: ${data.summary.totalPoQty}
    - Total Stock In: ${data.summary.totalStockIn}
    - Total Remaining: ${data.summary.totalRemaining}
    - Total Rework: ${data.summary.totalRework}
    - Current Inventory: ${data.summary.totalInventory}
    
    Top Items by Inventory:
    ${data.items.slice(0, 5).map(i => `- ${i.partNo} (${i.customer}): ${i.finishedGoodsInventory}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this production data and provide 3-4 actionable bullet-point insights for management. Focus on rework issues, inventory levels, and production bottlenecks. Keep it professional and concise. \n\n ${summaryContext}`,
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI advisor. Please try again later.";
  }
}
