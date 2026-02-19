const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache to avoid repeated identical requests
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

async function cachedFetch(url: string) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return data;
}

export interface CoinSearchResult {
    id: string;
    symbol: string;
    name: string;
    large: string; // image url
    market_cap_rank?: number;
}

export const searchCoins = async (query: string): Promise<CoinSearchResult[]> => {
    if (!query || query.length < 2) return [];
    try {
        const data = await cachedFetch(`${COINGECKO_API_URL}/search?query=${encodeURIComponent(query)}`);
        return (data.coins || []).slice(0, 10);
    } catch (error) {
        console.error('Error searching coins:', error);
        return [];
    }
};

export const getCoinPrice = async (coinId: string): Promise<number> => {
    try {
        const data = await cachedFetch(`${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`);
        return data[coinId]?.usd || 0;
    } catch (error) {
        console.error('Error fetching coin price:', error);
        return 0;
    }
}

export const getCoinData = async (coinId: string) => {
    try {
        return await cachedFetch(`${COINGECKO_API_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
    } catch (error) {
        console.error('Error fetching coin data:', error);
        return null;
    }
}

export const getTopGainers = async (): Promise<CoinSearchResult[]> => {
    try {
        const data = await cachedFetch(`${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
        return data
            .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
            .slice(0, 3)
            .map((coin: any) => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                large: coin.image,
                current_price: coin.current_price,
                price_change_percentage_24h: coin.price_change_percentage_24h
            }));
    } catch (error) {
        console.error('Error fetching top gainers:', error);
        return [];
    }
}

export const getCoinsPrices = async (coinIds: string[]) => {
    if (!coinIds.length) return {};
    try {
        return await cachedFetch(`${COINGECKO_API_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`);
    } catch (error) {
        console.error('Error fetching coin prices:', error);
        return {};
    }
}
