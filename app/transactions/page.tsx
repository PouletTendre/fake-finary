import { getTransactions, getAssets, getCurrentExchangeRate } from "@/lib/actions";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";

export default async function TransactionsPage() {
  const [transactions, assets, currentRate] = await Promise.all([
    getTransactions(),
    getAssets(),
    getCurrentExchangeRate(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 mt-1">Log and manage your portfolio transactions</p>
      </div>

      {/* Add Transaction Form */}
      <TransactionForm assets={assets} currentRate={currentRate} />

      {/* Recent Transactions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <p className="text-gray-400 text-sm mt-1">Your transaction history</p>
        </div>

        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
