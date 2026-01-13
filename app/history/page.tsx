import { getPortfolioHistory } from "@/lib/actions";
import HistoryChart from "@/components/HistoryChart";

export default async function HistoryPage() {
  const historyData = await getPortfolioHistory();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Portfolio History</h1>
        <p className="text-gray-400 mt-1">
          Track your portfolio performance over time and compare with market indices
        </p>
      </div>

      {/* History Chart with Benchmark Selection */}
      <HistoryChart initialData={historyData} />
    </div>
  );
}
