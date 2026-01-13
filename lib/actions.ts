"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

// Dummy prices for now (simulating API)
const MOCK_PRICES: Record<string, number> = {
  BTC: 65000,
  ETH: 3400,
  SOL: 140,
  AAPL: 185,
  MSFT: 420,
  GOOGL: 175,
  AMZN: 195,
  NVDA: 145,
  TSLA: 245,
  VOO: 480,
  VTI: 285,
  IWDA: 85,
  // MSCI World ETF price
  MSCIWLD: 85,
};

// Get current price for an asset (mock data)
function getCurrentPrice(ticker: string): number {
  return MOCK_PRICES[ticker.toUpperCase()] ?? Math.random() * 100 + 50;
}

// Asset type definitions
export interface HoldingData {
  id: string;
  ticker: string;
  name: string;
  type: string;
  totalQuantity: number;
  pru: number; // Prix de Revient Unitaire (Average Cost)
  currentPrice: number;
  currentValue: number;
  totalInvestedEur: number;
  pnlEur: number;
  pnlPercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
}

export interface PortfolioData {
  holdings: HoldingData[];
  summary: PortfolioSummary;
}

export interface TransactionWithAsset {
  id: string;
  date: Date;
  type: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  exchangeRate: number;
  fees: number;
  totalEur: number;
  asset: {
    id: string;
    ticker: string;
    name: string;
    type: string;
  };
}

// Get all portfolio data with calculated PRU and performance
export async function getPortfolioData(): Promise<PortfolioData> {
  const assets = await prisma.asset.findMany({
    include: {
      transactions: {
        orderBy: { date: "asc" },
      },
    },
  });

  const holdings: HoldingData[] = [];

  for (const asset of assets) {
    let totalQuantity = 0;
    let totalBuyCostEur = 0;
    let totalBuyQuantity = 0;

    for (const tx of asset.transactions) {
      if (tx.type === "BUY") {
        totalQuantity += tx.quantity;
        totalBuyCostEur += tx.totalEur;
        totalBuyQuantity += tx.quantity;
      } else if (tx.type === "SELL" || tx.type === "WITHDRAW") {
        totalQuantity -= tx.quantity;
      }
    }

    // Skip assets with 0 quantity
    if (totalQuantity <= 0) continue;

    // PRU = Weighted average of BUY transactions
    const pru = totalBuyQuantity > 0 ? totalBuyCostEur / totalBuyQuantity : 0;
    const currentPrice = getCurrentPrice(asset.ticker);
    const currentValue = totalQuantity * currentPrice;
    const totalInvestedEur = totalQuantity * pru;
    const pnlEur = currentValue - totalInvestedEur;
    const pnlPercent = totalInvestedEur > 0 ? (pnlEur / totalInvestedEur) * 100 : 0;

    holdings.push({
      id: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      totalQuantity,
      pru,
      currentPrice,
      currentValue,
      totalInvestedEur,
      pnlEur,
      pnlPercent,
    });
  }

  // Calculate summary
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvestedEur, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return {
    holdings,
    summary: {
      totalValue,
      totalInvested,
      totalPnl,
      totalPnlPercent,
    },
  };
}

// Get all transactions with asset info
export async function getTransactions(): Promise<TransactionWithAsset[]> {
  const transactions = await prisma.transaction.findMany({
    include: {
      asset: true,
    },
    orderBy: { date: "desc" },
  });

  return transactions;
}

// Get all assets for dropdown
export async function getAssets() {
  return prisma.asset.findMany({
    orderBy: { ticker: "asc" },
  });
}

// Add a new transaction
export async function addTransaction(formData: FormData) {
  const ticker = formData.get("ticker") as string;
  const name = formData.get("name") as string;
  const assetType = formData.get("assetType") as string;
  const type = formData.get("type") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const unitPrice = parseFloat(formData.get("unitPrice") as string);
  const currency = formData.get("currency") as string;
  const dateString = formData.get("date") as string;
  const fees = parseFloat((formData.get("fees") as string) || "0");
  const exchangeRateInput = formData.get("exchangeRate") as string;
  
  // Default exchange rate: 1 for EUR, ~0.92 for USD (1 EUR = 1.09 USD)
  const exchangeRate = exchangeRateInput 
    ? parseFloat(exchangeRateInput)
    : currency === "USD" 
      ? 0.92 
      : 1.0;

  const date = new Date(dateString);

  // Calculate total in EUR
  let totalEur: number;
  if (currency === "EUR") {
    totalEur = quantity * unitPrice + fees;
  } else {
    // Convert from USD to EUR
    totalEur = (quantity * unitPrice + fees) * exchangeRate;
  }

  // Find or create asset
  let asset = await prisma.asset.findUnique({
    where: { ticker: ticker.toUpperCase() },
  });

  if (!asset) {
    asset = await prisma.asset.create({
      data: {
        ticker: ticker.toUpperCase(),
        name: name || ticker.toUpperCase(),
        type: assetType || "STOCK",
      },
    });
  }

  // Create transaction
  await prisma.transaction.create({
    data: {
      date,
      type,
      quantity,
      unitPrice,
      currency,
      exchangeRate,
      fees,
      totalEur,
      assetId: asset.id,
    },
  });

  // Update MSCI benchmark tracking
  if (type === "BUY") {
    await updateMsciBenchmark(date, totalEur);
  }

  revalidatePath("/");
  revalidatePath("/transactions");
}

// Delete a transaction
export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
}

// Update MSCI benchmark tracking (theoretical MSCI units)
async function updateMsciBenchmark(date: Date, investedEur: number) {
  const msciPrice = MOCK_PRICES.MSCIWLD;
  const unitsToAdd = investedEur / msciPrice;

  // Get the latest snapshot to add cumulative units
  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: "desc" },
  });

  const previousUnits = latestSnapshot?.theoreticalMsciUnits ?? 0;
  const previousInvested = latestSnapshot?.totalInvestedEur ?? 0;

  // Upsert today's snapshot
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const portfolioData = await getPortfolioData();

  await prisma.portfolioSnapshot.upsert({
    where: { date: today },
    update: {
      totalValueEur: portfolioData.summary.totalValue,
      totalInvestedEur: previousInvested + investedEur,
      theoreticalMsciUnits: previousUnits + unitsToAdd,
      msciPrice,
    },
    create: {
      date: today,
      totalValueEur: portfolioData.summary.totalValue,
      totalInvestedEur: previousInvested + investedEur,
      msciPrice,
      theoreticalMsciUnits: previousUnits + unitsToAdd,
    },
  });
}

// Get portfolio history for charts
export async function getPortfolioHistory() {
  const snapshots = await prisma.portfolioSnapshot.findMany({
    orderBy: { date: "asc" },
  });

  return snapshots.map((snapshot) => ({
    date: snapshot.date.toISOString().split("T")[0],
    portfolioValue: snapshot.totalValueEur,
    invested: snapshot.totalInvestedEur,
    msciValue: snapshot.theoreticalMsciUnits * MOCK_PRICES.MSCIWLD,
    msciUnits: snapshot.theoreticalMsciUnits,
  }));
}
