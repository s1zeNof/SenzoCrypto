/**
 * MIGRATED TO SUPABASE — replaces Firebase onAuthStateChanged
 * Checks admin role via user_profiles table with fallback to user_metadata
 */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
    user: User | null
    isAdmin: boolean
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true })

export const useAuth = () => useContext(AuthContext)

async function checkAdmin(user: User): Promise<boolean> {
    // First check user_metadata (fast, no DB query)
    if (user.user_metadata?.role === 'admin') return true
    if (user.app_metadata?.role === 'admin') return true

    // Then check user_profiles table
    try {
        const { data } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
        return data?.role === 'admin'
    } catch {
        return false
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser]       = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (cancelled) return
            const u = session?.user ?? null
            const admin = u ? await checkAdmin(u) : false
            if (cancelled) return
            setUser(u)
            setIsAdmin(admin)
            setLoading(false)
        }

        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (cancelled) return
            const u = session?.user ?? null
            const admin = u ? await checkAdmin(u) : false
            if (cancelled) return
            setUser(u)
            setIsAdmin(admin)
            setLoading(false)
        })

        return () => {
            cancelled = true
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
