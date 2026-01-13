"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Bitcoin, LineChart, DollarSign, Loader2, Globe } from "lucide-react";

interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: string;
}

interface YahooResult {
  symbol: string;
  name: string;
  type: string;
}

interface TickerSearchProps {
  assets: Asset[];
}

// Get asset type icon
function getAssetIcon(type: string) {
  switch (type) {
    case "CRYPTO":
      return <Bitcoin className="w-4 h-4 text-orange-400" />;
    case "ETF":
      return <LineChart className="w-4 h-4 text-blue-400" />;
    default:
      return <DollarSign className="w-4 h-4 text-purple-400" />;
  }
}

// Get asset type badge color
function getAssetTypeBadge(type: string): string {
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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function TickerSearch({ assets }: TickerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [yahooResults, setYahooResults] = useState<YahooResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  const debouncedSearch = useDebounce(search, 300);

  // Filter local assets based on search
  const filteredAssets = assets.filter(
    (asset) =>
      asset.ticker.toLowerCase().includes(search.toLowerCase()) ||
      asset.name.toLowerCase().includes(search.toLowerCase())
  );

  // Search Yahoo Finance when debounced search changes
  useEffect(() => {
    async function searchYahoo() {
      if (debouncedSearch.length < 2) {
        setYahooResults([]);
        return;
      }

      // Don't search if we have local results
      if (filteredAssets.length > 0) {
        setYahooResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`);
        const data = await response.json();
        setYahooResults(data.results || []);
      } catch (error) {
        console.error("Erreur recherche Yahoo:", error);
        setYahooResults([]);
      } finally {
        setIsSearching(false);
      }
    }

    searchYahoo();
  }, [debouncedSearch, filteredAssets.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle local asset selection
  const handleSelectLocal = (asset: Asset) => {
    setSelectedAsset(asset);
    setSearch(asset.ticker);
    setIsOpen(false);
    setYahooResults([]);
  };

  // Handle Yahoo result selection
  const handleSelectYahoo = (result: YahooResult) => {
    setSelectedAsset({
      id: "",
      ticker: result.symbol,
      name: result.name,
      type: result.type,
    });
    setSearch(result.symbol);
    setIsOpen(false);
    setYahooResults([]);
  };

  // Handle clear
  const handleClear = () => {
    setSelectedAsset(null);
    setSearch("");
    setYahooResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden inputs to pass values to form */}
      <input type="hidden" name="ticker" value={search.toUpperCase() || ""} />
      <input type="hidden" name="name" value={selectedAsset?.name || search.toUpperCase() || ""} />
      <input type="hidden" name="assetType" value={selectedAsset?.type || "STOCK"} />

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedAsset(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un ticker (BTC, AAPL...)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-16 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selected Asset Badge */}
      {selectedAsset && (
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getAssetTypeBadge(selectedAsset.type)}`}>
            {getAssetIcon(selectedAsset.type)}
            {selectedAsset.type}
          </span>
          <span className="text-sm text-gray-400">{selectedAsset.name}</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {/* Local Assets Section */}
          {filteredAssets.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-700 flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Mes assets ({filteredAssets.length})
              </div>
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectLocal(asset)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className={`p-1.5 rounded ${getAssetTypeBadge(asset.type)}`}>
                    {getAssetIcon(asset.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{asset.ticker}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getAssetTypeBadge(asset.type)}`}>
                        {asset.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{asset.name}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Yahoo Finance Results Section */}
          {yahooResults.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-700 flex items-center gap-2">
                <Globe className="w-3 h-3" />
                Résultats Yahoo Finance ({yahooResults.length})
              </div>
              {yahooResults.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => handleSelectYahoo(result)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                >
                  <div className={`p-1.5 rounded ${getAssetTypeBadge(result.type)}`}>
                    {getAssetIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{result.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getAssetTypeBadge(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{result.name}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Recherche en cours...</p>
            </div>
          )}

          {/* No Results */}
          {!isSearching && search.length >= 2 && filteredAssets.length === 0 && yahooResults.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-gray-400 text-sm mb-3">
                Aucun résultat pour "{search}"
              </p>
              <p className="text-xs text-gray-500">
                Tapez le ticker exact pour l'ajouter manuellement
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isSearching && search.length < 2 && filteredAssets.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Tapez au moins 2 caractères pour rechercher...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
