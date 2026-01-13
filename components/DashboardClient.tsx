"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  Bitcoin,
  DollarSign,
  LineChart,
} from "lucide-react";
import PortfolioChart from "@/components/PortfolioChart";
import PeriodSelector, { TimePeriod, getDateRangeFromPeriod } from "@/components/PeriodSelector";

// Types
interface HoldingData {
  id: string;
  ticker: string;
  name: string;
  type: string;
  totalQuantity: number;
  pru: number;
  currentPrice: number;
  currentValue: number;
  totalInvestedEur: number;
  pnlEur: number;
  pnlPercent: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
}

interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  invested: number;
  theoreticalUnits?: number;
}

interface DashboardClientProps {
  holdings: HoldingData[];
  summary: PortfolioSummary;
  history: ChartDataPoint[];
}

// Helper to format currency
function formatEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Helper to format percentage
function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// Get asset type icon
function getAssetIcon(type: string) {
  switch (type) {
    case "CRYPTO":
      return <Bitcoin className="w-4 h-4" />;
    case "ETF":
      return <LineChart className="w-4 h-4" />;
    default:
      return <DollarSign className="w-4 h-4" />;
  }
}

// Get asset type badge color
function getAssetTypeColor(type: string): string {
  switch (type) {
    case "CRYPTO":
      return "bg-orange-500/20 text-orange-400";
    case "ETF":
      return "bg-blue-500/20 text-blue-400";
    case "STOCK":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export default function DashboardClient({ holdings, summary, history }: DashboardClientProps) {
  const [period, setPeriod] = useState<TimePeriod>("1m");

  // Filter history data based on selected period
  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    const { start } = getDateRangeFromPeriod(period);
    
    return history.filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= start;
    });
  }, [history, period]);

  // Calculate performance for the selected period
  const periodPerformance = useMemo(() => {
    if (filteredHistory.length < 2) {
      return {
        startValue: summary.totalInvested,
        endValue: summary.totalValue,
        change: summary.totalPnl,
        changePercent: summary.totalPnlPercent,
      };
    }

    const startPoint = filteredHistory[0];
    const endPoint = filteredHistory[filteredHistory.length - 1];
    
    const startValue = startPoint.portfolioValue;
    const endValue = endPoint.portfolioValue;
    const change = endValue - startValue;
    const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

    return { startValue, endValue, change, changePercent };
  }, [filteredHistory, summary]);

  const isPositive = periodPerformance.change >= 0;

  // Period labels for display
  const periodLabels: Record<TimePeriod, string> = {
    "24h": "24 heures",
    "7d": "7 jours",
    "1m": "1 mois",
    "3m": "3 mois",
    "6m": "6 mois",
    "1y": "1 an",
    "ytd": "Année en cours",
  };

  return (
    <div className="space-y-8">
      {/* Page Header with Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Performance sur {periodLabels[period].toLowerCase()}
          </p>
        </div>
        <PeriodSelector onChange={setPeriod} defaultPeriod="1m" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Valeur Totale</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatEur(summary.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Total Invested */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Investi</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatEur(summary.totalInvested)}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <PiggyBank className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Period PnL */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                PnL ({periodLabels[period]})
              </p>
              <p className={`text-2xl font-bold mt-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                {formatEur(periodPerformance.change)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isPositive ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {isPositive ? (
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Period Performance % */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                Performance ({periodLabels[period]})
              </p>
              <p className={`text-2xl font-bold mt-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(periodPerformance.changePercent)}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Chart */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Historique du Portfolio</h2>
          <span className="text-sm text-gray-400">
            {filteredHistory.length} points de données
          </span>
        </div>
        <PortfolioChart data={filteredHistory} />
      </div>

      {/* Holdings Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Positions</h2>
          <p className="text-gray-400 text-sm mt-1">Vos positions actuelles</p>
        </div>

        {holdings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
              <Wallet className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Aucune position</h3>
            <p className="text-gray-400">
              Ajoutez votre première transaction pour voir votre portfolio ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Asset
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Quantité
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    PRU
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Prix
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Valeur
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    PnL (€)
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Perf %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {holdings.map((holding) => {
                  const isProfitable = holding.pnlEur >= 0;
                  return (
                    <tr key={holding.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getAssetTypeColor(holding.type)}`}>
                            {getAssetIcon(holding.type)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{holding.ticker}</p>
                            <p className="text-sm text-gray-400">{holding.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono">
                        {holding.totalQuantity.toLocaleString("en-US", {
                          maximumFractionDigits: 8,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">
                        {formatEur(holding.pru)}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono">
                        {formatEur(holding.currentPrice)}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono font-medium">
                        {formatEur(holding.currentValue)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-mono font-medium ${
                          isProfitable ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {formatEur(holding.pnlEur)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            isProfitable
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {formatPercent(holding.pnlPercent)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
