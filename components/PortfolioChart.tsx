"use client";

import { useState, useMemo } from "react";
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
import { ChevronDown, TrendingUp } from "lucide-react";

// Indices disponibles (matches data from snapshot-service)
interface Benchmark {
  key: string;
  dataKey: string;
  name: string;
  color: string;
}

const BENCHMARKS: Benchmark[] = [
  { key: "msciWorld", dataKey: "msciWorldValue", name: "MSCI World", color: "#f59e0b" },
  { key: "sp500", dataKey: "sp500Value", name: "S&P 500", color: "#ef4444" },
  { key: "nasdaq", dataKey: "nasdaqValue", name: "NASDAQ", color: "#8b5cf6" },
  { key: "cac40", dataKey: "cac40Value", name: "CAC 40", color: "#3b82f6" },
  { key: "btc", dataKey: "btcValue", name: "Bitcoin", color: "#fbbf24" },
  { key: "eth", dataKey: "ethValue", name: "Ethereum", color: "#6366f1" },
];

interface HistoryDataPoint {
  date: string;
  time?: string;
  portfolioValue: number;
  invested: number;
  msciWorldValue?: number;
  sp500Value?: number;
  nasdaqValue?: number;
  cac40Value?: number;
  btcValue?: number;
  ethValue?: number;
}

interface PortfolioChartProps {
  data: HistoryDataPoint[];
}

// Custom tooltip component
function CustomTooltip({ active, payload, label, displayMode }: any) {
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
              {displayMode === "performance" || entry.name?.includes("%")
                ? `${entry.value?.toFixed(2)}%`
                : new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function PortfolioChart({ data }: PortfolioChartProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark>(BENCHMARKS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"value" | "performance">("value");

  // Calculate performance data (base 100%)
  const performanceData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const first = data[0];
    const firstPortfolio = first.portfolioValue || 1;
    const firstBenchmark = (first as any)[selectedBenchmark.dataKey] || 1;
    const firstInvested = first.invested || 1;

    return data.map((point) => {
      const benchmarkValue = (point as any)[selectedBenchmark.dataKey] || 0;
      return {
        date: point.date,
        portfolioPerf: ((point.portfolioValue / firstPortfolio) - 1) * 100,
        investedPerf: ((point.invested / firstInvested) - 1) * 100,
        benchmarkPerf: firstBenchmark > 0 ? ((benchmarkValue / firstBenchmark) - 1) * 100 : 0,
      };
    });
  }, [data, selectedBenchmark]);

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-gray-500">
        <TrendingUp className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Aucun historique</p>
        <p className="text-sm text-gray-600 mt-1">
          Les snapshots sont créés toutes les 15 minutes
        </p>
      </div>
    );
  }

  // Prepare chart data based on display mode
  const chartData = displayMode === "value" 
    ? data.map(point => ({
        date: point.date,
        portfolioValue: point.portfolioValue,
        invested: point.invested,
        benchmarkValue: (point as any)[selectedBenchmark.dataKey] || 0,
      }))
    : performanceData;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Benchmark Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-750 transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedBenchmark.color }}
            />
            <span>Benchmark: {selectedBenchmark.name}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
              {BENCHMARKS.map((benchmark) => (
                <button
                  key={benchmark.key}
                  onClick={() => {
                    setSelectedBenchmark(benchmark);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    selectedBenchmark.key === benchmark.key
                      ? "bg-gray-700 text-white"
                      : "text-gray-300"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: benchmark.color }}
                  />
                  {benchmark.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display Mode Toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setDisplayMode("value")}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              displayMode === "value"
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Valeur (€)
          </button>
          <button
            onClick={() => setDisplayMode("performance")}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              displayMode === "performance"
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Performance (%)
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedBenchmark.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={selectedBenchmark.color} stopOpacity={0} />
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
                displayMode === "value"
                  ? new Intl.NumberFormat("fr-FR", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value)
                  : `${value.toFixed(0)}%`
              }
            />
            <Tooltip content={<CustomTooltip displayMode={displayMode} />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            
            {displayMode === "value" ? (
              <>
                <Area
                  type="monotone"
                  dataKey="portfolioValue"
                  name="Portfolio"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPortfolio)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  name="Investi"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="benchmarkValue"
                  name={selectedBenchmark.name}
                  stroke={selectedBenchmark.color}
                  fillOpacity={1}
                  fill="url(#colorBenchmark)"
                  strokeWidth={2}
                  connectNulls
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="portfolioPerf"
                  name="Portfolio %"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorPortfolio)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="benchmarkPerf"
                  name={`${selectedBenchmark.name} %`}
                  stroke={selectedBenchmark.color}
                  fillOpacity={1}
                  fill="url(#colorBenchmark)"
                  strokeWidth={2}
                  connectNulls
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
