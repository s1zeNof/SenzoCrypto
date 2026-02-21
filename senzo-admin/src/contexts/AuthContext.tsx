/**
 * MIGRATED TO SUPABASE — replaces Firebase onAuthStateChanged
 * Also checks user_profiles.role = 'admin' before granting access
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

async function checkAdmin(userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()
    return data?.role === 'admin'
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser]       = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const u = session?.user ?? null
            setUser(u)
            setIsAdmin(u ? await checkAdmin(u.id) : false)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null
            setUser(u)
            setIsAdmin(u ? await checkAdmin(u.id) : false)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
