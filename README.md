# Portfolio Tracker

A personal portfolio tracker application to replace Excel spreadsheets. Track your investments across Crypto, Stocks, and ETFs.

## Features

- **Dashboard**: Overview of your total portfolio value, invested amount, and performance
- **Holdings Table**: View all positions with PRU (Average Cost), current price, and PnL
- **Transaction Journal**: Log Buy, Sell, and Withdraw transactions
- **Multi-Currency Support**: Handle USD/EUR conversions automatically
- **Performance Chart**: Visualize portfolio performance over time
- **MSCI World Benchmark**: Compare your performance against MSCI World

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client and create database:
```bash
npm run db:generate
npm run db:push
```

3. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with sidebar
│   ├── page.tsx             # Dashboard page
│   └── transactions/
│       └── page.tsx         # Transactions page
├── components/
│   └── PortfolioChart.tsx   # Recharts area chart
├── lib/
│   ├── actions.ts           # Server actions for data mutations
│   └── prisma.ts            # Prisma client singleton
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeder
└── README.md
```

## Business Logic

### PRU Calculation (Average Unit Cost)
The PRU is calculated using the weighted average of all BUY transactions:
```
PRU = Sum(Buy Quantity × Unit Price EUR) / Sum(Buy Quantity)
```

### Currency Conversion
- All amounts are converted to EUR for storage
- Exchange rate is stored with each transaction
- Default USD to EUR rate: 0.92 (configurable per transaction)

### MSCI World Benchmark
On every deposit (BUY transaction), the app calculates how many hypothetical MSCI World units could have been purchased. This allows comparison:
- **My Portfolio Value** vs **Theoretical MSCI Value**
