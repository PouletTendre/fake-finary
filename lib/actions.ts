"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { getQuotes, getEurUsdRate } from "./yahoo-finance";

// Fallback prices si l'API est indisponible
const FALLBACK_PRICES: Record<string, number> = {
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
  MSCIWLD: 85,
};

// Cache pour les prix (éviter trop d'appels API)
let pricesCache: { prices: Map<string, number>; eurUsdRate: number; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute

// Force cache clear on module load
pricesCache = null;
console.log('[ACTIONS] Module loaded, cache cleared');

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

// Récupérer les prix en temps réel (avec cache)
async function fetchLivePrices(
  assets: { ticker: string; type: string }[]
): Promise<{ prices: Map<string, number>; eurUsdRate: number }> {
  // Vérifier le cache
  if (pricesCache && Date.now() - pricesCache.timestamp < CACHE_TTL) {
    return { prices: pricesCache.prices, eurUsdRate: pricesCache.eurUsdRate };
  }

  try {
    console.log('[FETCH] Fetching live prices for:', assets.map(a => a.ticker));
    
    // Récupérer les prix et le taux EUR/USD en parallèle
    const [quotesMap, eurUsdRate] = await Promise.all([
      getQuotes(assets.map((a) => ({ ticker: a.ticker, assetType: a.type }))),
      getEurUsdRate(),
    ]);

    console.log('[FETCH] Got EUR/USD rate:', eurUsdRate);
    console.log('[FETCH] Got prices:', Object.fromEntries(quotesMap));

    // Mettre en cache
    pricesCache = {
      prices: quotesMap,
      eurUsdRate,
      timestamp: Date.now(),
    };

    return { prices: quotesMap, eurUsdRate };
  } catch (error) {
    console.error("Erreur récupération prix:", error);
    // Retourner les prix fallback
    const fallbackMap = new Map<string, number>();
    assets.forEach((a) => {
      if (FALLBACK_PRICES[a.ticker]) {
        fallbackMap.set(a.ticker, FALLBACK_PRICES[a.ticker]);
      }
    });
    return { prices: fallbackMap, eurUsdRate: 1.09 };
  }
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

  // Récupérer les prix en temps réel
  const { prices: livePrices, eurUsdRate } = await fetchLivePrices(
    assets.map((a) => ({ ticker: a.ticker, type: a.type }))
  );

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
    
    // Prix en temps réel (USD) converti en EUR
    const priceUsd = livePrices.get(asset.ticker.toUpperCase()) ?? 
                     FALLBACK_PRICES[asset.ticker.toUpperCase()] ?? 
                     0;
    const currentPrice = priceUsd / eurUsdRate; // Convertir en EUR
    
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

// Get all assets for dropdown (only those with transactions)
export async function getAssets() {
  return prisma.asset.findMany({
    where: {
      transactions: {
        some: {}, // Seulement les assets avec au moins une transaction
      },
    },
    orderBy: { ticker: "asc" },
  });
}

// Get current EUR/USD exchange rate for display
export async function getCurrentExchangeRate(): Promise<number> {
  const eurUsdRate = await getEurUsdRate(); // ex: 1.17 (1€ = 1.17$)
  return 1 / eurUsdRate; // ex: 0.855 (1$ = 0.855€)
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
  
  // Récupérer le taux EUR/USD actuel si pas fourni
  let exchangeRate: number;
  if (exchangeRateInput && parseFloat(exchangeRateInput) > 0) {
    exchangeRate = parseFloat(exchangeRateInput);
  } else if (currency === "USD") {
    // Récupérer le taux en temps réel: EURUSD=X donne combien vaut 1€ en $
    // Donc pour convertir USD -> EUR, on divise par ce taux (ou multiplie par 1/taux)
    const eurUsdRate = await getEurUsdRate(); // ex: 1.17 (1€ = 1.17$)
    exchangeRate = 1 / eurUsdRate; // ex: 0.855 (1$ = 0.855€)
    console.log(`[TRANSACTION] Using live EUR/USD rate: ${eurUsdRate} -> exchangeRate: ${exchangeRate.toFixed(4)}`);
  } else {
    exchangeRate = 1.0;
  }

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
  // Récupérer la transaction pour avoir l'assetId
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: { assetId: true },
  });

  await prisma.transaction.delete({
    where: { id },
  });

  // Vérifier si l'asset a encore des transactions
  if (transaction?.assetId) {
    const remainingTransactions = await prisma.transaction.count({
      where: { assetId: transaction.assetId },
    });

    // Supprimer l'asset s'il n'a plus de transactions
    if (remainingTransactions === 0) {
      await prisma.asset.delete({
        where: { id: transaction.assetId },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");
}

// Update a transaction
export async function updateTransaction(id: string, formData: FormData) {
  const type = formData.get("type") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const unitPrice = parseFloat(formData.get("unitPrice") as string);
  const currency = formData.get("currency") as string;
  const dateString = formData.get("date") as string;
  const fees = parseFloat((formData.get("fees") as string) || "0");
  const exchangeRateInput = formData.get("exchangeRate") as string;
  
  // Récupérer le taux EUR/USD actuel si pas fourni
  let exchangeRate: number;
  if (exchangeRateInput && parseFloat(exchangeRateInput) > 0) {
    exchangeRate = parseFloat(exchangeRateInput);
  } else if (currency === "USD") {
    const eurUsdRate = await getEurUsdRate();
    exchangeRate = 1 / eurUsdRate;
  } else {
    exchangeRate = 1.0;
  }

  const date = new Date(dateString);

  // Calculate total in EUR
  let totalEur: number;
  if (currency === "EUR") {
    totalEur = quantity * unitPrice + fees;
  } else {
    totalEur = (quantity * unitPrice + fees) * exchangeRate;
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      date,
      type,
      quantity,
      unitPrice,
      currency,
      exchangeRate,
      fees,
      totalEur,
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
}

// Update MSCI benchmark tracking (theoretical MSCI units)
async function updateMsciBenchmark(date: Date, investedEur: number) {
  const msciPrice = FALLBACK_PRICES.MSCIWLD;
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
    msciValue: snapshot.theoreticalMsciUnits * FALLBACK_PRICES.MSCIWLD,
    msciUnits: snapshot.theoreticalMsciUnits,
  }));
}
