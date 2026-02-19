import type { BacktestTrade } from '@/services/firebase'

export interface BacktestStats {
    totalTrades: number
    wins: number
    losses: number
    breakevens: number
    winRate: number         // 0–100
    profitFactor: number    // gross profit / gross loss
    maxDrawdown: number     // largest peak-to-trough drop (negative USDT)
    avgRMultiple: number    // average R achieved
    totalPnl: number
    equityCurve: { index: number; cumPnl: number }[]
}

export function calculateBacktestStats(trades: BacktestTrade[]): BacktestStats {
    if (trades.length === 0) {
        return {
            totalTrades: 0, wins: 0, losses: 0, breakevens: 0,
            winRate: 0, profitFactor: 0, maxDrawdown: 0,
            avgRMultiple: 0, totalPnl: 0, equityCurve: [{ index: 0, cumPnl: 0 }],
        }
    }

    const wins      = trades.filter(t => t.status === 'win').length
    const losses    = trades.filter(t => t.status === 'loss').length
    const beven     = trades.filter(t => t.status === 'breakeven').length
    const total     = trades.length
    const winRate   = (wins / total) * 100

    const grossProfit = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0)
    const grossLoss   = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0))
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss

    // Running equity — max drawdown + equity curve
    let peak = 0
    let maxDrawdown = 0
    let cumPnl = 0
    const equityCurve: { index: number; cumPnl: number }[] = [{ index: 0, cumPnl: 0 }]

    trades.forEach((t, i) => {
        cumPnl += t.pnl
        equityCurve.push({ index: i + 1, cumPnl: parseFloat(cumPnl.toFixed(2)) })
        if (cumPnl > peak) peak = cumPnl
        const dd = cumPnl - peak
        if (dd < maxDrawdown) maxDrawdown = dd
    })

    const rValues = trades.map(t => t.rMultiple).filter(r => isFinite(r) && !isNaN(r))
    const avgRMultiple = rValues.length > 0
        ? rValues.reduce((s, r) => s + r, 0) / rValues.length
        : 0

    return {
        totalTrades: total, wins, losses, breakevens: beven,
        winRate, profitFactor, maxDrawdown,
        avgRMultiple, totalPnl: parseFloat(cumPnl.toFixed(2)), equityCurve,
    }
}
