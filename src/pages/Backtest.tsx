import { useState, useEffect, useMemo } from 'react'
import { Plus, FlaskConical, LayoutGrid, List, TrendingUp, TrendingDown, BarChart2, Target, Loader2, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BacktestService, type BacktestStrategy } from '@/services/BacktestService'
import BacktestStrategyCard from '@/components/backtest/BacktestStrategyCard'
import CreateBacktestModal from '@/components/backtest/CreateBacktestModal'
import { toast } from 'sonner'

type ViewMode = 'grid' | 'list'
type Filter = 'all' | 'profit' | 'loss' | 'empty'

export default function Backtest() {
    const { user } = useAuth()
    const [strategies, setStrategies] = useState<BacktestStrategy[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [view, setView] = useState<ViewMode>('grid')
    const [filter, setFilter] = useState<Filter>('all')
    const [search, setSearch] = useState('')

    const fetchStrategies = async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await BacktestService.getStrategies(user.id)
            setStrategies(data)
        } catch (e: any) {
            toast.error('Помилка завантаження: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchStrategies() }, [user])

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити цей бектест і всі його угоди?')) return
        try {
            await BacktestService.deleteStrategy(id)
            setStrategies(prev => prev.filter(s => s.id !== id))
            toast.success('Бектест видалено')
        } catch (e: any) {
            toast.error('Помилка: ' + e.message)
        }
    }

    const handleCreated = (s: BacktestStrategy) => {
        setStrategies(prev => [{ ...s, stats: undefined, trade_count: 0 }, ...prev])
    }

    // ─── Aggregate stats ──────────────────────────────────────────────────────
    const totalPnl = strategies.reduce((s, x) => s + (x.stats?.totalPnl ?? 0), 0)
    const totalTrades = strategies.reduce((s, x) => s + (x.trade_count ?? 0), 0)
    const strategiesWithTrades = strategies.filter(s => (s.trade_count ?? 0) > 0)
    const avgWinRate = strategiesWithTrades.length > 0
        ? strategiesWithTrades.reduce((s, x) => s + (x.stats?.winRate ?? 0), 0) / strategiesWithTrades.length
        : 0

    // ─── Filtered list ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = strategies
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.symbol.toLowerCase().includes(q) ||
                s.tags.some(t => t.includes(q))
            )
        }
        if (filter === 'profit') list = list.filter(s => (s.stats?.totalPnl ?? 0) > 0)
        if (filter === 'loss')   list = list.filter(s => (s.stats?.totalPnl ?? 0) < 0)
        if (filter === 'empty')  list = list.filter(s => (s.trade_count ?? 0) === 0)
        return list
    }, [strategies, filter, search])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                        <FlaskConical className="w-7 h-7 text-primary" />
                        Бектести
                    </h1>
                    <p className="text-sm text-gray-500">Записуй та аналізуй результати своїх торгових стратегій</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Новий бектест
                </button>
            </div>

            {/* Summary cards */}
            {strategies.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryCard label="Стратегій"    value={strategies.length.toString()} icon={<BarChart2 className="w-4 h-4" />}  color="blue" />
                    <SummaryCard label="Всього угод"  value={totalTrades.toString()}         icon={<Target className="w-4 h-4" />}     color="purple" />
                    <SummaryCard label="Сер. Win Rate" value={`${avgWinRate.toFixed(1)}%`}
                        icon={avgWinRate >= 50 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        color={avgWinRate >= 50 ? 'green' : 'red'} />
                    <SummaryCard label="Загальний PnL" value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`}
                        icon={totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        color={totalPnl >= 0 ? 'green' : 'red'} />
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Пошук по назві, символу, тегу..."
                        className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>

                {/* Filter pills */}
                <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
                    {([
                        { key: 'all',    label: 'Всі' },
                        { key: 'profit', label: '📈 Профіт' },
                        { key: 'loss',   label: '📉 Збиток' },
                        { key: 'empty',  label: '⬜ Порожні' },
                    ] as { key: Filter; label: string }[]).map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all font-medium whitespace-nowrap ${
                                filter === f.key
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                            }`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* View toggle */}
                <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
                    <button onClick={() => setView('grid')}
                        className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-surface-hover'}`}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setView('list')}
                        className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-surface-hover'}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 && strategies.length === 0 ? (
                <EmptyState onCreate={() => setIsCreateOpen(true)} />
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-surface/30 border border-dashed border-border rounded-2xl">
                    <p className="text-gray-500">Нічого не знайдено за вашим фільтром</p>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(s => (
                        <BacktestStrategyCard key={s.id} strategy={s} view="grid" onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(s => (
                        <BacktestStrategyCard key={s.id} strategy={s} view="list" onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <CreateBacktestModal
                isOpen={isCreateOpen}
                userId={user?.id ?? ''}
                onClose={() => setIsCreateOpen(false)}
                onCreated={handleCreated}
            />
        </div>
    )
}

function SummaryCard({ label, value, icon, color }: {
    label: string; value: string; icon: React.ReactNode
    color: 'blue' | 'purple' | 'green' | 'red'
}) {
    const colors = {
        blue:   'bg-blue-500/10 text-blue-400',
        purple: 'bg-purple-500/10 text-purple-400',
        green:  'bg-green-500/10 text-green-400',
        red:    'bg-red-500/10 text-red-400',
    }
    return (
        <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${colors[color]}`}>{icon}</div>
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-bold">{value}</p>
        </div>
    )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="text-center py-20 bg-surface/30 border border-dashed border-border rounded-2xl">
            <div className="inline-block p-4 rounded-full bg-surface border border-border mb-4">
                <FlaskConical className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Немає бектестів</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-6">
                Створи свій перший бектест — запиши угоди, які ти вже провів на TradingView або симуляторі
            </p>
            <button onClick={onCreate}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors inline-flex items-center gap-2 font-medium">
                <Plus className="w-4 h-4" />
                Створити бектест
            </button>
        </div>
    )
}
