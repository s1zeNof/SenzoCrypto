import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown,
    BarChart2, Target, Activity, Award, FlaskConical,
    ChevronDown, ChevronUp, Loader2, Edit2, Check, X,
    CheckSquare, Square, BookOpen, PlusCircle,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { BacktestService, type BacktestStrategy, type BacktestTrade } from '@/services/BacktestService'
import { calculateBacktestStats } from '@/utils/backtestStats'
import { toast } from 'sonner'

const TIMEFRAMES = ['1m','5m','15m','30m','1H','2H','4H','8H','12H','1D','3D','1W','1M']

// ─── Вбудований чек-лист професійних питань ──────────────────────────────────
const DEFAULT_CHECKLIST: { id: string; category: string; text: string }[] = [
    // Тренд і контекст
    { id: 'trend_htf',    category: 'Тренд',     text: 'Тренд на старшому ТФ підтверджує напрям угоди?' },
    { id: 'trend_align',  category: 'Тренд',     text: 'Усі таймфрейми (HTF / MTF / LTF) в одному напрямку?' },
    { id: 'market_phase', category: 'Тренд',     text: 'Ринок в фазі тренду, а не флету/розподілу?' },
    // Рівні та структура
    { id: 'key_level',    category: 'Структура', text: 'Вхід відбувається від ключового рівня (підтримка/опір, OB, FVG)?' },
    { id: 'bos',          category: 'Структура', text: 'Є підтвердження зламу структури (BOS/CHoCH)?' },
    { id: 'liquidity',    category: 'Структура', text: 'Ліквідність знята перед входом?' },
    { id: 'fvg',          category: 'Структура', text: 'Є незакритий FVG / імбаланс у зоні входу?' },
    // Підтвердження входу
    { id: 'entry_signal', category: 'Вхід',      text: 'Є чіткий сигнал входу по моїй стратегії?' },
    { id: 'candle_conf',  category: 'Вхід',      text: 'Свічка підтвердження закрилась у потрібному місці?' },
    { id: 'volume',       category: 'Вхід',      text: 'Обсяг підтверджує рух (зростаючий у напрямку угоди)?' },
    { id: 'session',      category: 'Вхід',      text: 'Вхід відбувається в активну сесію (Лондон / Нью-Йорк)?' },
    // Ризик-менеджмент
    { id: 'sl_valid',     category: 'Ризик',     text: 'Стоп-лосс розміщений за структурним рівнем, а не "на очко"?' },
    { id: 'rr_ratio',     category: 'Ризик',     text: 'Risk/Reward ≥ 1:2?' },
    { id: 'risk_pct',     category: 'Ризик',     text: 'Ризик на угоду ≤ 1-2% від депозиту?' },
    { id: 'no_revenge',   category: 'Ризик',     text: 'Угода не є помстою після попереднього збитку?' },
    // Психологія
    { id: 'plan_trade',   category: 'Психологія', text: 'Угода запланована заздалегідь, а не імпульсивно?' },
    { id: 'no_fomo',      category: 'Психологія', text: 'Відсутній FOMO (страх пропустити рух)?' },
    { id: 'clear_mind',   category: 'Психологія', text: 'Торгую з ясним розумом (не втомлений, не під стресом)?' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────
function calcTrade(entry: number, exit: number, sl: number | undefined, side: 'long'|'short', size: number, capital: number) {
    const dir = side === 'long' ? 1 : -1
    const pnl = dir * (exit - entry) * size
    const pnlPct = (pnl / capital) * 100
    let rMultiple = 0
    if (sl && sl !== entry) {
        const risk = Math.abs(entry - sl) * size
        rMultiple = risk > 0 ? pnl / risk : 0
    }
    const status: BacktestTrade['status'] = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven'
    return { pnl, pnlPct, rMultiple, status }
}

const emptyForm = () => ({
    pair: '', timeframe: '1H', side: 'long' as 'long'|'short',
    entry_price: '', exit_price: '', stop_loss: '', take_profit: '',
    size: '', entry_time: '', exit_time: '',
    screenshot_url: '', notes: '',
})

export default function BacktestDetail() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()

    const [strategy, setStrategy] = useState<BacktestStrategy | null>(null)
    const [trades, setTrades] = useState<BacktestTrade[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(emptyForm())
    const [editingId, setEditingId] = useState<string | null>(null)
    const [sortDesc, setSortDesc] = useState(true)
    const [filterSide, setFilterSide] = useState<'all'|'long'|'short'>('all')
    const [filterStatus, setFilterStatus] = useState<'all'|'win'|'loss'|'breakeven'>('all')

    // Checklist state
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
    const [customQuestions, setCustomQuestions] = useState<{ id: string; text: string }[]>([])
    const [newQuestion, setNewQuestion] = useState('')
    const [showChecklist, setShowChecklist] = useState(true)

    useEffect(() => {
        if (!id || !user) return
        const load = async () => {
            setLoading(true)
            try {
                const [strats, trds] = await Promise.all([
                    BacktestService.getStrategies(user.id),
                    BacktestService.getTrades(id),
                ])
                const s = strats.find(x => x.id === id)
                if (!s) { navigate('/app/backtest'); return }
                setStrategy(s)
                setTrades(trds)
                setForm(f => ({ ...f, pair: s.symbol, timeframe: s.timeframe }))
                // Load saved custom questions from localStorage
                const saved = localStorage.getItem(`backtest_custom_questions_${user.id}`)
                if (saved) setCustomQuestions(JSON.parse(saved))
            } catch (e: any) {
                toast.error(e.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id, user])

    const toggleCheck = (itemId: string) => {
        setCheckedItems(prev => {
            const next = new Set(prev)
            next.has(itemId) ? next.delete(itemId) : next.add(itemId)
            return next
        })
    }

    const addCustomQuestion = () => {
        const q = newQuestion.trim()
        if (!q) return
        const item = { id: `custom_${Date.now()}`, text: q }
        const updated = [...customQuestions, item]
        setCustomQuestions(updated)
        if (user) localStorage.setItem(`backtest_custom_questions_${user.id}`, JSON.stringify(updated))
        setNewQuestion('')
        toast.success('Питання збережено в бібліотеку')
    }

    const removeCustomQuestion = (qId: string) => {
        const updated = customQuestions.filter(q => q.id !== qId)
        setCustomQuestions(updated)
        if (user) localStorage.setItem(`backtest_custom_questions_${user.id}`, JSON.stringify(updated))
    }

    const allChecklist = [
        ...DEFAULT_CHECKLIST.map(q => ({ ...q, isCustom: false })),
        ...customQuestions.map(q => ({ ...q, category: 'Моє', isCustom: true })),
    ]
    const checkedCount = allChecklist.filter(q => checkedItems.has(q.id)).length
    const checklistScore = allChecklist.length > 0 ? Math.round((checkedCount / allChecklist.length) * 100) : 0

    // Stats
    const stats = useMemo(() => {
        if (!strategy) return null
        return calculateBacktestStats(trades.map(t => ({
            id: t.id, userId: t.user_id, strategyName: strategy.name,
            pair: t.pair, timeframe: t.timeframe, side: t.side,
            entryPrice: t.entry_price, exitPrice: t.exit_price,
            stopLoss: t.stop_loss, takeProfit: t.take_profit,
            size: t.size, pnl: t.pnl, rMultiple: t.r_multiple,
            status: t.status,
            entryTime: new Date(t.entry_time), exitTime: new Date(t.exit_time),
            notes: t.notes,
        })))
    }, [trades, strategy])

    // Equity curve
    const equityCurve = useMemo(() => {
        if (!strategy) return []
        let equity = strategy.initial_capital
        return [
            { date: 'Старт', equity },
            ...[...trades].sort((a,b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime())
                .map(t => {
                    equity += t.pnl
                    return { date: new Date(t.exit_time).toLocaleDateString('uk-UA', { day:'numeric', month:'short' }), equity: +equity.toFixed(2) }
                })
        ]
    }, [trades, strategy])

    // Filtered trades
    const displayTrades = useMemo(() => {
        let list = [...trades]
        if (filterSide !== 'all') list = list.filter(t => t.side === filterSide)
        if (filterStatus !== 'all') list = list.filter(t => t.status === filterStatus)
        list.sort((a,b) => {
            const diff = new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()
            return sortDesc ? -diff : diff
        })
        return list
    }, [trades, filterSide, filterStatus, sortDesc])

    // Preview calc
    const preview = useMemo(() => {
        if (!strategy || !form.entry_price || !form.exit_price || !form.size) return null
        return calcTrade(+form.entry_price, +form.exit_price, form.stop_loss ? +form.stop_loss : undefined, form.side, +form.size, strategy.initial_capital)
    }, [form.entry_price, form.exit_price, form.stop_loss, form.side, form.size, strategy])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !id || !strategy || !preview) return
        setSaving(true)
        try {
            const checklistSnapshot = allChecklist
                .filter(q => checkedItems.has(q.id))
                .map(q => q.text)

            const tradeData = {
                pair: form.pair || strategy.symbol,
                timeframe: form.timeframe,
                side: form.side,
                entry_price: +form.entry_price,
                exit_price: +form.exit_price,
                stop_loss: form.stop_loss ? +form.stop_loss : undefined,
                take_profit: form.take_profit ? +form.take_profit : undefined,
                size: +form.size,
                pnl: preview.pnl,
                pnl_percent: preview.pnlPct,
                r_multiple: preview.rMultiple,
                status: preview.status,
                entry_time: form.entry_time || new Date().toISOString(),
                exit_time: form.exit_time || new Date().toISOString(),
                screenshot_url: form.screenshot_url || undefined,
                notes: [
                    form.notes,
                    checklistSnapshot.length > 0 ? `\n✅ Чек-лист (${checklistSnapshot.length}/${allChecklist.length}): ${checklistSnapshot.join(', ')}` : '',
                ].filter(Boolean).join(''),
            }

            if (editingId) {
                await BacktestService.updateTrade(editingId, tradeData)
                setTrades(prev => prev.map(t => t.id === editingId ? { ...t, ...tradeData, id: editingId } : t))
                toast.success('Угоду оновлено')
                setEditingId(null)
            } else {
                const saved = await BacktestService.addTrade(user.id, id, tradeData)
                setTrades(prev => [...prev, saved])
                toast.success('Угоду додано')
            }
            setForm(f => ({ ...emptyForm(), pair: f.pair, timeframe: f.timeframe }))
            setCheckedItems(new Set())
            setShowForm(false)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (t: BacktestTrade) => {
        setForm({
            pair: t.pair, timeframe: t.timeframe, side: t.side,
            entry_price: t.entry_price.toString(), exit_price: t.exit_price.toString(),
            stop_loss: t.stop_loss?.toString() ?? '', take_profit: t.take_profit?.toString() ?? '',
            size: t.size.toString(),
            entry_time: t.entry_time.slice(0,16), exit_time: t.exit_time.slice(0,16),
            screenshot_url: t.screenshot_url ?? '', notes: t.notes ?? '',
        })
        setEditingId(t.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (tradeId: string) => {
        if (!confirm('Видалити цю угоду?')) return
        try {
            await BacktestService.deleteTrade(tradeId)
            setTrades(prev => prev.filter(t => t.id !== tradeId))
            toast.success('Угоду видалено')
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )
    if (!strategy) return null

    const pnlColor = (v: number) => v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400'
    const pnlBg   = (v: number) => v > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : v < 0 ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : 'bg-gray-500/10 border-gray-500/20 text-gray-400'

    // Group checklist by category
    const categories = [...new Set(allChecklist.map(q => q.category))]

    return (
        <div className="space-y-4 sm:space-y-6 pb-10 animate-fade-in">

            {/* ── Header ── */}
            <div className="flex items-start gap-3">
                <Link to="/app/backtest" className="mt-1 p-2 hover:bg-surface rounded-xl transition-colors text-gray-400 hover:text-white flex-shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <FlaskConical className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-gray-500 font-mono">{strategy.symbol} · {strategy.timeframe}</span>
                        {strategy.tags.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">#{t}</span>
                        ))}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{strategy.name}</h1>
                    {strategy.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{strategy.description}</p>}
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(f => ({ ...emptyForm(), pair: strategy.symbol, timeframe: strategy.timeframe })); setCheckedItems(new Set()) }}
                    className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-medium text-sm">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Додати угоду</span>
                    <span className="sm:hidden">+</span>
                </button>
            </div>

            {/* ── Stats cards ── */}
            {trades.length > 0 && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    <StatCard label="Win Rate"      value={`${stats.winRate.toFixed(1)}%`}         color={stats.winRate >= 50 ? 'green' : 'red'} icon={<Award className="w-4 h-4"/>} />
                    <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color={stats.profitFactor >= 1 ? 'green' : 'red'} icon={<Activity className="w-4 h-4"/>} />
                    <StatCard label="Total PnL"     value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? 'green' : 'red'} icon={<TrendingUp className="w-4 h-4"/>} />
                    <StatCard label="Drawdown"      value={`${stats.maxDrawdown.toFixed(2)}`}      color="red"    icon={<TrendingDown className="w-4 h-4"/>} />
                    <StatCard label="Avg R"         value={`${stats.avgR.toFixed(2)}R`}            color={stats.avgR >= 0 ? 'green' : 'red'} icon={<Target className="w-4 h-4"/>} />
                    <StatCard label="Угоди"         value={`${stats.wins}W / ${stats.losses}L`}    color="blue"   icon={<BarChart2 className="w-4 h-4"/>} />
                </div>
            )}

            {/* ── Add trade form ── */}
            {showForm && (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* Form header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                        <h2 className="font-bold text-lg">{editingId ? 'Редагувати угоду' : 'Нова угода'}</h2>
                        <button onClick={() => { setShowForm(false); setEditingId(null) }}
                            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-gray-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-4 sm:p-6 space-y-5">

                            {/* Row 1: pair, tf, side */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="label">Пара</label>
                                    <input value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())}
                                        placeholder="BTCUSDT" className="input font-mono" />
                                </div>
                                <div>
                                    <label className="label">Таймфрейм</label>
                                    <select value={form.timeframe} onChange={e => set('timeframe', e.target.value)} className="input">
                                        {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Напрям</label>
                                    <div className="flex gap-2">
                                        {(['long','short'] as const).map(s => (
                                            <button key={s} type="button" onClick={() => set('side', s)}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                                    form.side === s
                                                        ? s === 'long' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'
                                                        : 'bg-background border-border text-gray-400 hover:border-gray-500'
                                                }`}>
                                                {s === 'long' ? '📈 Long' : '📉 Short'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: prices */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="label">Вхід <span className="text-red-400">*</span></label>
                                    <input type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} placeholder="0.00" className="input" required />
                                </div>
                                <div>
                                    <label className="label">Вихід <span className="text-red-400">*</span></label>
                                    <input type="number" step="any" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} placeholder="0.00" className="input" required />
                                </div>
                                <div>
                                    <label className="label">Stop Loss</label>
                                    <input type="number" step="any" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)} placeholder="0.00" className="input" />
                                </div>
                                <div>
                                    <label className="label">Take Profit</label>
                                    <input type="number" step="any" value={form.take_profit} onChange={e => set('take_profit', e.target.value)} placeholder="0.00" className="input" />
                                </div>
                            </div>

                            {/* Row 3: size + times */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="label">Розмір позиції <span className="text-red-400">*</span></label>
                                    <input type="number" step="any" value={form.size} onChange={e => set('size', e.target.value)} placeholder="1.0" className="input" required />
                                </div>
                                <div>
                                    <label className="label">Час входу</label>
                                    <input type="datetime-local" value={form.entry_time} onChange={e => set('entry_time', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">Час виходу</label>
                                    <input type="datetime-local" value={form.exit_time} onChange={e => set('exit_time', e.target.value)} className="input" />
                                </div>
                            </div>

                            {/* Row 4: screenshot + notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Скріншот (URL)</label>
                                    <input type="url" value={form.screenshot_url} onChange={e => set('screenshot_url', e.target.value)} placeholder="https://..." className="input" />
                                </div>
                                <div>
                                    <label className="label">Нотатки</label>
                                    <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Опис угоди, помилки, висновки..." className="input" />
                                </div>
                            </div>

                            {/* ── Checklist ── */}
                            <div className="border border-border rounded-xl overflow-hidden">
                                <button type="button"
                                    onClick={() => setShowChecklist(!showChecklist)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                        <span className="font-medium text-sm">Чек-лист трейдера</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            checklistScore >= 80 ? 'bg-green-500/10 text-green-400' :
                                            checklistScore >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-gray-500/10 text-gray-400'
                                        }`}>
                                            {checkedCount}/{allChecklist.length} — {checklistScore}%
                                        </span>
                                    </div>
                                    {showChecklist ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>

                                {showChecklist && (
                                    <div className="border-t border-border p-4 space-y-5 bg-background/30">
                                        {categories.map(cat => (
                                            <div key={cat}>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</p>
                                                <div className="space-y-1.5">
                                                    {allChecklist.filter(q => q.category === cat).map(q => (
                                                        <label key={q.id} className="flex items-start gap-3 cursor-pointer group">
                                                            <button type="button" onClick={() => toggleCheck(q.id)}
                                                                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded transition-colors ${
                                                                    checkedItems.has(q.id) ? 'text-green-400' : 'text-gray-600 group-hover:text-gray-400'
                                                                }`}>
                                                                {checkedItems.has(q.id)
                                                                    ? <CheckSquare className="w-5 h-5" />
                                                                    : <Square className="w-5 h-5" />
                                                                }
                                                            </button>
                                                            <span className={`text-sm leading-relaxed flex-1 ${checkedItems.has(q.id) ? 'text-white' : 'text-gray-400'}`}>
                                                                {q.text}
                                                            </span>
                                                            {q.isCustom && (
                                                                <button type="button" onClick={() => removeCustomQuestion(q.id)}
                                                                    className="flex-shrink-0 p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add custom question */}
                                        <div className="pt-3 border-t border-border">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Додати своє питання</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newQuestion}
                                                    onChange={e => setNewQuestion(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomQuestion() }}}
                                                    placeholder="Своя умова входу..."
                                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                                                />
                                                <button type="button" onClick={addCustomQuestion}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm hover:bg-primary/20 transition-colors">
                                                    <PlusCircle className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Зберегти</span>
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1.5">Питання збережеться у вашій бібліотеці для всіх бектестів</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Preview + submit */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                                {preview ? (
                                    <div className={`flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl border text-sm font-medium ${pnlBg(preview.pnl)}`}>
                                        <span>PnL: {preview.pnl >= 0 ? '+' : ''}{preview.pnl.toFixed(2)} ({preview.pnlPct >= 0 ? '+' : ''}{preview.pnlPct.toFixed(2)}%)</span>
                                        {preview.rMultiple !== 0 && <span>· R: {preview.rMultiple.toFixed(2)}</span>}
                                        <span className="capitalize">· {preview.status}</span>
                                        {checkedCount > 0 && <span className="text-gray-400">· ✅ {checkedCount}/{allChecklist.length}</span>}
                                    </div>
                                ) : <div />}
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                                        className="flex-1 sm:flex-none px-4 py-2 text-gray-400 hover:text-white hover:bg-surface-hover rounded-xl transition-all text-sm">
                                        Скасувати
                                    </button>
                                    <button type="submit" disabled={saving || !preview}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50">
                                        <Check className="w-4 h-4" />
                                        {saving ? 'Збереження...' : editingId ? 'Оновити' : 'Додати'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Equity curve ── */}
            {equityCurve.length > 1 && (
                <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <Activity className="w-4 h-4 text-primary" />
                        Крива капіталу
                        <span className="text-xs text-gray-500 ml-2">Початок: {strategy.initial_capital.toLocaleString()} {strategy.currency}</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={equityCurve} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={55} />
                            <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                                formatter={(v: number) => [`${v.toFixed(2)} ${strategy.currency}`, 'Капітал']} />
                            <ReferenceLine y={strategy.initial_capital} stroke="#4b5563" strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2} fill="url(#eq)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Trades ── */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border gap-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                        <BarChart2 className="w-4 h-4 text-primary" />
                        Журнал угод
                        <span className="text-xs text-gray-500">({displayTrades.length})</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex gap-1 bg-background border border-border rounded-lg p-0.5">
                            {(['all','long','short'] as const).map(s => (
                                <button key={s} onClick={() => setFilterSide(s)}
                                    className={`px-2 py-1 text-xs rounded-md transition-all ${filterSide === s ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                                    {s === 'all' ? 'Всі' : s === 'long' ? '📈' : '📉'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 bg-background border border-border rounded-lg p-0.5">
                            {(['all','win','loss','breakeven'] as const).map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-2 py-1 text-xs rounded-md transition-all ${filterStatus === s ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                                    {s === 'all' ? 'Всі' : s === 'win' ? '✅' : s === 'loss' ? '❌' : '➖'}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setSortDesc(!sortDesc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg hover:border-primary transition-colors text-gray-400">
                            {sortDesc ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>}
                            {sortDesc ? 'Нові' : 'Старі'}
                        </button>
                    </div>
                </div>

                {displayTrades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-sm">
                        {trades.length === 0 ? 'Ще немає угод. Натисни "+" щоб додати' : 'Нічого не знайдено за фільтром'}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-background/50">
                                    <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-4 py-3 text-left">Пара</th>
                                        <th className="px-4 py-3 text-left">TF</th>
                                        <th className="px-4 py-3 text-left">Напрям</th>
                                        <th className="px-4 py-3 text-right">Вхід</th>
                                        <th className="px-4 py-3 text-right">Вихід</th>
                                        <th className="px-4 py-3 text-right">SL</th>
                                        <th className="px-4 py-3 text-right">TP</th>
                                        <th className="px-4 py-3 text-right">Розмір</th>
                                        <th className="px-4 py-3 text-right">PnL</th>
                                        <th className="px-4 py-3 text-right">R</th>
                                        <th className="px-4 py-3 text-left">Дата</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {displayTrades.map(t => (
                                        <tr key={t.id} className="hover:bg-background/30 transition-colors group">
                                            <td className="px-4 py-3 font-mono font-medium">{t.pair}</td>
                                            <td className="px-4 py-3 text-gray-400">{t.timeframe}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.side === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {t.side === 'long' ? '↑ Long' : '↓ Short'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{t.entry_price}</td>
                                            <td className="px-4 py-3 text-right font-mono">{t.exit_price}</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">{t.stop_loss ?? '—'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-green-400">{t.take_profit ?? '—'}</td>
                                            <td className="px-4 py-3 text-right">{t.size}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${pnlColor(t.pnl)}`}>
                                                {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                                                <span className="text-xs font-normal ml-1 opacity-70">({t.pnl_percent >= 0 ? '+' : ''}{t.pnl_percent.toFixed(1)}%)</span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${pnlColor(t.r_multiple)}`}>
                                                {t.r_multiple !== 0 ? `${t.r_multiple >= 0 ? '+' : ''}${t.r_multiple.toFixed(2)}R` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {new Date(t.entry_time).toLocaleDateString('uk-UA', { day:'numeric', month:'short', year:'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(t)} className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-all text-gray-500">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all text-gray-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-border">
                            {displayTrades.map(t => (
                                <div key={t.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">{t.pair}</span>
                                            <span className="text-xs text-gray-500">{t.timeframe}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.side === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {t.side === 'long' ? '↑' : '↓'} {t.side}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(t)} className="p-1.5 text-gray-500 hover:text-primary rounded-lg">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <p className="text-gray-500">Вхід → Вихід</p>
                                            <p className="font-mono">{t.entry_price} → {t.exit_price}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">PnL</p>
                                            <p className={`font-bold ${pnlColor(t.pnl)}`}>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">R-множник</p>
                                            <p className={`font-medium ${pnlColor(t.r_multiple)}`}>{t.r_multiple !== 0 ? `${t.r_multiple >= 0 ? '+' : ''}${t.r_multiple.toFixed(2)}R` : '—'}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600">{new Date(t.entry_time).toLocaleDateString('uk-UA', { day:'numeric', month:'long', year:'numeric' })}</p>
                                    {t.notes && <p className="text-xs text-gray-500 line-clamp-2">{t.notes}</p>}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
    const colors: Record<string, string> = {
        green:  'bg-green-500/10 text-green-400',
        red:    'bg-red-500/10 text-red-400',
        blue:   'bg-blue-500/10 text-blue-400',
    }
    return (
        <div className="bg-surface border border-border rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`p-1 rounded-lg ${colors[color] ?? colors.blue}`}>{icon}</div>
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-base sm:text-lg font-bold">{value}</p>
        </div>
    )
}
