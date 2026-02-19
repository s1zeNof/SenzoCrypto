import { useState } from 'react'
import { X, Plus, Settings as SettingsIcon, Trash2 } from 'lucide-react'

interface Indicator {
    id: string
    type: 'RSI' | 'MACD' | 'EMA' | 'SMA'
    params: any
    visible: boolean
}

interface IndicatorsModalProps {
    onClose: () => void
    onAddIndicator: (indicator: Omit<Indicator, 'id'>) => void
    indicators: Indicator[]
    onRemoveIndicator: (id: string) => void
    onToggleIndicator: (id: string) => void
    onEditIndicator: (indicator: Indicator) => void
}

export default function IndicatorsModal({
    onClose,
    onAddIndicator,
    indicators,
    onRemoveIndicator,
    onToggleIndicator,
    onEditIndicator
}: IndicatorsModalProps) {
    const [selectedTab, setSelectedTab] = useState<'my' | 'add'>('my')
    const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null)

    // RSI Default Settings
    const [rsiPeriod, setRsiPeriod] = useState(14)
    const [rsiOverbought, setRsiOverbought] = useState(70)
    const [rsiOversold, setRsiOversold] = useState(30)
    const [rsiColor, setRsiColor] = useState('#7E57C2')
    const [rsiLineWidth, setRsiLineWidth] = useState(2)

    const handleAddRSI = () => {
        onAddIndicator({
            type: 'RSI',
            params: {
                period: rsiPeriod,
                overbought: rsiOverbought,
                oversold: rsiOversold,
                color: rsiColor,
                lineWidth: rsiLineWidth
            },
            visible: true
        })
        // Reset to defaults
        setRsiPeriod(14)
        setRsiOverbought(70)
        setRsiOversold(30)
        setRsiColor('#7E57C2')
        setRsiLineWidth(2)
        setSelectedTab('my')
    }

    const handleEditIndicator = (indicator: Indicator) => {
        setEditingIndicator(indicator)
        if (indicator.type === 'RSI') {
            setRsiPeriod(indicator.params.period)
            setRsiOverbought(indicator.params.overbought)
            setRsiOversold(indicator.params.oversold)
            setRsiColor(indicator.params.color)
            setRsiLineWidth(indicator.params.lineWidth)
            setSelectedTab('add')
        }
    }

    const handleUpdateIndicator = () => {
        if (!editingIndicator) return
        onEditIndicator({
            ...editingIndicator,
            params: {
                period: rsiPeriod,
                overbought: rsiOverbought,
                oversold: rsiOversold,
                color: rsiColor,
                lineWidth: rsiLineWidth
            }
        })
        setEditingIndicator(null)
        setSelectedTab('my')
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold">Індикатори</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setSelectedTab('my')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${selectedTab === 'my' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Мої Індикатори ({indicators.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('add')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${selectedTab === 'add' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Додати Індикатор
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedTab === 'my' ? (
                        <div className="space-y-2">
                            {indicators.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">
                                    <p className="mb-2">Немає доданих індикаторів</p>
                                    <button
                                        onClick={() => setSelectedTab('add')}
                                        className="text-primary hover:underline text-sm"
                                    >
                                        Додати перший індикатор
                                    </button>
                                </div>
                            ) : (
                                indicators.map(indicator => (
                                    <div key={indicator.id} className="flex items-center gap-3 p-3 bg-black/20 border border-border rounded-lg hover:bg-black/30 transition-colors">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={indicator.visible}
                                                onChange={() => onToggleIndicator(indicator.id)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{indicator.type}</div>
                                                <div className="text-xs text-gray-400">
                                                    {indicator.type === 'RSI' && `Period: ${indicator.params.period}, Overbought: ${indicator.params.overbought}, Oversold: ${indicator.params.oversold}`}
                                                </div>
                                            </div>
                                        </label>
                                        <button
                                            onClick={() => handleEditIndicator(indicator)}
                                            className="p-2 hover:bg-white/10 rounded transition-colors text-blue-400"
                                            title="Edit"
                                        >
                                            <SettingsIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onRemoveIndicator(indicator.id)}
                                            className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* RSI Indicator Form */}
                            <div className="bg-black/20 border border-border rounded-lg p-4">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    RSI (Relative Strength Index)
                                    {editingIndicator && <span className="text-xs text-blue-400">(Editing)</span>}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            Period (Період)
                                        </label>
                                        <input
                                            type="number"
                                            value={rsiPeriod}
                                            onChange={(e) => setRsiPeriod(parseInt(e.target.value))}
                                            min="1"
                                            max="100"
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">
                                                Overbought (Перекупленість)
                                            </label>
                                            <input
                                                type="number"
                                                value={rsiOverbought}
                                                onChange={(e) => setRsiOverbought(parseInt(e.target.value))}
                                                min="50"
                                                max="100"
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">
                                                Oversold (Перепроданість)
                                            </label>
                                            <input
                                                type="number"
                                                value={rsiOversold}
                                                onChange={(e) => setRsiOversold(parseInt(e.target.value))}
                                                min="0"
                                                max="50"
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            Line Color (Колір лінії)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={rsiColor}
                                                onChange={(e) => setRsiColor(e.target.value)}
                                                className="w-16 h-10 bg-background border border-border rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={rsiColor}
                                                onChange={(e) => setRsiColor(e.target.value)}
                                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            Line Width (Товщина лінії): {rsiLineWidth}px
                                        </label>
                                        <input
                                            type="range"
                                            value={rsiLineWidth}
                                            onChange={(e) => setRsiLineWidth(parseInt(e.target.value))}
                                            min="1"
                                            max="5"
                                            className="w-full accent-primary h-2 bg-surface rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <button
                                        onClick={editingIndicator ? handleUpdateIndicator : handleAddRSI}
                                        className="w-full py-3 bg-primary hover:bg-primary/80 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
                                    >
                                        {editingIndicator ? 'Оновити RSI' : 'Додати RSI'}
                                    </button>

                                    {editingIndicator && (
                                        <button
                                            onClick={() => {
                                                setEditingIndicator(null)
                                                setSelectedTab('my')
                                            }}
                                            className="w-full py-2 bg-transparent border border-border hover:bg-white/5 text-gray-400 rounded-lg transition-colors"
                                        >
                                            Скасувати
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Placeholder for other indicators */}
                            <div className="bg-black/10 border border-border/50 rounded-lg p-4 text-center text-gray-500">
                                <p className="text-sm">Інші індикатори (MACD, EMA, SMA) - Coming Soon</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export type { Indicator }
