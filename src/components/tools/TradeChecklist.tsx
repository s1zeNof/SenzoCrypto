import { useState, useEffect } from 'react'
import { CheckSquare, RotateCcw, Plus, Trash2, ChevronDown, ChevronRight, List } from 'lucide-react'

interface CheckItem {
    id: string
    text: string
    checked: boolean
    category: 'general' | 'strategy' | 'psychology' | 'technical'
}

const CATEGORIES = {
    general: 'Загальні',
    strategy: 'Стратегія',
    psychology: 'Психологія',
    technical: 'Технічний Аналіз'
}

const QUESTION_BANK = [
    { text: 'Чи є тренд на старшому таймфреймі (D1/H4)?', category: 'technical' },
    { text: 'Чи знаходиться ціна біля сильного рівня?', category: 'technical' },
    { text: 'Чи є підтвердження об\'ємами?', category: 'technical' },
    { text: 'Чи є дивергенція на RSI/MACD?', category: 'technical' },
    { text: 'Чи є ліквідність за рівнем (Stop Hunt)?', category: 'technical' },
    { text: 'Чи стабільний Біткоїн (BTC Dominance)?', category: 'technical' },

    { text: 'Чи відповідає угода моїй торговій системі?', category: 'strategy' },
    { text: 'Чи виставлений Stop Loss у безпечному місці?', category: 'strategy' },
    { text: 'Чи є R:R більше ніж 1:3?', category: 'strategy' },
    { text: 'Чи немає важливих новин (CPI, FOMC) найближчим часом?', category: 'strategy' },
    { text: 'Чи я не торгую проти сильного тренду?', category: 'strategy' },

    { text: 'Я спокійний і не відчуваю FOMO?', category: 'psychology' },
    { text: 'Я готовий прийняти цей збиток?', category: 'psychology' },
    { text: 'Я не намагаюся відігратися за минулий лос (Revenge Trade)?', category: 'psychology' },
    { text: 'Я не перевищую ризик на день?', category: 'psychology' },
    { text: 'Чи я виспався і в ресурсному стані?', category: 'psychology' },
] as const

export default function TradeChecklist() {
    const [checks, setChecks] = useState<CheckItem[]>([])
    const [isBankOpen, setIsBankOpen] = useState(false)
    const [newCheckText, setNewCheckText] = useState('')

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('tradeChecklist_v2')
        if (saved) {
            setChecks(JSON.parse(saved))
        } else {
            // Default items
            setChecks([
                { id: '1', text: 'Тренд на моєму боці', checked: false, category: 'technical' },
                { id: '2', text: 'Stop Loss виставлено', checked: false, category: 'strategy' },
                { id: '3', text: 'Ризик < 2%', checked: false, category: 'strategy' },
            ])
        }
    }, [])

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('tradeChecklist_v2', JSON.stringify(checks))
    }, [checks])

    const toggleCheck = (id: string) => {
        setChecks(checks.map(c => c.id === id ? { ...c, checked: !c.checked } : c))
    }

    const resetChecks = () => {
        setChecks(checks.map(c => ({ ...c, checked: false })))
    }

    const addCheck = (text: string, category: CheckItem['category'] = 'general') => {
        if (!text.trim()) return
        const newCheck: CheckItem = {
            id: Date.now().toString() + Math.random(),
            text,
            checked: false,
            category
        }
        setChecks([...checks, newCheck])
        setNewCheckText('')
    }

    const removeCheck = (id: string) => {
        setChecks(prev => prev.filter(c => c.id !== id))
    }

    const progress = Math.round((checks.filter(c => c.checked).length / checks.length) * 100) || 0

    return (
        <div className="glass-card p-6 h-full flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <CheckSquare className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold">Чек-лист</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsBankOpen(!isBankOpen)}
                        className={`p-2 rounded-lg transition-colors ${isBankOpen ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Банк питань"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onClick={resetChecks}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Скинути всі"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Готовність</span>
                    <span className={`font-bold ${progress === 100 ? 'text-success' : 'text-primary'}`}>{progress}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex gap-6">
                {/* Main List */}
                <div className="flex-1 space-y-6">
                    {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(cat => {
                        const catChecks = checks.filter(c => c.category === cat)
                        if (catChecks.length === 0) return null

                        return (
                            <div key={cat}>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{CATEGORIES[cat]}</h3>
                                <div className="space-y-2">
                                    {catChecks.map(check => (
                                        <div
                                            key={check.id}
                                            className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${check.checked
                                                ? 'bg-success/10 border-success/30'
                                                : 'bg-surface/50 border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={check.checked}
                                                onChange={() => toggleCheck(check.id)}
                                                className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary bg-transparent cursor-pointer"
                                            />
                                            <span className={`flex-1 text-sm ${check.checked ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                                                {check.text}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeCheck(check.id)
                                                }}
                                                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {checks.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            Список порожній. Додайте пункти з банку питань або створіть свої.
                        </div>
                    )}
                </div>

                {/* Question Bank Sidebar */}
                {isBankOpen && (
                    <div className="w-64 border-l border-border pl-4 space-y-4 animate-in slide-in-from-right-5">
                        <h3 className="font-bold text-sm">Банк Питань</h3>
                        <div className="space-y-4">
                            {(['technical', 'strategy', 'psychology'] as const).map(cat => (
                                <div key={cat}>
                                    <div className="text-xs text-gray-500 uppercase mb-2">{CATEGORIES[cat]}</div>
                                    <div className="space-y-2">
                                        {QUESTION_BANK.filter(q => q.category === cat).map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => addCheck(q.text, q.category)}
                                                className="w-full text-left text-xs p-2 rounded bg-surface hover:bg-white/5 hover:text-primary transition-colors border border-transparent hover:border-primary/30"
                                            >
                                                + {q.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCheckText}
                        onChange={(e) => setNewCheckText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCheck(newCheckText)}
                        placeholder="Додати свій пункт..."
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={() => addCheck(newCheckText)}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
