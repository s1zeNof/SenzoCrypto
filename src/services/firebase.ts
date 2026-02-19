/**
 * firebase.ts — MIGRATED TO SUPABASE
 *
 * This file keeps its name so that all existing imports (26+ files)
 * continue working without modification.
 *
 * Firebase → Supabase mapping:
 *   Firebase Auth          → Supabase Auth
 *   Firestore              → Supabase (PostgreSQL via REST)
 *   Firebase Storage       → Supabase Storage
 */

import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Re-export supabase instance as `db` and `auth` for legacy imports
export { supabase as db, supabase as auth, supabase as storage }

// ─── Types ───────────────────────────────────────────────────────────────────

export type { User, Session }

export interface UserData {
    id: string
    uid: string          // alias for id — kept for backward compat
    email: string | null
    display_name: string | null
    displayName: string | null   // alias
    username?: string
    first_name?: string
    firstName?: string           // alias
    last_name?: string
    lastName?: string            // alias
    photo_url?: string | null
    photoURL?: string | null     // alias
    created_at?: string
    createdAt?: any              // alias
    saved_posts?: string[]
    savedPosts?: string[]        // alias
    mastered_posts?: string[]
    masteredPosts?: string[]     // alias
    pnl?: { daily: number; total: number; history: { date: string; value: number }[] }
    privacy?: { showPnL: boolean; showPortfolio: boolean; showSavedPosts: boolean; isPublic: boolean }
    referral_code?: string
    referralCode?: string
    invited_count?: number
    invitedCount?: number
    ticker_coins?: string[]
    tickerCoins?: string[]
    xp?: { trader: number; web3: number }
    plan?: 'free' | 'premium'
}

export interface PortfolioAsset {
    coinId: string
    symbol: string
    name: string
    amount: number
    avgPrice: number
    currentPrice?: number
    image?: string
}

export interface Portfolio {
    id?: string
    userId: string
    user_id?: string
    exchange: string
    type: 'spot' | 'futures'
    assets: PortfolioAsset[]
    updatedAt?: any
    updated_at?: string
}

export interface Trade {
    id?: string
    userId: string
    user_id?: string
    date: any
    exchange: string
    pair: string
    type: 'spot' | 'futures'
    side: 'long' | 'short'
    pnl: number
    notes?: string
    createdAt?: any
    created_at?: string
}

export interface BacktestTrade {
    id?: string
    userId: string
    user_id?: string
    strategyName: string
    strategy_name?: string
    pair: string
    timeframe: string
    side: 'long' | 'short'
    entryPrice: number
    entry_price?: number
    exitPrice: number
    exit_price?: number
    stopLoss?: number
    stop_loss?: number
    takeProfit?: number
    take_profit?: number
    size: number
    pnl: number
    rMultiple: number
    r_multiple?: number
    status: 'win' | 'loss' | 'breakeven'
    entryTime: Date
    entry_time?: string
    exitTime: Date
    exit_time?: string
    notes?: string
    createdAt?: any
    created_at?: string
}

// ─── Helper — normalise a Supabase user_profiles row to UserData ─────────────

function normaliseUser(row: any): UserData {
    return {
        id:          row.id,
        uid:         row.id,
        email:       row.email ?? null,
        display_name:  row.display_name ?? null,
        displayName:   row.display_name ?? null,
        username:      row.username,
        first_name:    row.first_name,
        firstName:     row.first_name,
        last_name:     row.last_name,
        lastName:      row.last_name,
        photo_url:     row.photo_url,
        photoURL:      row.photo_url,
        created_at:    row.created_at,
        createdAt:     row.created_at,
        saved_posts:   row.saved_posts   ?? [],
        savedPosts:    row.saved_posts   ?? [],
        mastered_posts: row.mastered_posts ?? [],
        masteredPosts:  row.mastered_posts ?? [],
        pnl:           row.pnl,
        privacy:       row.privacy,
        referral_code: row.referral_code,
        referralCode:  row.referral_code,
        invited_count: row.invited_count,
        invitedCount:  row.invited_count,
        ticker_coins:  row.ticker_coins  ?? [],
        tickerCoins:   row.ticker_coins  ?? [],
        xp:            row.xp,
        plan:          row.plan ?? 'free',
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerWithEmail = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name:   firstName,
                    last_name:    lastName,
                    username,
                    display_name: `${firstName} ${lastName}`.trim(),
                },
            },
        })

        if (error) return { user: null, error: error.message }

        // Profile row is created automatically by DB trigger (see SQL schema)
        return { user: data.user, error: null }
    } catch (e: any) {
        return { user: null, error: e.message }
    }
}

export const loginWithEmail = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { user: null, error: error.message }
        return { user: data.user, error: null }
    } catch (e: any) {
        return { user: null, error: e.message }
    }
}

export const loginWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/app/dashboard` },
        })
        if (error) return { user: null, error: error.message }
        return { user: data as any, error: null }
    } catch (e: any) {
        return { user: null, error: e.message }
    }
}

export const loginWithGithub = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo: `${window.location.origin}/app/dashboard` },
        })
        if (error) return { user: null, error: error.message }
        return { user: data as any, error: null }
    } catch (e: any) {
        return { user: null, error: e.message }
    }
}

export const logout = async () => {
    try {
        const { error } = await supabase.auth.signOut()
        return { error: error?.message ?? null }
    } catch (e: any) {
        return { error: e.message }
    }
}

export const onAuthChange = (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export const getUserData = async (uid: string): Promise<UserData | null> => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', uid)
            .single()

        if (error || !data) return null
        return normaliseUser(data)
    } catch {
        return null
    }
}

export const updateUserProfile = async (
    uid: string,
    updates: {
        firstName?: string
        lastName?: string
        username?: string
        photoURL?: string | null
    }
): Promise<{ success: boolean; error?: string }> => {
    try {
        const patch: Record<string, any> = {}
        if (updates.firstName  !== undefined) patch.first_name   = updates.firstName
        if (updates.lastName   !== undefined) patch.last_name    = updates.lastName
        if (updates.username   !== undefined) patch.username     = updates.username
        if (updates.photoURL   !== undefined) patch.photo_url    = updates.photoURL

        if (updates.firstName !== undefined || updates.lastName !== undefined) {
            const { data: cur } = await supabase
                .from('user_profiles').select('first_name,last_name').eq('id', uid).single()
            const first = updates.firstName ?? cur?.first_name ?? ''
            const last  = updates.lastName  ?? cur?.last_name  ?? ''
            patch.display_name = `${first} ${last}`.trim()
        }

        const { error } = await supabase
            .from('user_profiles')
            .update(patch)
            .eq('id', uid)

        if (error) return { success: false, error: error.message }
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// ─── Portfolios ───────────────────────────────────────────────────────────────

export const getUserPortfolios = async (userId: string): Promise<Portfolio[]> => {
    try {
        const { data, error } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', userId)

        if (error) return []
        return (data ?? []).map(r => ({
            id:        r.id,
            userId:    r.user_id,
            exchange:  r.exchange,
            type:      r.type,
            assets:    r.assets ?? [],
            updatedAt: r.updated_at,
        }))
    } catch {
        return []
    }
}

export const savePortfolio = async (userId: string, portfolio: Portfolio): Promise<string> => {
    const payload = {
        user_id:    userId,
        exchange:   portfolio.exchange,
        type:       portfolio.type,
        assets:     portfolio.assets,
        updated_at: new Date().toISOString(),
    }

    if (portfolio.id) {
        await supabase.from('portfolios').update(payload).eq('id', portfolio.id)
        return portfolio.id
    } else {
        const { data } = await supabase.from('portfolios').insert(payload).select('id').single()
        return data?.id ?? ''
    }
}

// ─── Trades ───────────────────────────────────────────────────────────────────

export const addTrade = async (userId: string, trade: Trade) => {
    await supabase.from('trades').insert({
        user_id:    userId,
        date:       trade.date instanceof Date ? trade.date.toISOString() : trade.date,
        exchange:   trade.exchange,
        pair:       trade.pair,
        type:       trade.type,
        side:       trade.side,
        pnl:        trade.pnl,
        notes:      trade.notes ?? null,
        created_at: new Date().toISOString(),
    })
}

export const getUserTrades = async (userId: string): Promise<Trade[]> => {
    try {
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })

        if (error) return []
        return (data ?? []).map(r => ({
            id:       r.id,
            userId:   r.user_id,
            date:     r.date,
            exchange: r.exchange,
            pair:     r.pair,
            type:     r.type,
            side:     r.side,
            pnl:      r.pnl,
            notes:    r.notes,
            createdAt: r.created_at,
        }))
    } catch {
        return []
    }
}

export const getTradesForDate = async (userId: string, date: Date): Promise<Trade[]> => {
    try {
        const start = new Date(date); start.setHours(0, 0, 0, 0)
        const end   = new Date(date); end.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .gte('date', start.toISOString())
            .lte('date', end.toISOString())
            .order('date', { ascending: false })

        if (error) return []
        return (data ?? []).map(r => ({
            id: r.id, userId: r.user_id, date: r.date,
            exchange: r.exchange, pair: r.pair, type: r.type,
            side: r.side, pnl: r.pnl, notes: r.notes, createdAt: r.created_at,
        }))
    } catch {
        return []
    }
}

export const updateTrade = async (userId: string, tradeId: string, updates: Partial<Trade>) => {
    const patch: Record<string, any> = {}
    if (updates.date     !== undefined) patch.date     = updates.date instanceof Date ? updates.date.toISOString() : updates.date
    if (updates.exchange !== undefined) patch.exchange = updates.exchange
    if (updates.pair     !== undefined) patch.pair     = updates.pair
    if (updates.type     !== undefined) patch.type     = updates.type
    if (updates.side     !== undefined) patch.side     = updates.side
    if (updates.pnl      !== undefined) patch.pnl      = updates.pnl
    if (updates.notes    !== undefined) patch.notes    = updates.notes

    await supabase.from('trades').update(patch).eq('id', tradeId).eq('user_id', userId)
}

export const deleteTrade = async (userId: string, tradeId: string) => {
    await supabase.from('trades').delete().eq('id', tradeId).eq('user_id', userId)
}

export const addTradeAndUpdatePortfolio = async (userId: string, trade: Trade) => {
    await addTrade(userId, trade)
    const portfolios = await getUserPortfolios(userId)
    const portfolio  = portfolios.find(p => p.exchange === trade.exchange)

    if (portfolio) {
        const idx = portfolio.assets.findIndex(a => a.symbol === 'USDT')
        const assets = [...portfolio.assets]
        if (idx >= 0) {
            assets[idx] = { ...assets[idx], amount: assets[idx].amount + trade.pnl }
        } else {
            assets.push({ coinId: 'tether', symbol: 'USDT', name: 'Tether', amount: trade.pnl, avgPrice: 1,
                image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' })
        }
        await savePortfolio(userId, { ...portfolio, assets })
    }
}

export const updateTradeAndPortfolio = async (
    userId: string, tradeId: string, oldTrade: Trade, updates: Partial<Trade>
) => {
    await updateTrade(userId, tradeId, updates)
    if (updates.pnl !== undefined && updates.pnl !== oldTrade.pnl) {
        const diff = updates.pnl - oldTrade.pnl
        const portfolios = await getUserPortfolios(userId)
        const portfolio  = portfolios.find(p => p.exchange === oldTrade.exchange)
        if (portfolio) {
            const idx = portfolio.assets.findIndex(a => a.symbol === 'USDT')
            if (idx >= 0) {
                const assets = [...portfolio.assets]
                assets[idx] = { ...assets[idx], amount: assets[idx].amount + diff }
                await savePortfolio(userId, { ...portfolio, assets })
            }
        }
    }
}

// ─── Backtest Trades ──────────────────────────────────────────────────────────

export const addBacktestTrade = async (
    userId: string,
    trade: Omit<BacktestTrade, 'id' | 'createdAt' | 'created_at'>
): Promise<string> => {
    const { data, error } = await supabase.from('backtest_trades').insert({
        user_id:       userId,
        strategy_name: trade.strategyName,
        pair:          trade.pair,
        timeframe:     trade.timeframe,
        side:          trade.side,
        entry_price:   trade.entryPrice,
        exit_price:    trade.exitPrice,
        stop_loss:     trade.stopLoss ?? null,
        take_profit:   trade.takeProfit ?? null,
        size:          trade.size,
        pnl:           trade.pnl,
        r_multiple:    trade.rMultiple,
        status:        trade.status,
        entry_time:    trade.entryTime instanceof Date ? trade.entryTime.toISOString() : trade.entryTime,
        exit_time:     trade.exitTime  instanceof Date ? trade.exitTime.toISOString()  : trade.exitTime,
        notes:         trade.notes ?? null,
        created_at:    new Date().toISOString(),
    }).select('id').single()

    if (error) { console.error(error); throw new Error(error.message) }
    return data?.id ?? ''
}

export const getBacktestTrades = async (
    userId: string,
    strategyName?: string
): Promise<BacktestTrade[]> => {
    try {
        let q = supabase
            .from('backtest_trades')
            .select('*')
            .eq('user_id', userId)
            .order('entry_time', { ascending: true })

        if (strategyName) q = q.eq('strategy_name', strategyName)

        const { data, error } = await q
        if (error) return []

        return (data ?? []).map(r => ({
            id:           r.id,
            userId:       r.user_id,
            strategyName: r.strategy_name,
            pair:         r.pair,
            timeframe:    r.timeframe,
            side:         r.side,
            entryPrice:   r.entry_price,
            exitPrice:    r.exit_price,
            stopLoss:     r.stop_loss,
            takeProfit:   r.take_profit,
            size:         r.size,
            pnl:          r.pnl,
            rMultiple:    r.r_multiple,
            status:       r.status,
            entryTime:    new Date(r.entry_time),
            exitTime:     new Date(r.exit_time),
            notes:        r.notes,
            createdAt:    r.created_at,
        }))
    } catch {
        return []
    }
}

export const deleteBacktestTrade = async (userId: string, tradeId: string) => {
    await supabase.from('backtest_trades').delete().eq('id', tradeId).eq('user_id', userId)
}

export const updateBacktestTrade = async (
    userId: string, tradeId: string, updates: Partial<BacktestTrade>
) => {
    const patch: Record<string, any> = {}
    if (updates.strategyName !== undefined) patch.strategy_name = updates.strategyName
    if (updates.pair         !== undefined) patch.pair          = updates.pair
    if (updates.timeframe    !== undefined) patch.timeframe     = updates.timeframe
    if (updates.side         !== undefined) patch.side          = updates.side
    if (updates.entryPrice   !== undefined) patch.entry_price   = updates.entryPrice
    if (updates.exitPrice    !== undefined) patch.exit_price    = updates.exitPrice
    if (updates.stopLoss     !== undefined) patch.stop_loss     = updates.stopLoss
    if (updates.takeProfit   !== undefined) patch.take_profit   = updates.takeProfit
    if (updates.size         !== undefined) patch.size          = updates.size
    if (updates.pnl          !== undefined) patch.pnl           = updates.pnl
    if (updates.rMultiple    !== undefined) patch.r_multiple    = updates.rMultiple
    if (updates.status       !== undefined) patch.status        = updates.status
    if (updates.notes        !== undefined) patch.notes         = updates.notes

    await supabase.from('backtest_trades').update(patch).eq('id', tradeId).eq('user_id', userId)
}

// ─── Quiz Results ─────────────────────────────────────────────────────────────

export const saveQuizResult = async (userId: string, postId: string, score: number) => {
    try {
        await supabase.from('quiz_results').insert({
            user_id:    userId,
            post_id:    postId,
            score,
            passed:     score >= 70,
            created_at: new Date().toISOString(),
        })

        if (score >= 70) {
            const { data: profile } = await supabase
                .from('user_profiles').select('mastered_posts').eq('id', userId).single()

            const mastered = profile?.mastered_posts ?? []
            if (!mastered.includes(postId)) {
                await supabase.from('user_profiles')
                    .update({ mastered_posts: [...mastered, postId] })
                    .eq('id', userId)
            }
        }
    } catch (e) {
        console.error('saveQuizResult error:', e)
        throw e
    }
}

export const removeMasteredPost = async (userId: string, postId: string) => {
    try {
        const { data: profile } = await supabase
            .from('user_profiles').select('mastered_posts').eq('id', userId).single()

        const mastered = (profile?.mastered_posts ?? []).filter((id: string) => id !== postId)
        await supabase.from('user_profiles').update({ mastered_posts: mastered }).eq('id', userId)
    } catch (e) {
        console.error('removeMasteredPost error:', e)
        throw e
    }
}
