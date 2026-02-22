import { useState } from 'react'
import { X, Search, Star, Code, Activity, BarChart3, TrendingUp, Zap, LineChart, CheckCircle2 } from 'lucide-react'

// Types
interface Indicator {
    id: string
    name: string
    category: string
    description: string
    isNew?: boolean
    isBeta?: boolean
    isUpdated?: boolean
    isFavorite?: boolean
}

interface IndicatorsPanelProps {
    onClose: () => void
    onAddIndicator: (indicatorId: string) => void
    onRemoveIndicator: (indicatorId: string) => void
    activeIndicators: string[]
}

const INDICATORS_DB: Indicator[] = [
    // Momentum
    { id: 'rsi', name: 'Relative Strength Index', category: 'Oscillators', description: 'Індекс відносної сили', isFavorite: true },
    { id: 'stoch', name: 'Stochastic', category: 'Oscillators', description: 'Стохастичний осцилятор' },
    { id: 'cci', name: 'Commodity Channel Index', category: 'Oscillators', description: 'Індекс товарного каналу' },
    { id: 'macd', name: 'MACD', category: 'Oscillators', description: 'Сходження/розходження ковзних середніх', isFavorite: true },

    // Trend
    { id: 'ema', name: 'Moving Average Exponential', category: 'Trend', description: 'Експоненціальна ковзна середня', isFavorite: true },
    { id: 'sma', name: 'Moving Average Simple', category: 'Trend', description: 'Проста ковзна середня' },
    { id: 'bollinger', name: 'Bollinger Bands', category: 'Trend', description: 'Смуги Боллінджера', isFavorite: true },
    { id: 'supertrend', name: 'Supertrend', category: 'Trend', description: 'Супертренд' },
    { id: 'parabolic', name: 'Parabolic SAR', category: 'Trend', description: 'Параболічна система SAR' },

    // Volume
    { id: 'vol', name: 'Volume', category: 'Volume', description: 'Об\'єм торгів' },
    { id: 'vwap', name: 'VWAP', category: 'Volume', description: 'Середньозважена ціна за об\'ємом' },
]

type CategoryId = 'favorites' | 'scripts' | 'technical' | 'fundamental' | 'community'

export default function IndicatorsPanel({ onClose, onAddIndicator, onRemoveIndicator, activeIndicators }: IndicatorsPanelProps) {
    const [activeCategory, setActiveCategory] = useState<CategoryId>('technical')
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    const filteredIndicators = INDICATORS_DB.filter(ind => {
        // Search Filter
        if (searchQuery) {
            return ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ind.description.toLowerCase().includes(searchQuery.toLowerCase())
        }

        // Category Filter
        if (activeCategory === 'favorites') return ind.isFavorite
        // For now, mapping everything to Technical as we don't have other real data
        if (activeCategory === 'technical') return true

        return false
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1E222D] w-[900px] h-[600px] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[#2A2E39]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2A2E39]">
                    <h2 className="text-xl font-medium text-white">Індикатори, показники та стратегії</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar */}
                    <div className="w-64 bg-[#1E222D] border-r border-[#2A2E39] flex flex-col py-2">
                        {/* Search in Sidebar (or Top, fitting Design) - Design has Search on top of content usually, but let's put sidebar items first */}

                        <div className="px-4 py-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Пошук"
                                    className="w-full bg-[#2A2E39] text-white text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:ring-1 focus:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-2 space-y-1 overflow-y-auto custom-scrollbar flex-1 px-2">
                            <SidebarItem
                                icon={<Star className="w-4 h-4" />}
                                label="Обране"
                                active={activeCategory === 'favorites'}
                                onClick={() => setActiveCategory('favorites')}
                            />
                            <SidebarItem
                                icon={<Code className="w-4 h-4" />}
                                label="Мої скрипти"
                                active={activeCategory === 'scripts'}
                                onClick={() => setActiveCategory('scripts')}
                            />

                            <div className="px-3 py-2 text-xs font-bold text-gray-500 mt-4">ВБУДОВАНІ</div>

                            <SidebarItem
                                icon={<Activity className="w-4 h-4" />}
                                label="Теханаліз"
                                active={activeCategory === 'technical'}
                                onClick={() => setActiveCategory('technical')}
                            />
                            <SidebarItem
                                icon={<BarChart3 className="w-4 h-4" />}
                                label="Фундаментальні"
                                active={activeCategory === 'fundamental'}
                                onClick={() => setActiveCategory('fundamental')}
                            />

                            <div className="px-3 py-2 text-xs font-bold text-gray-500 mt-4">СПІЛЬНОТА</div>

                            <SidebarItem
                                icon={<Zap className="w-4 h-4" />}
                                label="Вибір редакції"
                                active={activeCategory === 'community'}
                                onClick={() => setActiveCategory('community')}
                            />
                            <SidebarItem
                                icon={<TrendingUp className="w-4 h-4" />}
                                label="Топ"
                                active={activeCategory === 'community'}
                                onClick={() => setActiveCategory('community')}
                            />
                            <SidebarItem
                                icon={<LineChart className="w-4 h-4" />}
                                label="Популярні"
                                active={activeCategory === 'community'}
                                onClick={() => setActiveCategory('community')}
                            />
                        </div>
                    </div>

                    {/* Main List */}
                    <div className="flex-1 bg-[#131722] overflow-hidden flex flex-col">

                        {/* Filters / Tags (Optional, matching screenshot "Indicators", "Strategies" pills) */}
                        <div className="flex items-center justify-between p-4 border-b border-[#2A2E39]">
                            <div className="flex gap-2">
                                <FilterPill label="Індикатори" active={true} />
                                <FilterPill label="Стратегії" active={false} />
                                <FilterPill label="Профілі" active={false} />
                            </div>

                            {/* Grid/List Toggle */}
                            <div className="flex bg-[#2A2E39] rounded p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#131722] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#131722] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                </button>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-1'}>
                                {filteredIndicators.map(ind => (
                                    <div
                                        key={ind.id}
                                        className={`
                                            group rounded-lg border border-transparent transition-all
                                            ${activeIndicators.includes(ind.id) ? 'bg-[#2A2E39] border-primary/30' : 'hover:bg-[#2A2E39]'}
                                            ${viewMode === 'grid' ? 'p-4 bg-[#1E222D]' : 'p-3 flex items-center justify-between'}
                                        `}
                                    >
                                        {/* Clickable name/description area — only adds when not yet active */}
                                        <div
                                            className={`flex-1 ${!activeIndicators.includes(ind.id) ? 'cursor-pointer' : 'cursor-default'}`}
                                            onClick={() => { if (!activeIndicators.includes(ind.id)) onAddIndicator(ind.id) }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white text-base">{ind.name}</span>
                                                {ind.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-0.5">{ind.description}</div>
                                        </div>

                                        {viewMode === 'list' && (
                                            activeIndicators.includes(ind.id) ? (
                                                /* Active indicator: green check + red remove button */
                                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                                                    <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Активний
                                                    </span>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); onRemoveIndicator(ind.id) }}
                                                        title="Прибрати індикатор"
                                                        className="ml-1 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Inactive: Add button */
                                                <button
                                                    onClick={() => onAddIndicator(ind.id)}
                                                    className="flex-shrink-0 ml-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-[#2A2E39] text-gray-400 group-hover:text-white group-hover:bg-primary group-hover:shadow-lg"
                                                >
                                                    Додати
                                                </button>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-[#2A2E39] text-white font-medium' : 'text-gray-400 hover:bg-[#2A2E39] hover:text-white'
                }`}
        >
            <div className={active ? 'text-primary' : ''}>{icon}</div>
            {label}
        </button>
    )
}

function FilterPill({ label, active }: { label: string, active: boolean }) {
    return (
        <button className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? 'bg-[#2A2E39] text-white' : 'text-gray-400 hover:bg-[#2A2E39] hover:text-white'
            }`}>
            {label}
        </button>
    )
}
