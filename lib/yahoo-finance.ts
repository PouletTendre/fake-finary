import YahooFinance from "yahoo-finance2";

// Instancier yahoo-finance2 (requis depuis v3)
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Cache pour éviter trop de requêtes API
interface PriceCache {
  price: number;
  timestamp: number;
}

const priceCache: Map<string, PriceCache> = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minute

// Vider le cache au démarrage
priceCache.clear();
console.log('[YAHOO] Module loaded, cache cleared');

// Mapping des tickers crypto pour Yahoo Finance
const CRYPTO_TICKERS: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  ADA: "ADA-USD",
  DOT: "DOT-USD",
  AVAX: "AVAX-USD",
  MATIC: "MATIC-USD",
  LINK: "LINK-USD",
  UNI: "UNI-USD",
  XRP: "XRP-USD",
  DOGE: "DOGE-USD",
  SHIB: "SHIB-USD",
  LTC: "LTC-USD",
  BCH: "BCH-USD",
  ATOM: "ATOM-USD",
  FTM: "FTM-USD",
  NEAR: "NEAR-USD",
  ALGO: "ALGO-USD",
  XLM: "XLM-USD",
  VET: "VET-USD",
};

// Tokens exotiques mappés vers un proxy (valeur approximativement égale)
// Ces tokens n'ont pas de données sur Yahoo Finance
const PROXY_TICKERS: Record<string, string> = {
  // Staked ETH variants (≈ 1 ETH)
  "BETH": "ETH-USD",
  "BETH-USD": "ETH-USD",
  "STETH": "ETH-USD",
  "WSTETH": "ETH-USD",
  "CBETH": "ETH-USD",
  "RETH": "ETH-USD",
  // Wrapped BTC variants (≈ 1 BTC)
  "WBTC": "BTC-USD",
  "TBTC": "BTC-USD",
  "HBTC": "BTC-USD",
  // Stablecoins (≈ 1 USD)
  "USDT": "USDC-USD",
  "USDC": "USDC-USD",
  "DAI": "DAI-USD",
  "BUSD": "USDC-USD",
  "TUSD": "USDC-USD",
};

// Convertir ticker en format Yahoo Finance
function toYahooTicker(ticker: string, assetType?: string): string {
  const upperTicker = ticker.toUpperCase();
  
  // Si le ticker contient déjà -USD, le retourner tel quel
  if (upperTicker.endsWith("-USD")) {
    return upperTicker;
  }
  
  // Vérifier d'abord les proxies pour les tokens exotiques
  if (PROXY_TICKERS[upperTicker]) {
    console.log(`[YAHOO] Using proxy for ${upperTicker} -> ${PROXY_TICKERS[upperTicker]}`);
    return PROXY_TICKERS[upperTicker];
  }
  
  // Si c'est une crypto connue
  if (CRYPTO_TICKERS[upperTicker]) {
    return CRYPTO_TICKERS[upperTicker];
  }
  
  // Si le type est CRYPTO, ajouter -USD
  if (assetType === "CRYPTO") {
    return `${upperTicker}-USD`;
  }
  
  // Sinon, retourner tel quel (stocks, ETFs)
  return upperTicker;
}

// Récupérer le prix d'un actif
export async function getQuote(ticker: string, assetType?: string): Promise<number | null> {
  const yahooTicker = toYahooTicker(ticker, assetType);
  
  // Vérifier le cache
  const cached = priceCache.get(yahooTicker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[YAHOO] Cache hit for ${yahooTicker}: ${cached.price}`);
    return cached.price;
  }

  try {
    console.log(`[YAHOO] Fetching ${yahooTicker} from API...`);
    const quote = await yahooFinance.quote(yahooTicker);
    
    if (quote && quote.regularMarketPrice) {
      const price = quote.regularMarketPrice;
      console.log(`[YAHOO] Got ${yahooTicker}: ${price} ${quote.currency}`);
      
      // Mettre en cache
      priceCache.set(yahooTicker, {
        price,
        timestamp: Date.now(),
      });
      
      return price;
    }
    
    console.log(`[YAHOO] No price for ${yahooTicker}`);
    return null;
  } catch (error) {
    console.error(`[YAHOO] Error for ${yahooTicker}:`, error);
    return null;
  }
}

// Récupérer les prix de plusieurs actifs en parallèle
export async function getQuotes(
  tickers: { ticker: string; assetType?: string }[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  
  // Récupérer les prix en parallèle (par lots de 5 pour éviter les rate limits)
  const batchSize = 5;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    
    const promises = batch.map(async ({ ticker, assetType }) => {
      const price = await getQuote(ticker, assetType);
      if (price !== null) {
        results.set(ticker.toUpperCase(), price);
      }
    });
    
    await Promise.all(promises);
  }
  
  return results;
}

// Récupérer les données historiques
export async function getHistoricalPrices(
  ticker: string,
  assetType: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<{ date: Date; close: number }[]> {
  const yahooTicker = toYahooTicker(ticker, assetType);
  
  try {
    const result = await yahooFinance.historical(yahooTicker, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });
    
    return result.map((item) => ({
      date: item.date,
      close: item.close ?? 0,
    }));
  } catch (error) {
    console.error(`Erreur historique pour ${yahooTicker}:`, error);
    return [];
  }
}

// Récupérer le taux de change EUR/USD
export async function getEurUsdRate(): Promise<number> {
  const cached = priceCache.get("EURUSD=X");
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const quote = await yahooFinance.quote("EURUSD=X");
    
    if (quote && quote.regularMarketPrice) {
      const rate = quote.regularMarketPrice;
      
      priceCache.set("EURUSD=X", {
        price: rate,
        timestamp: Date.now(),
      });
      
      return rate;
    }
    
    return 1.09; // Fallback
  } catch (error) {
    console.error("Erreur taux EUR/USD:", error);
    return 1.09; // Fallback
  }
}

// Indices de marché disponibles pour le benchmark
export const MARKET_INDICES = {
  "MSCI_WORLD": { ticker: "URTH", name: "MSCI World", color: "#f59e0b" },
  "SP500": { ticker: "^GSPC", name: "S&P 500", color: "#ef4444" },
  "NASDAQ": { ticker: "^IXIC", name: "NASDAQ Composite", color: "#8b5cf6" },
  "CAC40": { ticker: "^FCHI", name: "CAC 40", color: "#3b82f6" },
  "DAX": { ticker: "^GDAXI", name: "DAX", color: "#ec4899" },
  "FTSE100": { ticker: "^FTSE", name: "FTSE 100", color: "#14b8a6" },
  "NIKKEI": { ticker: "^N225", name: "Nikkei 225", color: "#f97316" },
  "BTC": { ticker: "BTC-USD", name: "Bitcoin", color: "#fbbf24" },
  "ETH": { ticker: "ETH-USD", name: "Ethereum", color: "#6366f1" },
} as const;

export type BenchmarkKey = keyof typeof MARKET_INDICES;

// Récupérer l'historique d'un indice
export async function getIndexHistory(
  indexKey: BenchmarkKey,
  startDate: Date,
  endDate: Date = new Date()
): Promise<{ date: string; value: number }[]> {
  try {
    const index = MARKET_INDICES[indexKey];
    if (!index) return [];

    const result = await yahooFinance.chart(index.ticker, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    if (!result.quotes || result.quotes.length === 0) {
      console.warn(`[YAHOO] No data for index ${indexKey}`);
      return [];
    }

    return result.quotes
      .filter((q) => q.close !== null && q.close !== undefined)
      .map((q) => ({
        date: new Date(q.date).toISOString().split("T")[0],
        value: q.close as number,
      }));
  } catch (error) {
    console.error(`[YAHOO] Error fetching index ${indexKey}:`, error);
    return [];
  }
}

// Rechercher des tickers
export async function searchTickers(query: string): Promise<
  { symbol: string; name: string; type: string }[]
> {
  try {
    const results = await yahooFinance.search(query);
    
    return (results.quotes || [])
      .filter((q) => q.symbol && q.shortname)
      .slice(0, 10)
      .map((q) => ({
        symbol: q.symbol || "",
        name: q.shortname || q.longname || "",
        type: q.quoteType === "CRYPTOCURRENCY" ? "CRYPTO" : 
              q.quoteType === "ETF" ? "ETF" : "STOCK",
      }));
  } catch (error) {
    console.error("Erreur recherche:", error);
    return [];
  }
}

