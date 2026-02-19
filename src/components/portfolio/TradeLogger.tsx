import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DollarSign, TrendingUp } from 'lucide-react'
import { addTradeAndUpdatePortfolio, type Trade } from '@/services/firebase'

const EXCHANGES = ['Binance', 'Bybit', 'OKX', 'KuCoin', 'Gate.io', 'Bitget', 'Kraken', 'Coinbase']

export default function TradeLogger({ onTradeAdded }: { onTradeAdded: () => void }) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        exchange: 'Bybit',
        pair: '',
        type: 'futures', // 'spot' | 'futures'
        side: 'long', // 'long' | 'short'
        pnl: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !formData.pair || !formData.pnl) return

        setLoading(true)
        try {
            const trade: Trade = {
                userId: user.id,
                exchange: formData.exchange,
                pair: formData.pair.toUpperCase(),
                type: formData.type as 'spot' | 'futures',
                side: formData.side as 'long' | 'short',
                pnl: parseFloat(formData.pnl),
                date: new Date(formData.date),
                notes: formData.notes,
                createdAt: new Date()
            }

            await addTradeAndUpdatePortfolio(user.id, trade)
            setFormData(prev => ({ ...prev, pair: '', pnl: '', notes: '' }))
            onTradeAdded()
        } catch (error) {
            console.error('Error adding trade:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Записати результат торгівлі
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Біржа</label>
                        <select
                            value={formData.exchange}
                            onChange={e => setFormData({ ...formData, exchange: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                        >
                            {EXCHANGES.map(ex => (
                                <option key={ex} value={ex}>{ex}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Дата</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Пара (напр. BTC/USDT)</label>
                        <input
                            type="text"
                            value={formData.pair}
                            onChange={e => setFormData({ ...formData, pair: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary uppercase"
                            placeholder="BTC/USDT"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Тип торгівлі</label>
                        <div className="flex bg-background rounded-lg p-1 border border-border">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'futures' })}
                                className={`flex-1 py-1 rounded-md text-sm transition-colors ${formData.type === 'futures' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Futures
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'spot' })}
                                className={`flex-1 py-1 rounded-md text-sm transition-colors ${formData.type === 'spot' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Spot
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Напрямок</label>
                        <div className="flex bg-background rounded-lg p-1 border border-border">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, side: 'long' })}
                                className={`flex-1 py-1 rounded-md text-sm transition-colors ${formData.side === 'long' ? 'bg-success/20 text-success' : 'text-gray-400 hover:text-white'}`}
                            >
                                Long
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, side: 'short' })}
                                className={`flex-1 py-1 rounded-md text-sm transition-colors ${formData.side === 'short' ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                Short
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">PnL (USDT)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                value={formData.pnl}
                                onChange={e => setFormData({ ...formData, pnl: e.target.value })}
                                className={`w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary ${parseFloat(formData.pnl) > 0 ? 'text-success' : parseFloat(formData.pnl) < 0 ? 'text-red-500' : ''
                                    }`}
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Нотатки (необов'язково)</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary h-20 resize-none"
                        placeholder="Стратегія, помилки, емоції..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !formData.pair || !formData.pnl}
                    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {loading ? 'Збереження...' : 'Записати результат'}
                </button>
            </form>
        </div>
    )
}
