import { useState } from 'react'
import { X, FlaskConical } from 'lucide-react'
import { BacktestService, type BacktestStrategy } from '@/services/BacktestService'
import { toast } from 'sonner'

const TIMEFRAMES = ['1m','5m','15m','30m','1H','2H','4H','8H','12H','1D','3D','1W','1M']
const CURRENCIES = ['USDT','USD','BTC','ETH','UAH']

interface Props {
    isOpen: boolean
    userId: string
    onClose: () => void
    onCreated: (s: BacktestStrategy) => void
}

export default function CreateBacktestModal({ isOpen, userId, onClose, onCreated }: Props) {
    const [loading, setLoading] = useState(false)
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <FlaskConical className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold">Новий бектест</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                {TIMEFRAMES.map(tf => (
                                    <option key={tf} value={tf}>{tf}</option>
                                ))}
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

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-surface-hover rounded-xl transition-all">
                            Скасувати
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-medium disabled:opacity-50">
                            {loading ? 'Створення...' : 'Створити'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
