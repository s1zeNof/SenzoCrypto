import { useState, useEffect } from 'react'
import { FlaskConical } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import BacktestChart from '@/components/backtest/BacktestChart'
import TradeJournal from '@/components/backtest/TradeJournal'
import { getBacktestTrades, type BacktestTrade } from '@/services/firebase'

type Tab = 'manual' | 'journal'

export default function Backtest() {
    const { user } = useAuth()
    const [activeTab, setActiveTab]       = useState<Tab>('manual')
    const [trades, setTrades]             = useState<BacktestTrade[]>([])
    const [loading, setLoading]           = useState(false)
    const [strategyName, setStrategyName] = useState('Стратегія 1')

    const loadTrades = async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await getBacktestTrades(user.id)
            // Filter client-side to avoid needing composite index initially
            setTrades(data.filter(t => t.strategyName === strategyName))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTrades()
    }, [user, strategyName])

    const handleTradeSaved = (trade: BacktestTrade) => {
        setTrades(prev => [...prev, trade])
    }

    const handleTradeDeleted = (tradeId: string) => {
        setTrades(prev => prev.filter(t => t.id !== tradeId))
    }

    const isManual = activeTab === 'manual'

    return (
        <div className={isManual ? 'h-[calc(100vh-64px)] flex flex-col overflow-hidden' : 'space-y-6 animate-fade-in pb-8'}>

            {/* Header — only in journal mode (save vertical space in chart mode) */}
            {!isManual && (
                <div>
                    <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                        <FlaskConical className="w-7 h-7 text-primary" />
                        Бектест
                    </h1>
                    <p className="text-sm text-gray-500">Ручний прогін і журнал угод для тестування торгових стратегій.</p>
                </div>
            )}

            {/* Tab bar */}
            <div className={`flex gap-1 bg-surface-elevated border border-border rounded-xl p-1 w-fit ${isManual ? 'mx-4 mt-3' : ''}`}>
                <TabBtn active={activeTab === 'manual'} onClick={() => setActiveTab('manual')}>
                    📈 Ручний бектест
                </TabBtn>
                <TabBtn active={activeTab === 'journal'} onClick={() => setActiveTab('journal')}>
                    📋 Журнал угод
                </TabBtn>
            </div>

            {/* Manual tab — chart fills rest of viewport */}
            {isManual && (
                <div className="flex-1 overflow-hidden">
                    <BacktestChart
                        userId={user?.uid ?? ''}
                        strategyName={strategyName}
                        trades={trades}
                        onTradeSaved={handleTradeSaved}
                    />
                </div>
            )}

            {/* Journal tab — scrollable content */}
            {!isManual && (
                <TradeJournal
                    userId={user?.uid ?? ''}
                    strategyName={strategyName}
                    onStrategyChange={name => {
                        setStrategyName(name)
                    }}
                    trades={trades}
                    loading={loading}
                    onTradeSaved={handleTradeSaved}
                    onTradeDeleted={handleTradeDeleted}
                />
            )}
        </div>
    )
}

function TabBtn({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-400 hover:text-white hover:bg-surface-hover'
            }`}>
            {children}
        </button>
    )
}
