/**
 * AuthContext.tsx — MIGRATED TO SUPABASE
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
    onAuthChange,
    getUserData,
    updateUserProfile as firebaseUpdateProfile,
    UserData,
} from '@/services/firebase'

interface AuthContextType {
    user: User | null
    userData: UserData | null
    loading: boolean
    toggleSavePost: (postId: string) => Promise<void>
    updatePrivacySettings: (settings: Partial<UserData['privacy']>) => Promise<void>
    updateProfile: (updates: {
        firstName?: string
        lastName?: string
        username?: string
        photoURL?: string | null
    }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    toggleSavePost: async () => { },
    updatePrivacySettings: async () => { },
    updateProfile: async () => ({ success: false }),
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser]         = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading]   = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthChange(async (supabaseUser) => {
            setUser(supabaseUser)

            if (supabaseUser) {
                const data = await getUserData(supabaseUser.id)
                setUserData(data)
            } else {
                setUserData(null)
            }

            setLoading(false)
        })

        return unsubscribe
    }, [])

    const toggleSavePost = async (postId: string) => {
        if (!user || !userData) return

        const currentSaved = userData.savedPosts ?? userData.saved_posts ?? []
        const isSaved      = currentSaved.includes(postId)
        const newSaved     = isSaved
            ? currentSaved.filter(id => id !== postId)
            : [...currentSaved, postId]

        // Optimistic update
        setUserData({ ...userData, savedPosts: newSaved, saved_posts: newSaved })

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ saved_posts: newSaved })
                .eq('id', user.id)

            if (error) {
                console.error('toggleSavePost error:', error)
                setUserData(userData)
            }
        } catch (e) {
            console.error('toggleSavePost error:', e)
            setUserData(userData)
        }
    }

    const updatePrivacySettings = async (settings: Partial<UserData['privacy']>) => {
        if (!user || !userData) return

        const currentPrivacy = userData.privacy ?? {
            showPnL: true, showPortfolio: true, showSavedPosts: true, isPublic: true,
        }
        const newPrivacy = { ...currentPrivacy, ...settings }

        setUserData({ ...userData, privacy: newPrivacy })

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ privacy: newPrivacy })
                .eq('id', user.id)

            if (error) {
                console.error('updatePrivacySettings error:', error)
                setUserData(userData)
            }
        } catch (e) {
            console.error('updatePrivacySettings error:', e)
            setUserData(userData)
        }
    }

    const updateProfile = async (updates: {
        firstName?: string
        lastName?: string
        username?: string
        photoURL?: string | null
    }): Promise<{ success: boolean; error?: string }> => {
        if (!user || !userData) return { success: false, error: 'Не авторизований' }

        const result = await firebaseUpdateProfile(user.id, updates)

        if (result.success) {
            const first = updates.firstName ?? userData.firstName ?? userData.first_name ?? ''
            const last  = updates.lastName  ?? userData.lastName  ?? userData.last_name  ?? ''
            const displayName = (updates.firstName !== undefined || updates.lastName !== undefined)
                ? `${first} ${last}`.trim()
                : (userData.displayName ?? userData.display_name)

            setUserData({
                ...userData,
                ...updates,
                displayName,
                display_name: displayName ?? null,
                firstName:  updates.firstName ?? userData.firstName,
                first_name: updates.firstName ?? userData.first_name,
                lastName:   updates.lastName  ?? userData.lastName,
                last_name:  updates.lastName  ?? userData.last_name,
                photoURL:   updates.photoURL  !== undefined ? updates.photoURL  : userData.photoURL,
                photo_url:  updates.photoURL  !== undefined ? updates.photoURL  : userData.photo_url,
                username:   updates.username  ?? userData.username,
            })
        }

        return result
    }

    return (
        <AuthContext.Provider value={{
            user, userData, loading,
            toggleSavePost, updatePrivacySettings, updateProfile,
        }}>
            {children}
        </AuthContext.Provider>
    )
}
