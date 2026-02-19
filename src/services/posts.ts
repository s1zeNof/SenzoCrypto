import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    Timestamp
} from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export interface Post {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    featuredImage?: string
    category: string
    tags: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    status: 'draft' | 'published'
    type: 'article' | 'case' | 'game' | 'project' | 'airdrop'
    sourceUrl?: string
    aiGenerated?: boolean
    projectLink?: string
    projectLink?: string
    investmentRequired?: boolean
    rewardStatus?: 'Confirmed' | 'Speculative' | 'Unknown'
    deadline?: string
    steps?: string[]
    author: {
        uid: string
        name: string
        email: string
    }
    createdAt: Timestamp
    updatedAt: Timestamp
    views: number
}

// Get all published posts (without orderBy to avoid index requirement)
export const getAllPosts = async (): Promise<Post[]> => {
    try {
        const postsRef = collection(db, 'posts')
        const q = query(
            postsRef,
            where('status', '==', 'published')
        )
        console.log('Querying posts...')
        const snapshot = await getDocs(q)
        console.log('Query result:', snapshot.size, 'documents')
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))
        console.log('Parsed posts:', posts)

        // Sort manually after fetching
        posts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)

        return posts
    } catch (error) {
        console.error('Error in getAllPosts:', error)
        throw error
    }
}

// Get single post by slug
export const getPostBySlug = async (slug: string): Promise<Post | null> => {
    const postsRef = collection(db, 'posts')
    const q = query(postsRef, where('slug', '==', slug))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const postDoc = snapshot.docs[0]
    return { id: postDoc.id, ...postDoc.data() } as Post
}

// Get post by ID
export const getPostById = async (id: string): Promise<Post | null> => {
    const postRef = doc(db, 'posts', id)
    const postSnap = await getDoc(postRef)

    if (!postSnap.exists()) return null

    return { id: postSnap.id, ...postSnap.data() } as Post
}

// Get posts by type
export const getPostsByType = async (type: string): Promise<Post[]> => {
    try {
        const postsRef = collection(db, 'posts')
        const q = query(
            postsRef,
            where('status', '==', 'published'),
            where('type', '==', type)
        )
        const snapshot = await getDocs(q)
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))

        // Sort manually
        posts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)

        return posts
    } catch (error) {
        console.error('Error in getPostsByType:', error)
        throw error
    }
}
