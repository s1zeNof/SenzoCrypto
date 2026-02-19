import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Search, Trash2, Wallet, RefreshCw, Pencil } from 'lucide-react'
import { searchCoins, getCoinPrice, type CoinSearchResult } from '@/services/cryptoApi'
import { savePortfolio, getUserPortfolios, type Portfolio, type PortfolioAsset } from '@/services/firebase'

const EXCHANGES = ['Binance', 'Bybit', 'OKX', 'KuCoin', 'Gate.io', 'Bitget', 'Kraken', 'Coinbase']

export default function PortfolioManager() {
    const { user } = useAuth()
    const [portfolios, setPortfolios] = useState<Portfolio[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedExchange, setSelectedExchange] = useState('')
    const [showAddAsset, setShowAddAsset] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [amount, setAmount] = useState('')
    const [avgPrice, setAvgPrice] = useState('')
    const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(null)

    // Editing state
    const [editingAsset, setEditingAsset] = useState<PortfolioAsset | null>(null)

    useEffect(() => {
        if (user) loadPortfolios()
    }, [user])

    const loadPortfolios = async () => {
        if (!user) return
        setLoading(true)
        const data = await getUserPortfolios(user.uid)
        setPortfolios(data)
        setLoading(false)
    }

    const handleAddExchange = async (exchange: string) => {
        if (!user) return
        // Check if already exists
        if (portfolios.find(p => p.exchange === exchange && p.type === 'spot')) return

        const newPortfolio: Portfolio = {
            userId: user.uid,
            exchange,
            type: 'spot',
            assets: [],
            updatedAt: new Date()
        }

        await savePortfolio(user.uid, newPortfolio)
        loadPortfolios()
        setSelectedExchange(exchange)
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }
        setSearching(true)
        const results = await searchCoins(query)
        setSearchResults(results)
        setSearching(false)
    }

    const handleAddAsset = async () => {
        if (!user || !selectedCoin || !selectedExchange || !amount) return

        const portfolio = portfolios.find(p => p.exchange === selectedExchange && p.type === 'spot')
        if (!portfolio) return

        const currentPrice = await getCoinPrice(selectedCoin.id)

        const newAsset: PortfolioAsset = {
            coinId: selectedCoin.id,
            symbol: selectedCoin.symbol.toUpperCase(),
            name: selectedCoin.name,
            amount: parseFloat(amount),
            avgPrice: parseFloat(avgPrice) || currentPrice,
            image: selectedCoin.large
        }

        // Check if asset already exists and update it instead of adding new
        const existingAssetIndex = portfolio.assets.findIndex(a => a.symbol === newAsset.symbol)
        let updatedAssets

        if (existingAssetIndex >= 0) {
            updatedAssets = [...portfolio.assets]
            updatedAssets[existingAssetIndex] = {
                ...updatedAssets[existingAssetIndex],
                amount: updatedAssets[existingAssetIndex].amount + newAsset.amount,
                // Calculate new weighted average price
                avgPrice: ((updatedAssets[existingAssetIndex].amount * updatedAssets[existingAssetIndex].avgPrice) + (newAsset.amount * newAsset.avgPrice)) / (updatedAssets[existingAssetIndex].amount + newAsset.amount)
            }
        } else {
            updatedAssets = [...portfolio.assets, newAsset]
        }

        await savePortfolio(user.uid, { ...portfolio, assets: updatedAssets })

        setShowAddAsset(false)
        setSelectedCoin(null)
        setAmount('')
        setAvgPrice('')
        setSearchQuery('')
        loadPortfolios()
    }

    const handleEditClick = (asset: PortfolioAsset) => {
        setEditingAsset(asset)
        setAmount(asset.amount.toString())
        setAvgPrice(asset.avgPrice.toString())
        setShowAddAsset(true)
        // Mock selected coin for the modal to render correctly
        setSelectedCoin({
            id: asset.coinId,
            symbol: asset.symbol,
            name: asset.name,
            large: asset.image || '',
            market_cap_rank: 0
        })
    }

    const handleUpdateAsset = async () => {
        if (!user || !editingAsset || !selectedExchange || !amount) return

        const portfolio = portfolios.find(p => p.exchange === selectedExchange && p.type === 'spot')
        if (!portfolio) return

        const updatedAssets = portfolio.assets.map(asset => {
            if (asset.symbol === editingAsset.symbol) {
                return {
                    ...asset,
                    amount: parseFloat(amount),
                    avgPrice: parseFloat(avgPrice) || asset.avgPrice
                }
            }
            return asset
        })

        await savePortfolio(user.uid, { ...portfolio, assets: updatedAssets })

        setShowAddAsset(false)
        setEditingAsset(null)
        setSelectedCoin(null)
        setAmount('')
        setAvgPrice('')
        loadPortfolios()
    }

    const handleRemoveAsset = async (exchange: string, symbol: string) => {
        if (!user) return
        const portfolio = portfolios.find(p => p.exchange === exchange && p.type === 'spot')
        if (!portfolio) return

        const updatedAssets = portfolio.assets.filter(a => a.symbol !== symbol)
        await savePortfolio(user.uid, { ...portfolio, assets: updatedAssets })
        loadPortfolios()
    }

    const activePortfolio = portfolios.find(p => p.exchange === selectedExchange && p.type === 'spot')

    const closeModal = () => {
        setShowAddAsset(false)
        setEditingAsset(null)
        setSelectedCoin(null)
        setAmount('')
        setAvgPrice('')
        setSearchQuery('')
    }

    return (
        <div className="space-y-8">
            {/* Exchange Selector */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Мої Біржі
                </h3>
                <div className="flex flex-wrap gap-3">
                    {portfolios.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedExchange(p.exchange)}
                            className={`px-4 py-2 rounded-lg border transition-all ${selectedExchange === p.exchange
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-surface border-border hover:border-primary/50'
                                }`}
                        >
                            {p.exchange}
                        </button>
                    ))}

                    <div className="relative group">
                        <button className="px-4 py-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Додати біржу
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl p-2 hidden group-hover:block z-10">
                            {EXCHANGES.filter(e => !portfolios.find(p => p.exchange === e)).map(ex => (
                                <button
                                    key={ex}
                                    onClick={() => handleAddExchange(ex)}
                                    className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-md text-sm"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Assets */}
            {selectedExchange && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Активи на {selectedExchange}</h3>
                        <button
                            onClick={() => setShowAddAsset(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" /> Додати монету
                        </button>
                    </div>

                    {activePortfolio?.assets.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 text-sm border-b border-border">
                                        <th className="pb-3 pl-4">Монета</th>
                                        <th className="pb-3">Кількість</th>
                                        <th className="pb-3">Сер. Ціна</th>
                                        <th className="pb-3">Вартість</th>
                                        <th className="pb-3 pr-4">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {activePortfolio.assets.map((asset) => (
                                        <tr key={asset.symbol} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 pl-4">
                                                <div className="flex items-center gap-3">
                                                    {asset.image && <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-full" />}
                                                    <div>
                                                        <div className="font-bold">{asset.symbol}</div>
                                                        <div className="text-xs text-gray-400">{asset.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">{asset.amount}</td>
                                            <td className="py-4">${asset.avgPrice.toLocaleString()}</td>
                                            <td className="py-4 font-bold">${(asset.amount * asset.avgPrice).toLocaleString()}</td>
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditClick(asset)}
                                                        className="p-2 text-gray-500 hover:text-primary transition-colors"
                                                        title="Редагувати"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveAsset(selectedExchange, asset.symbol)}
                                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                                        title="Видалити"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            У вас ще немає активів на цій біржі. Додайте першу монету!
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Asset Modal */}
            {showAddAsset && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            {editingAsset ? 'Редагувати актив' : 'Додати монету'}
                        </h3>

                        {!selectedCoin ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Пошук монети (напр. BTC, Ethereum)"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {searching ? (
                                        <div className="text-center py-4 text-gray-400">Пошук...</div>
                                    ) : searchResults.map(coin => (
                                        <button
                                            key={coin.id}
                                            onClick={() => setSelectedCoin(coin)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left"
                                        >
                                            <img src={coin.large} alt={coin.symbol} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <div className="font-bold">{coin.symbol}</div>
                                                <div className="text-xs text-gray-400">{coin.name}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-4">
                                    <img src={selectedCoin.large} alt={selectedCoin.symbol} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <div className="font-bold text-lg">{selectedCoin.symbol}</div>
                                        <div className="text-sm text-gray-400">{selectedCoin.name}</div>
                                    </div>
                                    {!editingAsset && (
                                        <button
                                            onClick={() => setSelectedCoin(null)}
                                            className="ml-auto text-sm text-primary hover:underline"
                                        >
                                            Змінити
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Кількість</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Середня ціна купівлі (USDT)</label>
                                    <input
                                        type="number"
                                        value={avgPrice}
                                        onChange={(e) => setAvgPrice(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                                        placeholder="Залиште пустим для поточної ціни"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        Скасувати
                                    </button>
                                    <button
                                        onClick={editingAsset ? handleUpdateAsset : handleAddAsset}
                                        disabled={!amount}
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {editingAsset ? 'Зберегти' : 'Додати'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
