import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { onAuthChange, getUserData, updateUserProfile as firebaseUpdateProfile, UserData, db } from '@/services/firebase'

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
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                const data = await getUserData(firebaseUser.uid)
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

        const currentSaved = userData.savedPosts || []
        const isSaved = currentSaved.includes(postId)
        const newSaved = isSaved
            ? currentSaved.filter(id => id !== postId)
            : [...currentSaved, postId]

        setUserData({ ...userData, savedPosts: newSaved })

        try {
            await updateDoc(doc(db, 'users', user.uid), { savedPosts: newSaved })
        } catch (error) {
            console.error('Error toggling saved post:', error)
            setUserData(userData)
        }
    }

    const updatePrivacySettings = async (settings: Partial<UserData['privacy']>) => {
        if (!user || !userData) return

        const currentPrivacy = userData.privacy || {
            showPnL: true, showPortfolio: true, showSavedPosts: true, isPublic: true
        }
        const newPrivacy = { ...currentPrivacy, ...settings }

        setUserData({ ...userData, privacy: newPrivacy })

        try {
            await updateDoc(doc(db, 'users', user.uid), { privacy: newPrivacy })
        } catch (error) {
            console.error('Error updating privacy settings:', error)
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

        const result = await firebaseUpdateProfile(user.uid, updates)

        if (result.success) {
            // Build updated displayName
            const first = updates.firstName ?? userData.firstName ?? ''
            const last = updates.lastName ?? userData.lastName ?? ''
            const displayName = (updates.firstName !== undefined || updates.lastName !== undefined)
                ? `${first} ${last}`.trim()
                : userData.displayName

            // Optimistic update in context
            setUserData({
                ...userData,
                ...updates,
                displayName,
            })
        }

        return result
    }

    return (
        <AuthContext.Provider value={{
            user, userData, loading,
            toggleSavePost, updatePrivacySettings, updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    )
}
