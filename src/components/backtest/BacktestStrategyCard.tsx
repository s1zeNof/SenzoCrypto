import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, BarChart2, Target, Trash2, ChevronRight } from 'lucide-react'
import type { BacktestStrategy } from '@/services/BacktestService'

interface Props {
    strategy: BacktestStrategy
    view: 'grid' | 'list'
    onDelete: (id: string) => void
}

export default function BacktestStrategyCard({ strategy, view, onDelete }: Props) {
    const stats = strategy.stats
    const pnl = stats?.totalPnl ?? 0
    const winRate = stats?.winRate ?? 0
    const pf = stats?.profitFactor ?? 0
    const trades = strategy.trade_count ?? 0
    const isProfit = pnl >= 0

    const PnlBadge = () => (
        <span className={`flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isProfit ? '+' : ''}{pnl.toFixed(2)} {strategy.currency}
        </span>
    )

    if (view === 'list') {
        return (
            <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-primary/40 transition-all group">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isProfit ? 'bg-green-500/10' : trades === 0 ? 'bg-gray-500/10' : 'bg-red-500/10'}`}>
                    <BarChart2 className={`w-5 h-5 ${isProfit ? 'text-green-400' : trades === 0 ? 'text-gray-400' : 'text-red-400'}`} />
                </div>

                {/* Name + tags */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{strategy.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 font-mono">{strategy.symbol}</span>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-500">{strategy.timeframe}</span>
                        {strategy.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-md">#{t}</span>
                        ))}
                    </div>
                </div>

                {/* Stats row */}
                <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-center">
                        <p className="text-gray-500 text-xs mb-0.5">Угоди</p>
                        <p className="font-medium">{trades}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs mb-0.5">Win Rate</p>
                        <p className={`font-medium ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs mb-0.5">PF</p>
                        <p className={`font-medium ${pf >= 1 ? 'text-green-400' : 'text-red-400'}`}>{pf === Infinity ? '∞' : pf.toFixed(2)}</p>
                    </div>
                    <PnlBadge />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); onDelete(strategy.id) }}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <Link to={`/app/backtest/${strategy.id}`}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        )
    }

    // Grid view
    return (
        <Link to={`/app/backtest/${strategy.id}`} className="block group">
            <div className="relative bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 h-full">

                {/* Delete btn */}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(strategy.id) }}
                    className="absolute top-3 right-3 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Top row */}
                <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isProfit && trades > 0 ? 'bg-green-500/10' : trades === 0 ? 'bg-gray-500/10' : 'bg-red-500/10'}`}>
                        <BarChart2 className={`w-5 h-5 ${isProfit && trades > 0 ? 'text-green-400' : trades === 0 ? 'text-gray-400' : 'text-red-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight truncate">{strategy.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-gray-400">{strategy.symbol}</span>
                            <span className="text-gray-600 text-xs">·</span>
                            <span className="text-xs text-gray-500">{strategy.timeframe}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {strategy.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{strategy.description}</p>
                )}

                {/* Stats grid */}
                {trades > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-background rounded-xl p-2.5 text-center">
                            <p className="text-gray-500 text-xs mb-0.5">Win Rate</p>
                            <p className={`font-bold text-sm ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                {winRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-background rounded-xl p-2.5 text-center">
                            <p className="text-gray-500 text-xs mb-0.5">Угоди</p>
                            <p className="font-bold text-sm">{trades}</p>
                        </div>
                        <div className="bg-background rounded-xl p-2.5 text-center">
                            <p className="text-gray-500 text-xs mb-0.5">PF</p>
                            <p className={`font-bold text-sm ${pf >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                                {pf === Infinity ? '∞' : pf.toFixed(2)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-4 mb-4 bg-background rounded-xl border border-dashed border-border">
                        <p className="text-xs text-gray-600">Ще немає угод</p>
                    </div>
                )}

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                        {strategy.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">#{t}</span>
                        ))}
                        {strategy.tags.length > 2 && (
                            <span className="text-xs px-2 py-0.5 bg-surface-hover rounded-full text-gray-500">+{strategy.tags.length - 2}</span>
                        )}
                    </div>
                    {trades > 0 && <PnlBadge />}
                </div>

                {/* Капітал */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Капітал: {strategy.initial_capital.toLocaleString()} {strategy.currency}</span>
                    </div>
                    <span className="text-gray-600">{new Date(strategy.created_at).toLocaleDateString('uk-UA')}</span>
                </div>
            </div>
        </Link>
    )
}
