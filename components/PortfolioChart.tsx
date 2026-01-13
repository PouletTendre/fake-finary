"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  invested: number;
  msciValue: number;
}

interface PortfolioChartProps {
  data: ChartDataPoint[];
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white font-medium font-mono">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function PortfolioChart({ data }: PortfolioChartProps) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-gray-500">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p className="text-lg font-medium">No history data yet</p>
        <p className="text-sm text-gray-600 mt-1">
          Start adding transactions to see your portfolio performance over time
        </p>
      </div>
    );
  }

  // Sample data for demo if we have real data
  const chartData = data.length > 0 ? data : generateSampleData();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMsci" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              new Intl.NumberFormat("fr-FR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(value)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            name="Portfolio Value"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorPortfolio)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="invested"
            name="Total Invested"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorInvested)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="msciValue"
            name="MSCI World Benchmark"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#colorMsci)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Generate sample data for demonstration
function generateSampleData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  let portfolioValue = 10000;
  let invested = 10000;
  let msciValue = 10000;

  for (let i = 0; i < 180; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Simulate some variation
    portfolioValue *= 1 + (Math.random() - 0.48) * 0.02;
    msciValue *= 1 + (Math.random() - 0.49) * 0.015;

    // Occasional deposits
    if (i % 30 === 0 && i > 0) {
      invested += 1000;
      portfolioValue += 1000;
      msciValue += 1000;
    }

    data.push({
      date: date.toISOString().split("T")[0],
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      invested: Math.round(invested * 100) / 100,
      msciValue: Math.round(msciValue * 100) / 100,
    });
  }

  return data;
}
