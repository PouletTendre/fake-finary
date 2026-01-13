"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChevronDown, Loader2, TrendingUp, TrendingDown, Calendar } from "lucide-react";

// Indices disponibles
interface Benchmark {
  key: string;
  name: string;
  color: string;
}

const BENCHMARKS: Benchmark[] = [
  { key: "MSCI_WORLD", name: "MSCI World", color: "#f59e0b" },
  { key: "SP500", name: "S&P 500", color: "#ef4444" },
  { key: "NASDAQ", name: "NASDAQ", color: "#8b5cf6" },
  { key: "CAC40", name: "CAC 40", color: "#3b82f6" },
  { key: "DAX", name: "DAX", color: "#ec4899" },
  { key: "FTSE100", name: "FTSE 100", color: "#14b8a6" },
  { key: "NIKKEI", name: "Nikkei 225", color: "#f97316" },
  { key: "BTC", name: "Bitcoin", color: "#fbbf24" },
  { key: "ETH", name: "Ethereum", color: "#6366f1" },
];

// Périodes disponibles
interface Period {
  key: string;
  name: string;
  days: number;
}

const PERIODS: Period[] = [
  { key: "1M", name: "1 Mois", days: 30 },
  { key: "3M", name: "3 Mois", days: 90 },
  { key: "6M", name: "6 Mois", days: 180 },
  { key: "1Y", name: "1 An", days: 365 },
  { key: "YTD", name: "YTD", days: -1 }, // Special case
  { key: "ALL", name: "Tout", days: -2 }, // Special case
];

interface HistoryDataPoint {
  date: string;
  portfolioValue: number;
  invested: number;
  theoreticalUnits?: number;
}

interface HistoryChartProps {
  initialData: HistoryDataPoint[];
}

// Custom tooltip
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
              {entry.value?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function HistoryChart({ initialData }: HistoryChartProps) {
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<Benchmark[]>([BENCHMARKS[0]]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<Record<string, { date: string; value: number }[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(PERIODS[3]); // 1 Year by default

  // Filter data by period
  const filteredData = (() => {
    if (!initialData || initialData.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;

    if (selectedPeriod.days === -1) {
      // YTD
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (selectedPeriod.days === -2) {
      // All time
      return initialData;
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - selectedPeriod.days);
    }

    return initialData.filter((d) => new Date(d.date) >= startDate);
  })();

  // Fetch benchmark data
  const fetchBenchmarkData = useCallback(async () => {
    if (!filteredData || filteredData.length === 0) return;

    setLoading(true);
    try {
      const startDate = filteredData[0].date;
      const results: Record<string, { date: string; value: number }[]> = {};

      await Promise.all(
        selectedBenchmarks.map(async (benchmark) => {
          const response = await fetch(
            `/api/benchmark?key=${benchmark.key}&startDate=${startDate}`
          );
          if (response.ok) {
            results[benchmark.key] = await response.json();
          }
        })
      );

      setBenchmarkData(results);
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBenchmarks, filteredData]);

  useEffect(() => {
    fetchBenchmarkData();
  }, [fetchBenchmarkData]);

  // Toggle benchmark selection
  const toggleBenchmark = (benchmark: Benchmark) => {
    setSelectedBenchmarks((prev) => {
      const exists = prev.find((b) => b.key === benchmark.key);
      if (exists) {
        return prev.filter((b) => b.key !== benchmark.key);
      } else {
        return [...prev, benchmark];
      }
    });
  };

  // Calculate performance data (normalized to 100 at start)
  const chartData = (() => {
    if (filteredData.length === 0) return [];

    const firstPortfolio = filteredData[0].portfolioValue || 1;

    return filteredData.map((point) => {
      const result: Record<string, any> = {
        date: point.date,
        portfolio: ((point.portfolioValue / firstPortfolio) - 1) * 100,
      };

      // Add benchmark data
      selectedBenchmarks.forEach((benchmark) => {
        const data = benchmarkData[benchmark.key];
        if (data && data.length > 0) {
          const first = data[0].value;
          const current = data.find((d) => d.date === point.date);
          if (current && first) {
            result[benchmark.key] = ((current.value / first) - 1) * 100;
          }
        }
      });

      return result;
    });
  })();

  // Calculate summary stats
  const stats = (() => {
    if (chartData.length === 0) return null;

    const lastPoint = chartData[chartData.length - 1];
    const portfolioPerf = lastPoint?.portfolio || 0;

    const benchmarkStats = selectedBenchmarks.map((b) => ({
      name: b.name,
      color: b.color,
      perf: lastPoint?.[b.key] || 0,
    }));

    return { portfolioPerf, benchmarkStats };
  })();

  if (!initialData || initialData.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-white mb-2">Aucun historique</h3>
        <p className="text-gray-400">
          Ajoutez des transactions pour voir l'évolution de votre portfolio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex bg-gray-800 rounded-lg p-1">
              {PERIODS.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    selectedPeriod.key === period.key
                      ? "bg-emerald-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {period.name}
                </button>
              ))}
            </div>
          </div>

          {/* Benchmark Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-750 transition-colors"
            >
              <span>Benchmarks ({selectedBenchmarks.length})</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {BENCHMARKS.map((benchmark) => {
                  const isSelected = selectedBenchmarks.some((b) => b.key === benchmark.key);
                  return (
                    <button
                      key={benchmark.key}
                      onClick={() => toggleBenchmark(benchmark)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                        isSelected ? "bg-gray-700" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-700"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: benchmark.color }}
                      />
                      <span className={isSelected ? "text-white" : "text-gray-300"}>
                        {benchmark.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Portfolio Performance */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Portfolio</p>
                <p className={`text-2xl font-bold ${stats.portfolioPerf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {stats.portfolioPerf >= 0 ? "+" : ""}{stats.portfolioPerf.toFixed(2)}%
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stats.portfolioPerf >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                {stats.portfolioPerf >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Benchmark Performances */}
          {stats.benchmarkStats.slice(0, 3).map((b) => (
            <div key={b.name} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{b.name}</p>
                  <p className={`text-2xl font-bold ${b.perf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {b.perf >= 0 ? "+" : ""}{b.perf.toFixed(2)}%
                  </p>
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Performance comparée ({selectedPeriod.name})
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
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
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />

              {/* Portfolio line */}
              <Line
                type="monotone"
                dataKey="portfolio"
                name="Portfolio"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />

              {/* Benchmark lines */}
              {selectedBenchmarks.map((benchmark) => (
                <Line
                  key={benchmark.key}
                  type="monotone"
                  dataKey={benchmark.key}
                  name={benchmark.name}
                  stroke={benchmark.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
