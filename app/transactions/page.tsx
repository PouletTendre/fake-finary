import { addTransaction, getTransactions, getAssets } from "@/lib/actions";
import { Plus } from "lucide-react";
import TickerSearch from "@/components/TickerSearch";
import TransactionList from "@/components/TransactionList";

export default async function TransactionsPage() {
  const [transactions, assets] = await Promise.all([
    getTransactions(),
    getAssets(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 mt-1">Log and manage your portfolio transactions</p>
      </div>

      {/* Add Transaction Form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-500" />
          Add New Transaction
        </h2>
        
        <form action={addTransaction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="WITHDRAW">Withdraw</option>
              </select>
            </div>

            {/* Ticker Search with Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ticker
              </label>
              <TickerSearch assets={assets} />
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                step="any"
                min="0"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>

            {/* Unit Price */}
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-300 mb-2">
                Unit Price
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                required
                step="any"
                min="0"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-2">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* Exchange Rate */}
            <div>
              <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-300 mb-2">
                Exchange Rate (EUR/USD)
              </label>
              <input
                type="number"
                id="exchangeRate"
                name="exchangeRate"
                step="any"
                min="0"
                placeholder="Auto (0.92)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>

            {/* Fees */}
            <div>
              <label htmlFor="fees" className="block text-sm font-medium text-gray-300 mb-2">
                Fees
              </label>
              <input
                type="number"
                id="fees"
                name="fees"
                step="any"
                min="0"
                placeholder="0.00"
                defaultValue="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>
          </div>
        </form>
      </div>

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
