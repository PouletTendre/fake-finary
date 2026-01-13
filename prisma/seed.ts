import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create some sample assets
  const btc = await prisma.asset.upsert({
    where: { ticker: "BTC" },
    update: {},
    create: {
      ticker: "BTC",
      name: "Bitcoin",
      type: "CRYPTO",
    },
  });

  const eth = await prisma.asset.upsert({
    where: { ticker: "ETH" },
    update: {},
    create: {
      ticker: "ETH",
      name: "Ethereum",
      type: "CRYPTO",
    },
  });

  const aapl = await prisma.asset.upsert({
    where: { ticker: "AAPL" },
    update: {},
    create: {
      ticker: "AAPL",
      name: "Apple Inc.",
      type: "STOCK",
    },
  });

  const voo = await prisma.asset.upsert({
    where: { ticker: "VOO" },
    update: {},
    create: {
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      type: "ETF",
    },
  });

  // Create sample transactions
  const transactions = [
    {
      date: new Date("2024-01-15"),
      type: "BUY",
      quantity: 0.1,
      unitPrice: 42000,
      currency: "USD",
      exchangeRate: 0.92,
      fees: 10,
      totalEur: 0.1 * 42000 * 0.92 + 10,
      assetId: btc.id,
    },
    {
      date: new Date("2024-02-20"),
      type: "BUY",
      quantity: 0.05,
      unitPrice: 52000,
      currency: "USD",
      exchangeRate: 0.93,
      fees: 5,
      totalEur: 0.05 * 52000 * 0.93 + 5,
      assetId: btc.id,
    },
    {
      date: new Date("2024-03-10"),
      type: "BUY",
      quantity: 1.5,
      unitPrice: 3200,
      currency: "USD",
      exchangeRate: 0.91,
      fees: 8,
      totalEur: 1.5 * 3200 * 0.91 + 8,
      assetId: eth.id,
    },
    {
      date: new Date("2024-04-05"),
      type: "BUY",
      quantity: 20,
      unitPrice: 170,
      currency: "USD",
      exchangeRate: 0.92,
      fees: 5,
      totalEur: 20 * 170 * 0.92 + 5,
      assetId: aapl.id,
    },
    {
      date: new Date("2024-05-15"),
      type: "SELL",
      quantity: 5,
      unitPrice: 185,
      currency: "USD",
      exchangeRate: 0.91,
      fees: 5,
      totalEur: 5 * 185 * 0.91 - 5, // Sell reduces invested
      assetId: aapl.id,
    },
    {
      date: new Date("2024-06-01"),
      type: "BUY",
      quantity: 10,
      unitPrice: 450,
      currency: "USD",
      exchangeRate: 0.93,
      fees: 0,
      totalEur: 10 * 450 * 0.93,
      assetId: voo.id,
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: tx,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`   Created ${4} assets and ${transactions.length} transactions`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
