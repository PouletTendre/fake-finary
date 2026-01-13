"use server";

import { prisma } from "./prisma";
import { getQuotes, getEurUsdRate } from "./yahoo-finance";

// Index tickers for Yahoo Finance
const INDEX_TICKERS = {
  msciWorld: "URTH",      // iShares MSCI World ETF
  sp500: "^GSPC",         // S&P 500
  nasdaq: "^IXIC",        // NASDAQ Composite  
  cac40: "^FCHI",         // CAC 40
  btc: "BTC-USD",         // Bitcoin
  eth: "ETH-USD",         // Ethereum
};

export interface IndexPrices {
  priceMsciWorld: number;
  priceSP500: number;
  priceNasdaq: number;
  priceCac40: number;
  priceBtc: number;
  priceEth: number;
}

// Fetch current prices for all benchmark indices (in EUR)
export async function fetchIndexPrices(): Promise<IndexPrices> {
  try {
    const tickers = Object.values(INDEX_TICKERS);
    const quotes = await getQuotes(tickers);
    const eurUsdRate = await getEurUsdRate();

    // Convert USD prices to EUR
    const toEur = (price: number, ticker: string) => {
      // CAC 40 is already in EUR
      if (ticker === "^FCHI") return price;
      // Others are in USD
      return price / eurUsdRate;
    };

    return {
      priceMsciWorld: toEur(quotes.get(INDEX_TICKERS.msciWorld) || 0, INDEX_TICKERS.msciWorld),
      priceSP500: toEur(quotes.get(INDEX_TICKERS.sp500) || 0, INDEX_TICKERS.sp500),
      priceNasdaq: toEur(quotes.get(INDEX_TICKERS.nasdaq) || 0, INDEX_TICKERS.nasdaq),
      priceCac40: toEur(quotes.get(INDEX_TICKERS.cac40) || 0, INDEX_TICKERS.cac40),
      priceBtc: toEur(quotes.get(INDEX_TICKERS.btc) || 0, INDEX_TICKERS.btc),
      priceEth: toEur(quotes.get(INDEX_TICKERS.eth) || 0, INDEX_TICKERS.eth),
    };
  } catch (error) {
    console.error("[SNAPSHOT] Error fetching index prices:", error);
    // Return zeros if we can't fetch
    return {
      priceMsciWorld: 0,
      priceSP500: 0,
      priceNasdaq: 0,
      priceCac40: 0,
      priceBtc: 0,
      priceEth: 0,
    };
  }
}

// Calculate theoretical units for all indices based on an investment amount
export async function calculateTheoreticalUnits(investedEur: number, prices: IndexPrices) {
  return {
    unitsMsciWorld: prices.priceMsciWorld > 0 ? investedEur / prices.priceMsciWorld : 0,
    unitsSP500: prices.priceSP500 > 0 ? investedEur / prices.priceSP500 : 0,
    unitsNasdaq: prices.priceNasdaq > 0 ? investedEur / prices.priceNasdaq : 0,
    unitsCac40: prices.priceCac40 > 0 ? investedEur / prices.priceCac40 : 0,
    unitsBtc: prices.priceBtc > 0 ? investedEur / prices.priceBtc : 0,
    unitsEth: prices.priceEth > 0 ? investedEur / prices.priceEth : 0,
  };
}

// Get cumulative theoretical units from all BUY transactions
export async function getCumulativeTheoreticalUnits(): Promise<{
  unitsMsciWorld: number;
  unitsSP500: number;
  unitsNasdaq: number;
  unitsCac40: number;
  unitsBtc: number;
  unitsEth: number;
  totalInvested: number;
}> {
  // Get all transactions with their benchmark prices
  const transactions = await prisma.transaction.findMany({
    where: { type: "BUY" },
    orderBy: { date: "asc" },
  });

  const benchmarks = await prisma.transactionBenchmark.findMany();
  const benchmarkMap = new Map(benchmarks.map(b => [b.transactionId, b]));

  let totalUnits = {
    unitsMsciWorld: 0,
    unitsSP500: 0,
    unitsNasdaq: 0,
    unitsCac40: 0,
    unitsBtc: 0,
    unitsEth: 0,
  };
  let totalInvested = 0;

  for (const tx of transactions) {
    const benchmark = benchmarkMap.get(tx.id);
    if (!benchmark) continue;

    const investedEur = tx.totalEur;
    totalInvested += investedEur;

    // Add units that could have been bought at that time
    if (benchmark.priceMsciWorld > 0) totalUnits.unitsMsciWorld += investedEur / benchmark.priceMsciWorld;
    if (benchmark.priceSP500 > 0) totalUnits.unitsSP500 += investedEur / benchmark.priceSP500;
    if (benchmark.priceNasdaq > 0) totalUnits.unitsNasdaq += investedEur / benchmark.priceNasdaq;
    if (benchmark.priceCac40 > 0) totalUnits.unitsCac40 += investedEur / benchmark.priceCac40;
    if (benchmark.priceBtc > 0) totalUnits.unitsBtc += investedEur / benchmark.priceBtc;
    if (benchmark.priceEth > 0) totalUnits.unitsEth += investedEur / benchmark.priceEth;
  }

  return { ...totalUnits, totalInvested };
}

// Create a new portfolio snapshot
export async function createPortfolioSnapshot(portfolioValue: number) {
  const now = new Date();
  // Round to nearest 15 minutes
  now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);

  // Get current index prices
  const prices = await fetchIndexPrices();

  // Get cumulative theoretical units from transactions
  const { totalInvested, ...units } = await getCumulativeTheoreticalUnits();

  // Upsert the snapshot (update if exists for this time slot)
  const snapshot = await prisma.portfolioSnapshot.upsert({
    where: { date: now },
    update: {
      totalValueEur: portfolioValue,
      totalInvestedEur: totalInvested,
      ...prices,
      ...units,
    },
    create: {
      date: now,
      totalValueEur: portfolioValue,
      totalInvestedEur: totalInvested,
      ...prices,
      ...units,
    },
  });

  console.log(`[SNAPSHOT] Created/updated snapshot at ${now.toISOString()}`);
  return snapshot;
}

// Save benchmark prices for a transaction
export async function saveTransactionBenchmark(transactionId: string) {
  const prices = await fetchIndexPrices();

  await prisma.transactionBenchmark.create({
    data: {
      transactionId,
      ...prices,
    },
  });

  console.log(`[BENCHMARK] Saved benchmark prices for transaction ${transactionId}`);
}

// Get portfolio history with calculated benchmark values
export async function getPortfolioHistoryWithBenchmarks() {
  const snapshots = await prisma.portfolioSnapshot.findMany({
    orderBy: { date: "asc" },
  });

  return snapshots.map(snapshot => ({
    date: snapshot.date.toISOString().split("T")[0],
    time: snapshot.date.toISOString().split("T")[1].substring(0, 5),
    portfolioValue: snapshot.totalValueEur,
    invested: snapshot.totalInvestedEur,
    // Calculated benchmark values (units × current price in snapshot)
    msciWorldValue: snapshot.unitsMsciWorld * snapshot.priceMsciWorld,
    sp500Value: snapshot.unitsSP500 * snapshot.priceSP500,
    nasdaqValue: snapshot.unitsNasdaq * snapshot.priceNasdaq,
    cac40Value: snapshot.unitsCac40 * snapshot.priceCac40,
    btcValue: snapshot.unitsBtc * snapshot.priceBtc,
    ethValue: snapshot.unitsEth * snapshot.priceEth,
  }));
}

// Calculate current theoretical values for all benchmarks
export async function getCurrentBenchmarkValues() {
  const prices = await fetchIndexPrices();
  const { totalInvested, ...units } = await getCumulativeTheoreticalUnits();

  return {
    totalInvested,
    benchmarks: {
      msciWorld: {
        name: "MSCI World",
        units: units.unitsMsciWorld,
        currentPrice: prices.priceMsciWorld,
        currentValue: units.unitsMsciWorld * prices.priceMsciWorld,
      },
      sp500: {
        name: "S&P 500",
        units: units.unitsSP500,
        currentPrice: prices.priceSP500,
        currentValue: units.unitsSP500 * prices.priceSP500,
      },
      nasdaq: {
        name: "NASDAQ",
        units: units.unitsNasdaq,
        currentPrice: prices.priceNasdaq,
        currentValue: units.unitsNasdaq * prices.priceNasdaq,
      },
      cac40: {
        name: "CAC 40",
        units: units.unitsCac40,
        currentPrice: prices.priceCac40,
        currentValue: units.unitsCac40 * prices.priceCac40,
      },
      btc: {
        name: "Bitcoin",
        units: units.unitsBtc,
        currentPrice: prices.priceBtc,
        currentValue: units.unitsBtc * prices.priceBtc,
      },
      eth: {
        name: "Ethereum",
        units: units.unitsEth,
        currentPrice: prices.priceEth,
        currentValue: units.unitsEth * prices.priceEth,
      },
    },
  };
}
