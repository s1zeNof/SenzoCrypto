import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getTradesForDate, updateTradeAndPortfolio, deleteTrade, type Trade } from '@/services/firebase'
import { ArrowLeft, Calendar, Save, Trash2, X, Edit2, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function DailyTrades() {
    const { date } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [editingTradeId, setEditingTradeId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Trade>>({})

    useEffect(() => {
        if (user && date) {
            loadTrades()
        }
    }, [user, date])

    const loadTrades = async () => {
        if (!user || !date) return
        setLoading(true)
        const data = await getTradesForDate(user.id, new Date(date))
        setTrades(data)
        setLoading(false)
    }

    const handleEditClick = (trade: Trade) => {
        setEditingTradeId(trade.id!)
        setEditForm({
            pair: trade.pair,
            pnl: trade.pnl,
            notes: trade.notes,
            side: trade.side,
            type: trade.type,
            exchange: trade.exchange
        })
    }

    const handleSave = async (tradeId: string) => {
        if (!user) return
        const oldTrade = trades.find(t => t.id === tradeId)
        if (!oldTrade) return

        try {
            await updateTradeAndPortfolio(user.id, tradeId, oldTrade, editForm)
            setEditingTradeId(null)
            loadTrades() // Reload to see updates
        } catch (error) {
            console.error('Failed to update trade:', error)
        }
    }

    const handleDelete = async (tradeId: string) => {
        if (!user) return
        if (window.confirm('Ви впевнені, що хочете видалити цю угоду?')) {
            try {
                await deleteTrade(user.id, tradeId)
                loadTrades()
            } catch (error) {
                console.error('Failed to delete trade:', error)
            }
        }
    }

    if (!date) return null

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        Торговий журнал
                    </h1>
                    <p className="text-gray-400">
                        {format(new Date(date), 'd MMMM yyyy', { locale: uk })}
                    </p>
                </div>
            </div>

            {/* Trades List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Завантаження...</div>
            ) : trades.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-surface/50 rounded-xl border border-border">
                    Немає угод за цей день
                </div>
            ) : (
                <div className="space-y-4">
                    {trades.map(trade => (
                        <div key={trade.id} className="bg-surface border border-border rounded-xl p-6 transition-all hover:border-primary/50">
                            {editingTradeId === trade.id ? (
                                // Edit Mode
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Пара</label>
                                            <input
                                                type="text"
                                                value={editForm.pair}
                                                onChange={e => setEditForm({ ...editForm, pair: e.target.value.toUpperCase() })}
                                                className="w-full bg-black/20 border border-border rounded px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">PnL (USDT)</label>
                                            <input
                                                type="number"
                                                value={editForm.pnl}
                                                onChange={e => setEditForm({ ...editForm, pnl: parseFloat(e.target.value) })}
                                                className="w-full bg-black/20 border border-border rounded px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Напрямок</label>
                                            <select
                                                value={editForm.side}
                                                onChange={e => setEditForm({ ...editForm, side: e.target.value as 'long' | 'short' })}
                                                className="w-full bg-black/20 border border-border rounded px-3 py-2"
                                            >
                                                <option value="long">Long</option>
                                                <option value="short">Short</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Тип</label>
                                            <select
                                                value={editForm.type}
                                                onChange={e => setEditForm({ ...editForm, type: e.target.value as 'spot' | 'futures' })}
                                                className="w-full bg-black/20 border border-border rounded px-3 py-2"
                                            >
                                                <option value="futures">Futures</option>
                                                <option value="spot">Spot</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Нотатки</label>
                                        <textarea
                                            value={editForm.notes}
                                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                            className="w-full bg-black/20 border border-border rounded px-3 py-2 min-h-[80px]"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingTradeId(null)}
                                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            onClick={() => handleSave(trade.id!)}
                                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> Зберегти
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`font-bold text-lg ${trade.side === 'long' ? 'text-success' : 'text-red-500'} uppercase`}>
                                                {trade.side}
                                            </span>
                                            <span className="font-bold text-xl">{trade.pair}</span>
                                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded uppercase border border-white/10">
                                                {trade.exchange}
                                            </span>
                                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded uppercase border border-white/10">
                                                {trade.type}
                                            </span>
                                        </div>
                                        {trade.notes && (
                                            <p className="text-gray-400 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                                                {trade.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 mb-1">PnL</div>
                                            <div className={`text-2xl font-bold font-mono ${trade.pnl >= 0 ? 'text-success' : 'text-red-500'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl}$
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pl-6 border-l border-border">
                                            <button
                                                onClick={() => handleEditClick(trade)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Редагувати"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(trade.id!)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Видалити"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
