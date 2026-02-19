const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

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
        const response = await fetch(`${COINGECKO_API_URL}/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search coins');
        const data = await response.json();
        return (data.coins || []).slice(0, 10); // Limit to top 10 results
    } catch (error) {
        console.error('Error searching coins:', error);
        return [];
    }
};

export const getCoinPrice = async (coinId: string): Promise<number> => {
    try {
        const response = await fetch(`${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`);
        if (!response.ok) throw new Error('Failed to fetch price');
        const data = await response.json();
        return data[coinId]?.usd || 0;
    } catch (error) {
        console.error('Error fetching coin price:', error);
        return 0;
    }
}

export const getCoinData = async (coinId: string) => {
    try {
        const response = await fetch(`${COINGECKO_API_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
        if (!response.ok) throw new Error('Failed to fetch coin data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching coin data:', error);
        return null;
    }
}

export const getTopGainers = async (): Promise<CoinSearchResult[]> => {
    try {
        const response = await fetch(`${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
        if (!response.ok) throw new Error('Failed to fetch top gainers');
        const data = await response.json();
        // Sort by price change percentage 24h desc
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
        const response = await fetch(`${COINGECKO_API_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`);
        if (!response.ok) throw new Error('Failed to fetch prices');
        return await response.json();
    } catch (error) {
        console.error('Error fetching coin prices:', error);
        return {};
    }
}
