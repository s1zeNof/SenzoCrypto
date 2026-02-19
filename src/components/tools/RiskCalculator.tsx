import { useState, useEffect } from 'react'
import { Calculator, AlertTriangle, DollarSign, Percent, Search, X, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import { searchCoins, getCoinPrice, type CoinSearchResult } from '@/services/cryptoApi'

// Helper Tooltip Component
const InfoTooltip = ({ content }: { content: string }) => (
    <div className="group relative inline-block ml-1">
        <HelpCircle className="w-3 h-3 text-gray-500 hover:text-primary cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 border border-border rounded text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
        </div>
    </div>
)

export default function RiskCalculator() {
    // Mode: 'margin' (Input Margin + Leverage) or 'risk' (Input Risk % + Balance)
    const [mode, setMode] = useState<'margin' | 'risk'>('margin')

    // Inputs
    const [balance, setBalance] = useState<string>('1000')
    const [margin, setMargin] = useState<string>('100') // For margin mode
    const [leverage, setLeverage] = useState<number>(10)
    const [riskPercent, setRiskPercent] = useState<string>('1') // For risk mode

    const [entryPrice, setEntryPrice] = useState<string>('')
    const [stopLoss, setStopLoss] = useState<string>('')
    const [takeProfit, setTakeProfit] = useState<string>('')

    // Coin Search
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([])
    const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(null)
    const [isSearching, setIsSearching] = useState(false)

    const [results, setResults] = useState<{
        positionSize: number // in coins
        positionValue: number // in USDT (Total)
        marginRequired: number // in USDT (Wallet)
        riskAmount: number // in USDT
        riskPercent: number // % of balance
        rewardAmount: number // in USDT
        rrRatio: number // Risk/Reward Ratio
        liquidationPrice?: number
    } | null>(null)

    // Search Handler
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true)
                const results = await searchCoins(searchQuery)
                setSearchResults(results)
                setIsSearching(false)
            } else {
                setSearchResults([])
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const selectCoin = async (coin: CoinSearchResult) => {
        setSelectedCoin(coin)
        setSearchQuery('')
        setSearchResults([])
        const price = await getCoinPrice(coin.id)
        if (price) setEntryPrice(price.toString())
    }

    // Calculation Logic
    useEffect(() => {
        calculateRisk()
    }, [balance, margin, leverage, riskPercent, entryPrice, stopLoss, takeProfit, mode])

    const calculateRisk = () => {
        const bal = parseFloat(balance) || 0
        const entry = parseFloat(entryPrice) || 0
        const stop = parseFloat(stopLoss) || 0
        const tp = parseFloat(takeProfit) || 0
        const lev = leverage
        const marg = parseFloat(margin) || 0
        const riskPct = parseFloat(riskPercent) || 0

        if (!entry) {
            setResults(null)
            return
        }

        let positionValue = 0
        let marginRequired = 0

        if (mode === 'margin') {
            marginRequired = marg
            positionValue = marg * lev
        } else {
            // Risk Mode: Calculate Position based on Risk Amount and Stop Loss distance
            if (!stop || !bal || !riskPct) {
                setResults(null)
                return
            }
            const riskAmount = bal * (riskPct / 100)
            const priceDiffPercent = Math.abs(entry - stop) / entry
            if (priceDiffPercent === 0) return

            positionValue = riskAmount / priceDiffPercent
            marginRequired = positionValue / lev
        }

        const positionSize = positionValue / entry

        // Risk Calculation
        let riskAmount = 0
        if (stop) {
            const priceDiff = Math.abs(entry - stop)
            riskAmount = positionSize * priceDiff
        }

        // Reward Calculation
        let rewardAmount = 0
        if (tp) {
            const priceDiff = Math.abs(tp - entry)
            rewardAmount = positionSize * priceDiff
        }

        const rrRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0
        const calculatedRiskPercent = bal > 0 ? (riskAmount / bal) * 100 : 0

        // Liquidation Approx (Isolated)
        // Long: Entry - (Entry / Lev)
        // Short: Entry + (Entry / Lev)
        // Simplified for now (assuming Long logic for display or generic)
        const liqPrice = entry - (entry / lev) // Very rough approx for Long

        setResults({
            positionSize,
            positionValue,
            marginRequired,
            riskAmount,
            riskPercent: calculatedRiskPercent,
            rewardAmount,
            rrRatio,
            liquidationPrice: liqPrice
        })
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold">Калькулятор Позиції</h2>
                </div>
                <div className="flex bg-surface rounded-lg p-1">
                    <button
                        onClick={() => setMode('margin')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'margin' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        По Маржі
                    </button>
                    <button
                        onClick={() => setMode('risk')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'risk' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        По Ризику %
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {/* Coin Search */}
                    <div className="relative z-20">
                        <label className="block text-sm text-gray-400 mb-1">Монета</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={selectedCoin ? selectedCoin.name : searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setSelectedCoin(null)
                                }}
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                                placeholder="Пошук (напр. BTC)..."
                            />
                            {selectedCoin && (
                                <button
                                    onClick={() => { setSelectedCoin(null); setSearchQuery(''); setEntryPrice('') }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {searchResults.length > 0 && !selectedCoin && (
                            <div className="absolute w-full bg-surface border border-border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl">
                                {searchResults.map(coin => (
                                    <button
                                        key={coin.id}
                                        onClick={() => selectCoin(coin)}
                                        className="w-full flex items-center gap-2 p-2 hover:bg-white/5 text-left"
                                    >
                                        <img src={coin.large} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                                        <span className="font-bold">{coin.symbol.toUpperCase()}</span>
                                        <span className="text-xs text-gray-400">{coin.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Leverage Slider */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Плече (Leverage)</span>
                            <span className="font-bold text-primary">{leverage}x</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={leverage}
                            onChange={(e) => setLeverage(parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1x</span>
                            <span>20x</span>
                            <span>50x</span>
                            <span>100x</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 flex items-center">
                                Депозит ($)
                                <InfoTooltip content="Ваш загальний баланс на біржі (Total Balance). Використовується для розрахунку % ризику від всього капіталу." />
                            </label>
                            <input
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 flex items-center justify-between">
                                <div className="flex items-center">
                                    {mode === 'margin' ? 'Ваша Інвестиція ($)' : 'Ризик (%)'}
                                    <InfoTooltip content={mode === 'margin'
                                        ? "Сума, яку ви виділяєте на цю конкретну угоду (Cost). Це ваші власні кошти в угоді без урахування плеча."
                                        : "Відсоток від Депозиту, який ви готові втратити, якщо ціна дійде до Стоп-Лосу."}
                                    />
                                </div>
                                {mode === 'margin' && (
                                    <button
                                        onClick={() => setMargin(balance)}
                                        className="text-xs text-primary hover:text-primary-hover"
                                    >
                                        MAX
                                    </button>
                                )}
                            </label>
                            <input
                                type="number"
                                value={mode === 'margin' ? margin : riskPercent}
                                onChange={(e) => mode === 'margin' ? setMargin(e.target.value) : setRiskPercent(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Вхід</label>
                            <input
                                type="number"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary"
                                placeholder="Price"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-red-400 mb-1">Stop Loss</label>
                            <input
                                type="number"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(e.target.value)}
                                className="w-full bg-background border border-red-500/30 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-red-500"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-green-400 mb-1">Take Profit</label>
                            <input
                                type="number"
                                value={takeProfit}
                                onChange={(e) => setTakeProfit(e.target.value)}
                                className="w-full bg-background border border-green-500/30 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-500"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-surface/50 rounded-xl p-6 border border-border flex flex-col justify-center h-full">
                    {results ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Загальний об'єм позиції</div>
                                    <div className="text-xl font-bold text-white">
                                        ${results.positionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {results.positionSize.toLocaleString(undefined, { maximumFractionDigits: 4 })} coins
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Ваша Маржа (Cost)</div>
                                    <div className="text-xl font-bold text-primary">
                                        ${results.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Ризик (Stop Loss)</span>
                                    <div className="text-right">
                                        <div className="font-bold text-red-500">-${results.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                        <div className="text-xs text-gray-500">{results.riskPercent.toFixed(2)}% від депо</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Прибуток (Take Profit)</span>
                                    <div className="text-right">
                                        <div className="font-bold text-success">+${results.rewardAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                        <div className="text-xs text-gray-500">R:R {results.rrRatio.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            {parseFloat(balance) < results.marginRequired && (
                                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>Недостатньо балансу для цієї маржі!</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Calculator className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Введіть дані для розрахунку</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
