// Firebase configuration and initialization
import { initializeApp } from 'firebase/app'
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    type User
} from 'firebase/auth'
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    getDocs,
    addDoc,
    orderBy,
    where,
    deleteDoc,
    updateDoc
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase configuration
// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Auth Providers
const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

// User data interface
export interface UserData {
    uid: string
    email: string | null
    displayName: string | null
    username?: string
    firstName?: string
    lastName?: string
    photoURL?: string | null
    createdAt: any
    savedPosts?: string[]
    masteredPosts?: string[]
    pnl?: {
        daily: number
        total: number
        history: { date: string; value: number }[]
    }
    portfolio?: {
        totalValue: number
        assets: { symbol: string; amount: number; value: number }[]
    }
    privacy?: {
        showPnL: boolean
        showPortfolio: boolean
        showSavedPosts: boolean
        isPublic: boolean
    }
    referralCode?: string
    invitedCount?: number
    tickerCoins?: string[] // Array of coin IDs
}

// Register with email and password
export const registerWithEmail = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
) => {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update profile with display name
        const displayName = `${firstName} ${lastName}`
        await updateProfile(user, { displayName })

        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName,
            firstName,
            lastName,
            username,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
        })

        return { user, error: null }
    } catch (error: any) {
        console.error('Registration error:', error)
        return { user: null, error: error.message }
    }
}

// Login with email and password
export const loginWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return { user: userCredential.user, error: null }
    } catch (error: any) {
        console.error('Login error:', error)
        return { user: null, error: error.message }
    }
}

// Login with Google
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        const user = result.user

        // Check if user document exists, if not create one
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
            })
        }

        return { user, error: null }
    } catch (error: any) {
        console.error('Google login error:', error)
        return { user: null, error: error.message }
    }
}

// Login with GitHub
export const loginWithGithub = async () => {
    try {
        const result = await signInWithPopup(auth, githubProvider)
        const user = result.user

        // Check if user document exists, if not create one
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
            })
        }

        return { user, error: null }
    } catch (error: any) {
        console.error('GitHub login error:', error)
        return { user: null, error: error.message }
    }
}

// Logout
export const logout = async () => {
    try {
        await signOut(auth)
        return { error: null }
    } catch (error: any) {
        console.error('Logout error:', error)
        return { error: error.message }
    }
}

// Get current user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
            return userDoc.data() as UserData
        }
        return null
    } catch (error) {
        console.error('Get user data error:', error)
        return null
    }
}

// Update user profile (displayName, firstName, lastName, username, photoURL)
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
        const userRef = doc(db, 'users', uid)

        const firestoreUpdates: Record<string, any> = {}
        if (updates.firstName !== undefined) firestoreUpdates.firstName = updates.firstName
        if (updates.lastName !== undefined) firestoreUpdates.lastName = updates.lastName
        if (updates.username !== undefined) firestoreUpdates.username = updates.username
        if (updates.photoURL !== undefined) firestoreUpdates.photoURL = updates.photoURL

        // Build displayName if names changed
        if (updates.firstName !== undefined || updates.lastName !== undefined) {
            // We need current data to fill in missing parts
            const snap = await getDoc(userRef)
            const cur = snap.data() as UserData | undefined
            const first = updates.firstName ?? cur?.firstName ?? ''
            const last = updates.lastName ?? cur?.lastName ?? ''
            firestoreUpdates.displayName = `${first} ${last}`.trim()
        }

        await updateDoc(userRef, firestoreUpdates)

        // Also update Firebase Auth profile display name
        // Note: photoURL is NOT sent to Firebase Auth because it stores base64 data
        // which exceeds Firebase Auth's URL length limit. It's stored in Firestore only.
        const currentUser = auth.currentUser
        if (currentUser && firestoreUpdates.displayName) {
            await updateProfile(currentUser, { displayName: firestoreUpdates.displayName })
        }

        return { success: true }
    } catch (error: any) {
        console.error('Update profile error:', error)
        return { success: false, error: error.message || 'Помилка оновлення' }
    }
}

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
}

// Portfolio & Trade Types
export interface PortfolioAsset {
    coinId: string;
    symbol: string;
    name: string;
    amount: number;
    avgPrice: number;
    currentPrice?: number; // Fetched from API, not stored
    image?: string;
}

export interface Portfolio {
    id?: string;
    userId: string;
    exchange: string; // e.g., 'Bybit', 'Binance'
    type: 'spot' | 'futures';
    assets: PortfolioAsset[];
    updatedAt: any;
}

export interface Trade {
    id?: string;
    userId: string;
    date: any; // Timestamp
    exchange: string;
    pair: string;
    type: 'spot' | 'futures';
    side: 'long' | 'short';
    pnl: number; // In USDT
    notes?: string;
    createdAt: any;
}

// Portfolio Functions
export const getUserPortfolios = async (userId: string): Promise<Portfolio[]> => {
    try {
        const q = query(collection(db, 'users', userId, 'portfolios'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Portfolio));
    } catch (error) {
        console.error('Error getting portfolios:', error);
        return [];
    }
};

export const savePortfolio = async (userId: string, portfolio: Portfolio) => {
    try {
        const portfolioRef = portfolio.id
            ? doc(db, 'users', userId, 'portfolios', portfolio.id)
            : doc(collection(db, 'users', userId, 'portfolios'));

        const { id, ...data } = portfolio;
        await setDoc(portfolioRef, {
            ...data,
            updatedAt: new Date()
        }, { merge: true });

        return portfolioRef.id;
    } catch (error) {
        console.error('Error saving portfolio:', error);
        throw error;
    }
};

// Trade Functions
export const addTrade = async (userId: string, trade: Trade) => {
    try {
        const tradesRef = collection(db, 'users', userId, 'trades');
        await addDoc(tradesRef, {
            ...trade,
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error adding trade:', error);
        throw error;
    }
};

export const addTradeAndUpdatePortfolio = async (userId: string, trade: Trade) => {
    try {
        // 1. Add the trade record
        await addTrade(userId, trade);

        // 2. Find the portfolio for this exchange
        const portfolios = await getUserPortfolios(userId);
        const portfolio = portfolios.find(p => p.exchange === trade.exchange);

        if (portfolio) {
            // 3. Update USDT balance
            const usdtAssetIndex = portfolio.assets.findIndex(a => a.symbol === 'USDT');
            let updatedAssets = [...portfolio.assets];

            if (usdtAssetIndex >= 0) {
                // Update existing USDT
                updatedAssets[usdtAssetIndex] = {
                    ...updatedAssets[usdtAssetIndex],
                    amount: updatedAssets[usdtAssetIndex].amount + trade.pnl
                };
            } else {
                // Create new USDT asset if not exists
                updatedAssets.push({
                    coinId: 'tether',
                    symbol: 'USDT',
                    name: 'Tether',
                    amount: trade.pnl,
                    avgPrice: 1,
                    image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png'
                });
            }

            // 4. Save portfolio
            await savePortfolio(userId, {
                ...portfolio,
                assets: updatedAssets
            });
        }
    } catch (error) {
        console.error('Error adding trade and updating portfolio:', error);
        throw error;
    }
};

export const getUserTrades = async (userId: string): Promise<Trade[]> => {
    try {
        const q = query(collection(db, 'users', userId, 'trades'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
    } catch (error) {
        console.error('Error getting trades:', error);
        return [];
    }
};

export const deleteTrade = async (userId: string, tradeId: string) => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'trades', tradeId));
    } catch (error) {
        console.error('Error deleting trade:', error);
        throw error;
    }
};

export const getTradesForDate = async (userId: string, date: Date): Promise<Trade[]> => {
    try {
        // Start of day
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        // End of day
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, 'users', userId, 'trades'),
            where('date', '>=', start),
            where('date', '<=', end),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
    } catch (error) {
        console.error('Error getting trades for date:', error);
        return [];
    }
};

export const updateTradeAndPortfolio = async (userId: string, tradeId: string, oldTrade: Trade, updates: Partial<Trade>) => {
    try {
        // 1. Update the trade record
        const tradeRef = doc(db, 'users', userId, 'trades', tradeId);
        await updateDoc(tradeRef, {
            ...updates,
            // If date is being updated, ensure it's a Timestamp or Date
        });

        // 2. If PnL changed, update portfolio balance
        if (updates.pnl !== undefined && updates.pnl !== oldTrade.pnl) {
            const pnlDiff = updates.pnl - oldTrade.pnl;

            const portfolios = await getUserPortfolios(userId);
            const portfolio = portfolios.find(p => p.exchange === oldTrade.exchange);

            if (portfolio) {
                const usdtAssetIndex = portfolio.assets.findIndex(a => a.symbol === 'USDT');
                let updatedAssets = [...portfolio.assets];

                if (usdtAssetIndex >= 0) {
                    updatedAssets[usdtAssetIndex] = {
                        ...updatedAssets[usdtAssetIndex],
                        amount: updatedAssets[usdtAssetIndex].amount + pnlDiff
                    };

                    await savePortfolio(userId, {
                        ...portfolio,
                        assets: updatedAssets
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error updating trade and portfolio:', error);
        throw error;
    }
};

export const updateTrade = async (userId: string, tradeId: string, updates: Partial<Trade>) => {
    try {
        const tradeRef = doc(db, 'users', userId, 'trades', tradeId);
        await updateDoc(tradeRef, {
            ...updates,
            // If date is being updated, ensure it's a Timestamp or Date
        });
    } catch (error) {
        console.error('Error updating trade:', error);
        throw error;
    }
};

export const saveQuizResult = async (userId: string, postId: string, score: number) => {
    try {
        // 1. Save quiz result
        const resultRef = collection(db, 'users', userId, 'quizResults');
        await addDoc(resultRef, {
            postId,
            score,
            passed: score >= 70, // 70% passing score
            createdAt: new Date()
        });

        // 2. If passed, add to masteredPosts
        if (score >= 70) {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data() as UserData;
                const masteredPosts = userData.masteredPosts || [];
                if (!masteredPosts.includes(postId)) {
                    await updateDoc(userRef, {
                        masteredPosts: [...masteredPosts, postId]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error saving quiz result:', error);
        throw error;
    }
};

// Remove postId from mastered posts
export const removeMasteredPost = async (userId: string, postId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            const masteredPosts = userData.masteredPosts || [];
            await updateDoc(userRef, {
                masteredPosts: masteredPosts.filter(id => id !== postId)
            });
        }
    } catch (error) {
        console.error('Error removing mastered post:', error);
        throw error;
    }
};
