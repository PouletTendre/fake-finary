import { addTransaction, getTransactions, deleteTransaction, getAssets } from "@/lib/actions";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, MinusCircle } from "lucide-react";
import TickerSearch from "@/components/TickerSearch";

// Helper to format currency
function formatEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Helper to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Get transaction type styles
function getTransactionTypeStyles(type: string) {
  switch (type) {
    case "BUY":
      return {
        icon: <ArrowUpCircle className="w-5 h-5" />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/20",
      };
    case "SELL":
      return {
        icon: <ArrowDownCircle className="w-5 h-5" />,
        color: "text-blue-400",
        bg: "bg-blue-500/20",
      };
    case "WITHDRAW":
      return {
        icon: <MinusCircle className="w-5 h-5" />,
        color: "text-orange-400",
        bg: "bg-orange-500/20",
      };
    default:
      return {
        icon: <ArrowUpCircle className="w-5 h-5" />,
        color: "text-gray-400",
        bg: "bg-gray-500/20",
      };
  }
}

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

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
              <ArrowUpCircle className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
            <p className="text-gray-400">
              Add your first transaction using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Asset
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Quantity
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Unit Price
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Fees
                  </th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Total (EUR)
                  </th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((tx) => {
                  const styles = getTransactionTypeStyles(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.color}`}>
                          {styles.icon}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{tx.asset.ticker}</p>
                          <p className="text-sm text-gray-400">{tx.asset.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono">
                        {tx.quantity.toLocaleString("en-US", { 
                          maximumFractionDigits: 8 
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">
                        {tx.unitPrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} {tx.currency}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono">
                        {formatEur(tx.fees)}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono font-medium">
                        {formatEur(tx.totalEur)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <form action={deleteTransaction.bind(null, tx.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
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
