"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, Search } from "lucide-react";
import TickerSearch from "./TickerSearch";
import { addTransaction } from "@/lib/actions";

interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: string;
}

interface TransactionFormProps {
  assets: Asset[];
  currentRate: number;
}

// Devises principales avec leurs symboles
const CURRENCIES = [
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
];

export default function TransactionForm({ assets, currentRate }: TransactionFormProps) {
  const [currency, setCurrency] = useState("EUR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  // Filtrer les devises par recherche
  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
        setCurrencySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await addTransaction(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
    setCurrencyDropdownOpen(false);
    setCurrencySearch("");
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Plus className="w-5 h-5 text-emerald-500" />
        Add New Transaction
      </h2>
      
      <form action={handleSubmit} className="space-y-6">
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

          {/* Currency - Custom Dropdown with Search */}
          <div className="relative" ref={currencyDropdownRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <input type="hidden" name="currency" value={currency} />
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-between"
            >
              <span>
                {selectedCurrency.code} - {selectedCurrency.name} ({selectedCurrency.symbol})
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${currencyDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {currencyDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      placeholder="Search currency..."
                      autoFocus
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* Currency List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCurrencies.length === 0 ? (
                    <div className="px-4 py-3 text-gray-400 text-sm">No currency found</div>
                  ) : (
                    filteredCurrencies.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCurrencySelect(c.code)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                          currency === c.code ? "bg-emerald-600/20 text-emerald-400" : "text-white"
                        }`}
                      >
                        <span>
                          <span className="font-medium">{c.code}</span>
                          <span className="text-gray-400 ml-2">{c.name}</span>
                        </span>
                        <span className="text-gray-500">{c.symbol}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Exchange Rate - Only show if not EUR */}
          {currency !== "EUR" && (
            <div>
              <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-300 mb-2">
                Taux €/{currency} <span className="text-gray-500 text-xs">(1 {currency} = X€)</span>
              </label>
              <input
                type="number"
                id="exchangeRate"
                name="exchangeRate"
                step="any"
                min="0"
                placeholder={currency === "USD" ? `Auto (${currentRate.toFixed(4)})` : "Entrer le taux"}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
              />
            </div>
          )}

          {/* Fees */}
          <div>
            <label htmlFor="fees" className="block text-sm font-medium text-gray-300 mb-2">
              Fees ({currency})
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Transaction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
