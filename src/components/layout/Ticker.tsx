import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTopGainers, getCoinsPrices } from '@/services/cryptoApi'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TickerCoin {
    id: string
    symbol: string
    price: number
    change24h: number
}

export default function Ticker() {
    const { user, userData } = useAuth()
    const [coins, setCoins] = useState<TickerCoin[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTickerData()
        const interval = setInterval(fetchTickerData, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [user, userData?.tickerCoins])

    const fetchTickerData = async () => {
        try {
            let tickerData: TickerCoin[] = []

            if (user && userData?.tickerCoins?.length) {
                // Fetch user selected coins
                const prices = await getCoinsPrices(userData.tickerCoins)
                tickerData = userData.tickerCoins.map(coinId => ({
                    id: coinId,
                    symbol: coinId.toUpperCase(), // Approximate symbol, ideal would be to store symbol too
                    price: prices[coinId]?.usd || 0,
                    change24h: prices[coinId]?.usd_24h_change || 0
                }))
            } else {
                // Default: BTC, ETH + Top 3 Gainers
                const defaultCoins = ['bitcoin', 'ethereum']
                const prices = await getCoinsPrices(defaultCoins)
                const topGainers = await getTopGainers()

                const defaultTicker = defaultCoins.map(id => ({
                    id,
                    symbol: id === 'bitcoin' ? 'BTC' : 'ETH',
                    price: prices[id]?.usd || 0,
                    change24h: prices[id]?.usd_24h_change || 0
                }))

                const gainersTicker = topGainers.map(coin => ({
                    id: coin.id,
                    symbol: coin.symbol.toUpperCase(),
                    price: coin.current_price || 0,
                    change24h: coin.price_change_percentage_24h || 0
                }))

                tickerData = [...defaultTicker, ...gainersTicker]
            }

            setCoins(tickerData)
        } catch (error) {
            console.error('Error fetching ticker data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading && coins.length === 0) return null

    return (
        <div className="hidden md:flex items-center gap-6 overflow-x-auto no-scrollbar max-w-xl mask-linear-fade">
            {coins.map(coin => (
                <div key={coin.id} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                    <span className="text-foreground-muted font-medium">{coin.symbol}</span>
                    <span className={`font-semibold ${coin.change24h >= 0 ? 'text-success' : 'text-red-500'}`}>
                        ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs flex items-center ${coin.change24h >= 0 ? 'text-success' : 'text-red-500'}`}>
                        {coin.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(coin.change24h).toFixed(1)}%
                    </span>
                </div>
            ))}
        </div>
    )
}
