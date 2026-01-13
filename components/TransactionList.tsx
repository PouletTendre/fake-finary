"use client";

import { useState } from "react";
import { Trash2, Pencil, X, Check, ArrowUpCircle, ArrowDownCircle, MinusCircle } from "lucide-react";
import { deleteTransaction, updateTransaction } from "@/lib/actions";

interface Transaction {
  id: string;
  date: Date;
  type: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  exchangeRate: number;
  fees: number;
  totalEur: number;
  asset: {
    id: string;
    ticker: string;
    name: string;
    type: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
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

// Helper to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Format date for input
function formatDateForInput(date: Date): string {
  return new Date(date).toISOString().split("T")[0];
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

export default function TransactionList({ transactions }: TransactionListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteTransaction(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Erreur suppression:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (id: string, formData: FormData) => {
    setIsUpdating(true);
    try {
      await updateTransaction(id, formData);
      setEditingId(null);
    } catch (error) {
      console.error("Erreur mise à jour:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
          <ArrowUpCircle className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
        <p className="text-gray-400">
          Add your first transaction using the form above.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Table */}
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
              const isEditing = editingId === tx.id;

              if (isEditing) {
                return (
                  <tr key={tx.id} className="bg-gray-800/70">
                    <td colSpan={8} className="px-6 py-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          handleUpdate(tx.id, formData);
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                          {/* Date */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Date</label>
                            <input
                              type="date"
                              name="date"
                              defaultValue={formatDateForInput(tx.date)}
                              required
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Type */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Type</label>
                            <select
                              name="type"
                              defaultValue={tx.type}
                              required
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="BUY">Buy</option>
                              <option value="SELL">Sell</option>
                              <option value="WITHDRAW">Withdraw</option>
                            </select>
                          </div>

                          {/* Asset (read-only) */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Asset</label>
                            <div className="bg-gray-600 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                              {tx.asset.ticker}
                            </div>
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                            <input
                              type="number"
                              name="quantity"
                              defaultValue={tx.quantity}
                              step="any"
                              required
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Unit Price */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Unit Price</label>
                            <input
                              type="number"
                              name="unitPrice"
                              defaultValue={tx.unitPrice}
                              step="any"
                              required
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Currency */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Currency</label>
                            <select
                              name="currency"
                              defaultValue={tx.currency}
                              required
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="EUR">EUR</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>

                          {/* Fees */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Fees</label>
                            <input
                              type="number"
                              name="fees"
                              defaultValue={tx.fees}
                              step="any"
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Exchange Rate (hidden, will use default) */}
                        <input type="hidden" name="exchangeRate" value={tx.exchangeRate} />

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              }

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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(tx.id)}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edit transaction"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(tx.id)}
                        className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
