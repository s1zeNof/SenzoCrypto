import { useState } from 'react'
import { X, FlaskConical, Sparkles, ChevronRight } from 'lucide-react'
import { BacktestService, type BacktestStrategy } from '@/services/BacktestService'
import { STRATEGY_PRESETS, type StrategyPreset } from '@/data/strategyPresets'
import { toast } from 'sonner'

const TIMEFRAMES = ['1m','5m','15m','30m','1H','2H','4H','8H','12H','1D','3D','1W','1M']
const CURRENCIES = ['USDT','USD','BTC','ETH','UAH']

const COLOR_MAP = {
    purple: {
        card:     'border-purple-500/30 bg-purple-500/5 hover:border-purple-400/60 hover:bg-purple-500/10',
        active:   'border-purple-400 bg-purple-500/15 shadow-purple-500/10',
        icon:     'bg-purple-500/15 text-purple-400',
        badge:    'bg-purple-500/10 text-purple-300',
    },
    blue: {
        card:     'border-blue-500/30 bg-blue-500/5 hover:border-blue-400/60 hover:bg-blue-500/10',
        active:   'border-blue-400 bg-blue-500/15 shadow-blue-500/10',
        icon:     'bg-blue-500/15 text-blue-400',
        badge:    'bg-blue-500/10 text-blue-300',
    },
    green: {
        card:     'border-green-500/30 bg-green-500/5 hover:border-green-400/60 hover:bg-green-500/10',
        active:   'border-green-400 bg-green-500/15 shadow-green-500/10',
        icon:     'bg-green-500/15 text-green-400',
        badge:    'bg-green-500/10 text-green-300',
    },
    orange: {
        card:     'border-orange-500/30 bg-orange-500/5 hover:border-orange-400/60 hover:bg-orange-500/10',
        active:   'border-orange-400 bg-orange-500/15 shadow-orange-500/10',
        icon:     'bg-orange-500/15 text-orange-400',
        badge:    'bg-orange-500/10 text-orange-300',
    },
}

interface Props {
    isOpen: boolean
    userId: string
    onClose: () => void
    onCreated: (s: BacktestStrategy) => void
}

export default function CreateBacktestModal({ isOpen, userId, onClose, onCreated }: Props) {
    const [loading, setLoading] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [hoveredPreset, setHoveredPreset] = useState<string | null>(null)
    const [form, setForm] = useState({
        name: '',
        description: '',
        symbol: 'BTCUSDT',
        timeframe: '1H',
        initial_capital: 1000,
        currency: 'USDT',
        tags: [] as string[],
        tagInput: '',
    })

    if (!isOpen) return null

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

    const applyPreset = (preset: StrategyPreset) => {
        if (selectedPreset === preset.id) {
            // Deselect
            setSelectedPreset(null)
            return
        }
        setSelectedPreset(preset.id)
        setForm(f => ({
            ...f,
            name: preset.name,
            description: preset.description,
            tags: [...preset.tags],
            timeframe: preset.defaultTimeframe,
            symbol: preset.defaultSymbol,
        }))
    }

    const addTag = () => {
        const t = form.tagInput.trim().toLowerCase()
        if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
        set('tagInput', '')
    }

    const removeTag = (t: string) => set('tags', form.tags.filter(x => x !== t))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return toast.error('Введіть назву стратегії')
        setLoading(true)
        try {
            const strategy = await BacktestService.createStrategy(userId, {
                name:            form.name.trim(),
                description:     form.description.trim() || undefined,
                symbol:          form.symbol.trim().toUpperCase(),
                timeframe:       form.timeframe,
                initial_capital: Number(form.initial_capital),
                currency:        form.currency,
                tags:            form.tags,
            })
            toast.success('Бектест створено!')
            onCreated(strategy)
            onClose()
        } catch (e: any) {
            toast.error('Помилка: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const previewPreset = STRATEGY_PRESETS.find(p => p.id === (hoveredPreset ?? selectedPreset))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <FlaskConical className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Новий бектест</h2>
                            <p className="text-xs text-gray-500">Обери шаблон або створи власну стратегію</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {/* ── Strategy Preset Picker ── */}
                    <div className="px-6 pt-5 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">Шаблон стратегії</span>
                            <span className="text-xs text-gray-500">(необов'язково)</span>
                        </div>

                        {/* Grid + side preview panel side-by-side (avoids overflow-hidden clipping) */}
                        <div className="flex gap-3 items-stretch">
                            <div className="grid grid-cols-2 gap-2.5 flex-1">
                                {STRATEGY_PRESETS.map(preset => {
                                    const colors = COLOR_MAP[preset.color]
                                    const isActive = selectedPreset === preset.id

                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            onMouseEnter={() => setHoveredPreset(preset.id)}
                                            onMouseLeave={() => setHoveredPreset(null)}
                                            className={[
                                                'w-full text-left p-3.5 rounded-xl border transition-all duration-150',
                                                isActive
                                                    ? `${colors.active} shadow-lg`
                                                    : `${colors.card} border-border`,
                                            ].join(' ')}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${colors.icon}`}>
                                                    {preset.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className="font-semibold text-sm truncate">{preset.name}</p>
                                                        {isActive && (
                                                            <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${colors.badge}`}>✓</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                        {preset.description.split('.')[0]}.
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        {preset.tags.slice(0, 3).map(t => (
                                                            <span key={t} className={`text-xs px-1.5 py-0.5 rounded-md ${colors.badge} opacity-80`}>#{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Side preview panel — replaces floating tooltip, no overflow issues */}
                            <div className="w-48 flex-shrink-0">
                                {previewPreset ? (
                                    <div className="h-full rounded-xl border border-border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                                        <div className="bg-gray-950 p-1 flex-1 flex items-center justify-center">
                                            {previewPreset.svg}
                                        </div>
                                        <div className="bg-gray-900 px-3 py-2 border-t border-gray-800">
                                            <p className="text-xs font-semibold text-white">{previewPreset.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                                                {previewPreset.description.split('.')[0]}.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full rounded-xl border border-dashed border-border/40 flex items-center justify-center">
                                        <p className="text-xs text-gray-600 text-center px-3">Наведіть на картку для перегляду</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected preset full description */}
                        {selectedPreset && previewPreset && (
                            <div className={`mt-3 p-3 rounded-xl border ${COLOR_MAP[previewPreset.color].card} border-opacity-50`}>
                                <div className="flex items-start gap-3">
                                    <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-950">
                                        {previewPreset.svg}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-300 leading-relaxed">{previewPreset.description}</p>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPreset(null)}
                                            className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1"
                                        >
                                            × Скасувати вибір
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 px-6 mb-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            Параметри
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <form onSubmit={handleSubmit} id="backtest-form" className="px-6 pb-6 space-y-4">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Назва стратегії <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="Наприклад: BTC скальп по EMA"
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Опис</label>
                            <textarea
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                placeholder="Умови входу, індикатори, ідея стратегії..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors resize-none"
                            />
                        </div>

                        {/* Symbol + Timeframe */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Інструмент</label>
                                <input
                                    type="text"
                                    value={form.symbol}
                                    onChange={e => set('symbol', e.target.value.toUpperCase())}
                                    placeholder="BTCUSDT"
                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Таймфрейм</label>
                                <select
                                    value={form.timeframe}
                                    onChange={e => set('timeframe', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                                >
                                    {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Capital + Currency */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Початковий капітал</label>
                                <input
                                    type="number"
                                    value={form.initial_capital}
                                    onChange={e => set('initial_capital', e.target.value)}
                                    min={0}
                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Валюта</label>
                                <select
                                    value={form.currency}
                                    onChange={e => set('currency', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                                >
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Теги</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={form.tagInput}
                                    onChange={e => set('tagInput', e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                                    placeholder="trend, breakout, ema…"
                                    className="flex-1 px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
                                />
                                <button type="button" onClick={addTag}
                                    className="px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm hover:border-primary transition-colors">
                                    +
                                </button>
                            </div>
                            {form.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {form.tags.map(t => (
                                        <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs">
                                            #{t}
                                            <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer actions — outside scroll area */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0 bg-surface">
                    <button type="button" onClick={onClose}
                        className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-surface-hover rounded-xl transition-all">
                        Скасувати
                    </button>
                    <button
                        type="submit"
                        form="backtest-form"
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        <FlaskConical className="w-4 h-4" />
                        {loading ? 'Створення...' : 'Створити бектест'}
                    </button>
                </div>
            </div>
        </div>
    )
}
