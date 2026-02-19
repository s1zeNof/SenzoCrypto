import { useState, useMemo } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
    addBacktestTrade, deleteBacktestTrade,
    type BacktestTrade,
} from '@/services/firebase'
import { calculateBacktestStats } from '@/utils/backtestStats'
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    userId: string
    strategyName: string
    onStrategyChange: (name: string) => void
    trades: BacktestTrade[]
    loading: boolean
    onTradeSaved: (trade: BacktestTrade) => void
    onTradeDeleted: (tradeId: string) => void
}

interface FormState {
    pair: string
    timeframe: string
    side: 'long' | 'short'
    entryPrice: string
    exitPrice: string
    stopLoss: string
    takeProfit: string
    size: string
    entryTime: string
    exitTime: string
    notes: string
}

const DEFAULT_FORM: FormState = {
    pair: 'BTCUSDT', timeframe: '1h', side: 'long',
    entryPrice: '', exitPrice: '', stopLoss: '', takeProfit: '',
    size: '1000', entryTime: '', exitTime: '', notes: '',
}

const POPULAR_PAIRS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','AVAXUSDT']
const TIMEFRAMES    = ['1m','5m','15m','30m','1h','4h','1d','1w']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(val: any): Date {
    if (!val) return new Date()
    if (val?.toDate) return val.toDate()
    return new Date(val)
}

function fmtDate(val: any) {
    try { return format(toDate(val), 'dd.MM.yy HH:mm', { locale: uk }) }
    catch { return '—' }
}

function calcPnl(form: FormState) {
    const entry = parseFloat(form.entryPrice)
    const exit  = parseFloat(form.exitPrice)
    const size  = parseFloat(form.size)
    if (!entry || !exit || !size) return null
    const diff = form.side === 'long' ? exit - entry : entry - exit
    return (diff / entry) * size
}

function calcR(form: FormState) {
    const entry = parseFloat(form.entryPrice)
    const exit  = parseFloat(form.exitPrice)
    const sl    = parseFloat(form.stopLoss)
    if (!entry || !exit || !sl) return null
    const diff = form.side === 'long' ? exit - entry : entry - exit
    const risk = form.side === 'long' ? entry - sl  : sl - entry
    return risk > 0 ? diff / risk : null
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
    return (
        <div className="bg-surface-elevated border border-border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold font-mono ${color ?? 'text-white'}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TradeJournal({
    userId, strategyName, onStrategyChange,
    trades, loading, onTradeSaved, onTradeDeleted,
}: Props) {
    const [showForm, setShowForm] = useState(false)
    const [form, setForm]         = useState<FormState>(DEFAULT_FORM)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')

    const stats = useMemo(() => calculateBacktestStats(trades), [trades])

    const sorted = useMemo(() => {
        return [...trades].sort((a, b) => {
            const diff = toDate(a.entryTime).getTime() - toDate(b.entryTime).getTime()
            return sortDir === 'asc' ? diff : -diff
        })
    }, [trades, sortDir])

    const previewPnl = calcPnl(form)
    const previewR   = calcR(form)

    // ── Form submit ───────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const entry = parseFloat(form.entryPrice)
        const exit  = parseFloat(form.exitPrice)
        const sl    = form.stopLoss    ? parseFloat(form.stopLoss)    : undefined
        const tp    = form.takeProfit  ? parseFloat(form.takeProfit)  : undefined
        const size  = parseFloat(form.size)
        if (!entry || !exit || !size) return

        const diff      = form.side === 'long' ? exit - entry : entry - exit
        const pnl       = (diff / entry) * size
        const risk      = sl ? Math.abs(form.side === 'long' ? entry - sl : sl - entry) : 0
        const rMultiple = risk > 0 ? diff / risk : 0
        const status: BacktestTrade['status'] = pnl > 0.001 ? 'win' : pnl < -0.001 ? 'loss' : 'breakeven'

        const trade: Omit<BacktestTrade, 'id' | 'createdAt'> = {
            userId, strategyName,
            pair: form.pair, timeframe: form.timeframe,
            side: form.side, entryPrice: entry, exitPrice: exit,
            stopLoss: sl, takeProfit: tp, size,
            pnl: parseFloat(pnl.toFixed(2)),
            rMultiple: parseFloat(rMultiple.toFixed(2)), status,
            entryTime: form.entryTime ? new Date(form.entryTime) : new Date(),
            exitTime:  form.exitTime  ? new Date(form.exitTime)  : new Date(),
            notes: form.notes || undefined,
        }

        setIsSaving(true)
        try {
            const id = await addBacktestTrade(userId, trade)
            onTradeSaved({ ...trade, id, createdAt: new Date() })
            setForm(DEFAULT_FORM)
            setShowForm(false)
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteBacktestTrade(userId, id)
            onTradeDeleted(id)
        } catch (err) {
            console.error(err)
        } finally {
            setDeletingId(null)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* Strategy selector */}
            <div className="bg-surface-elevated border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-400 flex-shrink-0">Стратегія:</span>
                <input
                    className="bg-surface border border-border focus:border-primary rounded-lg px-3 py-1.5 text-sm text-white outline-none flex-1 min-w-0"
                    value={strategyName}
                    onChange={e => onStrategyChange(e.target.value)}
                    placeholder="Назва стратегії..."
                />
                <span className="text-xs text-gray-500 flex-shrink-0">{trades.length} угод</span>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard
                    label="Win Rate"
                    value={`${stats.winRate.toFixed(1)}%`}
                    sub={`${stats.wins}W / ${stats.losses}L`}
                    color={stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}
                />
                <StatCard
                    label="Profit Factor"
                    value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                    color={stats.profitFactor >= 1.5 ? 'text-green-400' : stats.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}
                />
                <StatCard
                    label="Total PnL"
                    value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)} $`}
                    color={stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
                />
                <StatCard
                    label="Max Drawdown"
                    value={`${stats.maxDrawdown.toFixed(2)} $`}
                    color="text-red-400"
                />
                <StatCard
                    label="Avg R"
                    value={`${stats.avgRMultiple.toFixed(2)}R`}
                    color={stats.avgRMultiple >= 1 ? 'text-green-400' : 'text-gray-300'}
                />
                <StatCard
                    label="Угод"
                    value={String(stats.totalTrades)}
                />
            </div>

            {/* Equity curve */}
            {trades.length > 1 && (
                <div className="bg-surface-elevated border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Equity Curve</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={stats.equityCurve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,46,57,0.6)" />
                            <XAxis
                                dataKey="index"
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                tickFormatter={i => `#${i}`}
                            />
                            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: '#14171F', border: '1px solid rgba(42,46,57,1)', borderRadius: 8, fontSize: 12 }}
                                labelFormatter={i => `Угода #${i}`}
                                formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)} $`, 'Капітал']}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                            <Line dataKey="cumPnl" stroke="#5B7CFF" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Trades table + add form */}
            <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h3 className="font-semibold">Угоди</h3>
                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm rounded-xl font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        Додати угоду
                    </button>
                </div>

                {/* Add form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="p-5 border-b border-border bg-surface">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            {/* Pair */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Пара</label>
                                <select
                                    className="bg-surface-elevated border border-border focus:border-primary rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                                    value={form.pair}
                                    onChange={e => setForm({ ...form, pair: e.target.value })}>
                                    {POPULAR_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            {/* Timeframe */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Таймфрейм</label>
                                <select
                                    className="bg-surface-elevated border border-border focus:border-primary rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                                    value={form.timeframe}
                                    onChange={e => setForm({ ...form, timeframe: e.target.value })}>
                                    {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {/* Side */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Сторона</label>
                                <div className="flex rounded-lg overflow-hidden border border-border">
                                    <button type="button"
                                        onClick={() => setForm({ ...form, side: 'long' })}
                                        className={`flex-1 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1
                                            ${form.side === 'long' ? 'bg-green-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'}`}>
                                        <TrendingUp className="w-3 h-3" /> Long
                                    </button>
                                    <button type="button"
                                        onClick={() => setForm({ ...form, side: 'short' })}
                                        className={`flex-1 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1
                                            ${form.side === 'short' ? 'bg-red-500 text-white' : 'bg-surface-elevated text-gray-400 hover:text-white'}`}>
                                        <TrendingDown className="w-3 h-3" /> Short
                                    </button>
                                </div>
                            </div>
                            {/* Size */}
                            <FormField label="Розмір $" type="number" value={form.size} onChange={v => setForm({ ...form, size: v })} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <FormField label="Ціна входу" type="number" value={form.entryPrice} onChange={v => setForm({ ...form, entryPrice: v })} required />
                            <FormField label="Ціна виходу" type="number" value={form.exitPrice} onChange={v => setForm({ ...form, exitPrice: v })} required />
                            <FormField label="Стоп-лосс" type="number" value={form.stopLoss} onChange={v => setForm({ ...form, stopLoss: v })} />
                            <FormField label="Тейк-профіт" type="number" value={form.takeProfit} onChange={v => setForm({ ...form, takeProfit: v })} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <FormField label="Час входу" type="datetime-local" value={form.entryTime} onChange={v => setForm({ ...form, entryTime: v })} />
                            <FormField label="Час виходу" type="datetime-local" value={form.exitTime} onChange={v => setForm({ ...form, exitTime: v })} />

                            {/* Live preview */}
                            <div className="flex flex-col justify-end pb-1 gap-0.5">
                                {previewPnl !== null && (
                                    <p className={`text-sm font-bold font-mono ${previewPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        PnL: {previewPnl >= 0 ? '+' : ''}{previewPnl.toFixed(2)} $
                                    </p>
                                )}
                                {previewR !== null && (
                                    <p className={`text-sm font-bold ${previewR >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        R = {previewR.toFixed(2)}
                                    </p>
                                )}
                            </div>

                            <FormField label="Нотатки" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button type="button"
                                onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }}
                                className="px-4 py-2 border border-border rounded-xl text-sm hover:bg-surface-hover transition-colors">
                                Скасувати
                            </button>
                            <button type="submit" disabled={isSaving}
                                className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">
                                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                Зберегти
                            </button>
                        </div>
                    </form>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : trades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-4xl mb-3">📊</p>
                        <p className="font-medium">Угод ще немає</p>
                        <p className="text-sm mt-1">Додай першу угоду вручну або через Ручний бектест</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b border-border">
                                    <th className="text-left px-4 py-3">
                                        <button className="flex items-center gap-1 hover:text-white"
                                            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                                            Дата {sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    </th>
                                    <th className="text-left px-3 py-3">Пара</th>
                                    <th className="text-left px-3 py-3">ТФ</th>
                                    <th className="text-left px-3 py-3">Сторона</th>
                                    <th className="text-right px-3 py-3">Вхід</th>
                                    <th className="text-right px-3 py-3">Вихід</th>
                                    <th className="text-right px-3 py-3">SL</th>
                                    <th className="text-right px-3 py-3">TP</th>
                                    <th className="text-right px-3 py-3">Розмір $</th>
                                    <th className="text-right px-3 py-3">PnL</th>
                                    <th className="text-right px-3 py-3">R</th>
                                    <th className="text-left px-3 py-3">Нотатки</th>
                                    <th className="px-3 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(trade => (
                                    <tr key={trade.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(trade.entryTime)}</td>
                                        <td className="px-3 py-3 font-mono font-medium text-white">{trade.pair}</td>
                                        <td className="px-3 py-3 text-gray-400">{trade.timeframe}</td>
                                        <td className="px-3 py-3">
                                            <span className={`flex items-center gap-1 font-medium ${trade.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                                {trade.side === 'long' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {trade.side === 'long' ? 'Long' : 'Short'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-gray-300">{trade.entryPrice.toFixed(4)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-gray-300">{trade.exitPrice.toFixed(4)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-gray-500">{trade.stopLoss ? trade.stopLoss.toFixed(4) : '—'}</td>
                                        <td className="px-3 py-3 text-right font-mono text-gray-500">{trade.takeProfit ? trade.takeProfit.toFixed(4) : '—'}</td>
                                        <td className="px-3 py-3 text-right font-mono text-gray-300">{trade.size}</td>
                                        <td className={`px-3 py-3 text-right font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                        </td>
                                        <td className={`px-3 py-3 text-right font-mono ${trade.rMultiple >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.rMultiple.toFixed(2)}R
                                        </td>
                                        <td className="px-3 py-3 text-gray-500 text-xs max-w-[120px] truncate">
                                            {trade.notes ?? ''}
                                        </td>
                                        <td className="px-3 py-3">
                                            <button
                                                onClick={() => trade.id && handleDelete(trade.id)}
                                                disabled={deletingId === trade.id}
                                                className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40">
                                                {deletingId === trade.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer totals */}
                            {trades.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-border font-semibold text-xs text-gray-400">
                                        <td colSpan={9} className="px-4 py-3">Всього ({trades.length} угод)</td>
                                        <td className={`px-3 py-3 text-right font-mono font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-gray-300">
                                            {stats.avgRMultiple.toFixed(2)}R avg
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function FormField({
    label, type = 'text', value, onChange, required = false,
}: {
    label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{label}</label>
            <input
                type={type}
                required={required}
                value={value}
                onChange={e => onChange(e.target.value)}
                step="any"
                className="bg-surface-elevated border border-border focus:border-primary rounded-lg px-2 py-1.5 text-sm text-white outline-none"
            />
        </div>
    )
}
