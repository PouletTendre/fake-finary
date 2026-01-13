/**
 * Script to migrate existing transactions to the new benchmark system
 * Run with: npx tsx scripts/migrate-benchmarks.ts
 */

const { PrismaClient } = require("@prisma/client");
const YahooFinance = require("yahoo-finance2").default;

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const INDEX_TICKERS = {
  msciWorld: "URTH",
  sp500: "^GSPC",
  nasdaq: "^IXIC",
  cac40: "^FCHI",
  btc: "BTC-USD",
  eth: "ETH-USD",
};

async function getEurUsdRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote("EURUSD=X");
    return quote.regularMarketPrice || 1.09;
  } catch {
    return 1.09;
  }
}

async function fetchIndexPricesAtDate(date: Date) {
  try {
    // Use the chart API to get historical prices
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 5); // Look back a few days in case of weekends

    const eurUsdRate = await getEurUsdRate();

    const prices: Record<string, number> = {};

    for (const [key, ticker] of Object.entries(INDEX_TICKERS)) {
      try {
        const result = await yahooFinance.chart(ticker, {
          period1: startDate,
          period2: endDate,
          interval: "1d",
        });

        if (result.quotes && result.quotes.length > 0) {
          // Get the last available price before or on the transaction date
          const validQuotes = result.quotes.filter(
            (q: any) => q.close && new Date(q.date) <= date
          );
          if (validQuotes.length > 0) {
            const lastQuote = validQuotes[validQuotes.length - 1];
            let price = lastQuote.close;

            // Convert to EUR (CAC40 is already in EUR)
            if (ticker !== "^FCHI") {
              price = price / eurUsdRate;
            }

            prices[key] = price;
          }
        }
      } catch (error) {
        console.log(`  Warning: Could not fetch ${ticker} for ${date.toISOString().split("T")[0]}`);
      }
    }

    return prices;
  } catch (error) {
    console.error("Error fetching index prices:", error);
    return {};
  }
}

async function migrateTransactions() {
  console.log("🔄 Migrating existing transactions to new benchmark system...\n");

  // Get all BUY transactions without benchmark data
  const transactions = await prisma.transaction.findMany({
    where: { type: "BUY" },
    include: { asset: true },
    orderBy: { date: "asc" },
  });

  console.log(`Found ${transactions.length} BUY transactions to process.\n`);

  for (const tx of transactions) {
    // Check if benchmark already exists
    const existingBenchmark = await prisma.transactionBenchmark.findFirst({
      where: { transactionId: tx.id },
    });

    if (existingBenchmark) {
      console.log(`✓ ${tx.asset.ticker} on ${tx.date.toISOString().split("T")[0]} - Already has benchmark`);
      continue;
    }

    console.log(`Processing ${tx.asset.ticker} on ${tx.date.toISOString().split("T")[0]}...`);

    const prices = await fetchIndexPricesAtDate(tx.date);

    if (Object.keys(prices).length > 0) {
      await prisma.transactionBenchmark.create({
        data: {
          transactionId: tx.id,
          priceMsciWorld: prices.msciWorld || 0,
          priceSP500: prices.sp500 || 0,
          priceNasdaq: prices.nasdaq || 0,
          priceCac40: prices.cac40 || 0,
          priceBtc: prices.btc || 0,
          priceEth: prices.eth || 0,
        },
      });
      console.log(`  ✓ Saved benchmark prices:`, prices);
    } else {
      console.log(`  ⚠ Could not fetch prices for this date`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n✅ Migration complete!");
}

async function createInitialSnapshot() {
  console.log("\n📸 Creating initial snapshot...\n");

  // Fetch current portfolio value
  const transactions = await prisma.transaction.findMany({
    include: { asset: true },
  });

  // Calculate holdings
  const holdings: Record<string, { quantity: number; invested: number }> = {};
  
  for (const tx of transactions) {
    const ticker = tx.asset.ticker;
    if (!holdings[ticker]) {
      holdings[ticker] = { quantity: 0, invested: 0 };
    }

    if (tx.type === "BUY") {
      holdings[ticker].quantity += tx.quantity;
      holdings[ticker].invested += tx.totalEur;
    } else if (tx.type === "SELL") {
      holdings[ticker].quantity -= tx.quantity;
      holdings[ticker].invested -= tx.totalEur;
    }
  }

  // Get cumulative theoretical units
  const benchmarks = await prisma.transactionBenchmark.findMany();
  const buyTransactions = transactions.filter((tx: any) => tx.type === "BUY");
  
  let totalUnits = {
    msciWorld: 0,
    sp500: 0,
    nasdaq: 0,
    cac40: 0,
    btc: 0,
    eth: 0,
  };

  let totalInvested = 0;

  for (const tx of buyTransactions) {
    const benchmark = benchmarks.find((b: any) => b.transactionId === tx.id);
    if (!benchmark) continue;

    const investedEur = tx.totalEur;
    totalInvested += investedEur;

    if (benchmark.priceMsciWorld > 0) totalUnits.msciWorld += investedEur / benchmark.priceMsciWorld;
    if (benchmark.priceSP500 > 0) totalUnits.sp500 += investedEur / benchmark.priceSP500;
    if (benchmark.priceNasdaq > 0) totalUnits.nasdaq += investedEur / benchmark.priceNasdaq;
    if (benchmark.priceCac40 > 0) totalUnits.cac40 += investedEur / benchmark.priceCac40;
    if (benchmark.priceBtc > 0) totalUnits.btc += investedEur / benchmark.priceBtc;
    if (benchmark.priceEth > 0) totalUnits.eth += investedEur / benchmark.priceEth;
  }

  // Fetch current prices
  const eurUsdRate = await getEurUsdRate();
  const quotes = await yahooFinance.quote(Object.values(INDEX_TICKERS));
  
  const currentPrices: Record<string, number> = {};
  for (const quote of quotes) {
    const entry = Object.entries(INDEX_TICKERS).find(([_, ticker]) => ticker === quote.symbol);
    if (entry) {
      let price = quote.regularMarketPrice;
      if (quote.symbol !== "^FCHI") {
        price = price / eurUsdRate;
      }
      currentPrices[entry[0]] = price;
    }
  }

  // Calculate current portfolio value (simplified - just use invested for now)
  const portfolioValue = totalInvested; // This should be calculated with current prices

  const now = new Date();
  now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);

  await prisma.portfolioSnapshot.upsert({
    where: { date: now },
    update: {
      totalValueEur: portfolioValue,
      totalInvestedEur: totalInvested,
      priceMsciWorld: currentPrices.msciWorld || 0,
      priceSP500: currentPrices.sp500 || 0,
      priceNasdaq: currentPrices.nasdaq || 0,
      priceCac40: currentPrices.cac40 || 0,
      priceBtc: currentPrices.btc || 0,
      priceEth: currentPrices.eth || 0,
      unitsMsciWorld: totalUnits.msciWorld,
      unitsSP500: totalUnits.sp500,
      unitsNasdaq: totalUnits.nasdaq,
      unitsCac40: totalUnits.cac40,
      unitsBtc: totalUnits.btc,
      unitsEth: totalUnits.eth,
    },
    create: {
      date: now,
      totalValueEur: portfolioValue,
      totalInvestedEur: totalInvested,
      priceMsciWorld: currentPrices.msciWorld || 0,
      priceSP500: currentPrices.sp500 || 0,
      priceNasdaq: currentPrices.nasdaq || 0,
      priceCac40: currentPrices.cac40 || 0,
      priceBtc: currentPrices.btc || 0,
      priceEth: currentPrices.eth || 0,
      unitsMsciWorld: totalUnits.msciWorld,
      unitsSP500: totalUnits.sp500,
      unitsNasdaq: totalUnits.nasdaq,
      unitsCac40: totalUnits.cac40,
      unitsBtc: totalUnits.btc,
      unitsEth: totalUnits.eth,
    },
  });

  console.log("✅ Initial snapshot created!");
  console.log(`   Total Invested: €${totalInvested.toFixed(2)}`);
  console.log(`   Theoretical units:`, totalUnits);
}

async function main() {
  try {
    await migrateTransactions();
    await createInitialSnapshot();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
