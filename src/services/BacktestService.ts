/**
 * BacktestService.ts
 * CRUD for backtest strategies + their trades
 */
import { supabase } from '@/lib/supabase'
import { calculateBacktestStats, type BacktestStats } from '@/utils/backtestStats'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BacktestStrategy {
    id: string
    user_id: string
    name: string
    description?: string
    symbol: string          // e.g. BTCUSDT
    timeframe: string       // e.g. 1H, 4H, 1D
    tags: string[]
    initial_capital: number
    currency: string        // USDT, USD, …
    created_at: string
    updated_at: string
    // computed from trades (not in DB):
    stats?: BacktestStats
    trade_count?: number
}

export interface BacktestTrade {
    id: string
    strategy_id: string
    user_id: string
    pair: string
    timeframe: string
    side: 'long' | 'short'
    entry_price: number
    exit_price: number
    stop_loss?: number
    take_profit?: number
    size: number            // position size in base currency
    pnl: number             // in currency
    pnl_percent: number     // %
    r_multiple: number
    status: 'win' | 'loss' | 'breakeven'
    entry_time: string      // ISO
    exit_time: string       // ISO
    screenshot_url?: string
    notes?: string
    created_at: string
}

// ─── Strategy CRUD ────────────────────────────────────────────────────────────

export const BacktestService = {

    async getStrategies(userId: string): Promise<BacktestStrategy[]> {
        const { data, error } = await supabase
            .from('backtest_strategies')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw new Error(error.message)

        // For each strategy, fetch stats from trades
        const strategies = await Promise.all(
            (data ?? []).map(async (s) => {
                const trades = await BacktestService.getTrades(s.id)
                const stats = calculateBacktestStats(trades.map(t => ({
                    id: t.id,
                    userId: t.user_id,
                    strategyName: s.name,
                    pair: t.pair,
                    timeframe: t.timeframe,
                    side: t.side,
                    entryPrice: t.entry_price,
                    exitPrice: t.exit_price,
                    stopLoss: t.stop_loss,
                    takeProfit: t.take_profit,
                    size: t.size,
                    pnl: t.pnl,
                    rMultiple: t.r_multiple,
                    status: t.status,
                    entryTime: new Date(t.entry_time),
                    exitTime: new Date(t.exit_time),
                    notes: t.notes,
                })))
                return { ...s, stats, trade_count: trades.length }
            })
        )
        return strategies
    },

    async createStrategy(
        userId: string,
        data: Omit<BacktestStrategy, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'stats' | 'trade_count'>
    ): Promise<BacktestStrategy> {
        const now = new Date().toISOString()
        const { data: row, error } = await supabase
            .from('backtest_strategies')
            .insert({
                user_id:         userId,
                name:            data.name,
                description:     data.description ?? null,
                symbol:          data.symbol,
                timeframe:       data.timeframe,
                tags:            data.tags,
                initial_capital: data.initial_capital,
                currency:        data.currency,
                created_at:      now,
                updated_at:      now,
            })
            .select()
            .single()
        if (error) throw new Error(error.message)
        return { ...row, stats: undefined, trade_count: 0 }
    },

    async updateStrategy(id: string, data: Partial<BacktestStrategy>): Promise<void> {
        const patch: Record<string, any> = { updated_at: new Date().toISOString() }
        if (data.name            !== undefined) patch.name            = data.name
        if (data.description     !== undefined) patch.description     = data.description
        if (data.symbol          !== undefined) patch.symbol          = data.symbol
        if (data.timeframe       !== undefined) patch.timeframe       = data.timeframe
        if (data.tags            !== undefined) patch.tags            = data.tags
        if (data.initial_capital !== undefined) patch.initial_capital = data.initial_capital
        if (data.currency        !== undefined) patch.currency        = data.currency
        const { error } = await supabase.from('backtest_strategies').update(patch).eq('id', id)
        if (error) throw new Error(error.message)
    },

    async deleteStrategy(id: string): Promise<void> {
        // Delete trades first
        await supabase.from('backtest_trades_v2').delete().eq('strategy_id', id)
        const { error } = await supabase.from('backtest_strategies').delete().eq('id', id)
        if (error) throw new Error(error.message)
    },

    // ─── Trades ───────────────────────────────────────────────────────────────

    async getTrades(strategyId: string): Promise<BacktestTrade[]> {
        const { data, error } = await supabase
            .from('backtest_trades_v2')
            .select('*')
            .eq('strategy_id', strategyId)
            .order('entry_time', { ascending: true })
        if (error) throw new Error(error.message)
        return data ?? []
    },

    async addTrade(
        userId: string,
        strategyId: string,
        trade: Omit<BacktestTrade, 'id' | 'strategy_id' | 'user_id' | 'created_at'>
    ): Promise<BacktestTrade> {
        const { data, error } = await supabase
            .from('backtest_trades_v2')
            .insert({
                strategy_id:    strategyId,
                user_id:        userId,
                pair:           trade.pair,
                timeframe:      trade.timeframe,
                side:           trade.side,
                entry_price:    trade.entry_price,
                exit_price:     trade.exit_price,
                stop_loss:      trade.stop_loss ?? null,
                take_profit:    trade.take_profit ?? null,
                size:           trade.size,
                pnl:            trade.pnl,
                pnl_percent:    trade.pnl_percent,
                r_multiple:     trade.r_multiple,
                status:         trade.status,
                entry_time:     trade.entry_time,
                exit_time:      trade.exit_time,
                screenshot_url: trade.screenshot_url ?? null,
                notes:          trade.notes ?? null,
                created_at:     new Date().toISOString(),
            })
            .select()
            .single()
        if (error) throw new Error(error.message)
        return data
    },

    async deleteTrade(id: string): Promise<void> {
        const { error } = await supabase.from('backtest_trades_v2').delete().eq('id', id)
        if (error) throw new Error(error.message)
    },

    async updateTrade(id: string, updates: Partial<BacktestTrade>): Promise<void> {
        const patch: Record<string, any> = {}
        if (updates.pair           !== undefined) patch.pair           = updates.pair
        if (updates.timeframe      !== undefined) patch.timeframe      = updates.timeframe
        if (updates.side           !== undefined) patch.side           = updates.side
        if (updates.entry_price    !== undefined) patch.entry_price    = updates.entry_price
        if (updates.exit_price     !== undefined) patch.exit_price     = updates.exit_price
        if (updates.stop_loss      !== undefined) patch.stop_loss      = updates.stop_loss
        if (updates.take_profit    !== undefined) patch.take_profit    = updates.take_profit
        if (updates.size           !== undefined) patch.size           = updates.size
        if (updates.pnl            !== undefined) patch.pnl            = updates.pnl
        if (updates.pnl_percent    !== undefined) patch.pnl_percent    = updates.pnl_percent
        if (updates.r_multiple     !== undefined) patch.r_multiple     = updates.r_multiple
        if (updates.status         !== undefined) patch.status         = updates.status
        if (updates.entry_time     !== undefined) patch.entry_time     = updates.entry_time
        if (updates.exit_time      !== undefined) patch.exit_time      = updates.exit_time
        if (updates.screenshot_url !== undefined) patch.screenshot_url = updates.screenshot_url
        if (updates.notes          !== undefined) patch.notes          = updates.notes
        const { error } = await supabase.from('backtest_trades_v2').update(patch).eq('id', id)
        if (error) throw new Error(error.message)
    },
}
