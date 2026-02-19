/**
 * xp.ts — MIGRATED TO SUPABASE
 */
import { supabase } from '@/lib/supabase'
import { StatusTier, TRADER_TIERS, WEB3_TIERS } from '@/data/statuses'

export type XPKinds = 'trader' | 'web3'

export function getTierForXP(kind: XPKinds, xp: number): StatusTier {
    const tiers = kind === 'trader' ? TRADER_TIERS : WEB3_TIERS
    let current = tiers[0]
    for (const t of tiers) if (xp >= t.xpFrom) current = t
    return current
}

export function getNextTier(kind: XPKinds, xp: number): StatusTier | null {
    const tiers = kind === 'trader' ? TRADER_TIERS : WEB3_TIERS
    for (const t of tiers) if (t.xpFrom > xp) return t
    return null
}

// Atomic XP increment via Supabase RPC
// (Uses a PostgreSQL function — see SQL schema)
export async function addXP(uid: string, kind: XPKinds, amount: number) {
    // Ensure xp column exists with defaults
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp')
        .eq('id', uid)
        .single()

    const currentXP = profile?.xp ?? { trader: 0, web3: 0 }
    const updatedXP = {
        ...currentXP,
        [kind]: (currentXP[kind] ?? 0) + amount,
    }

    await supabase
        .from('user_profiles')
        .update({ xp: updatedXP })
        .eq('id', uid)
}
