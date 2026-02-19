import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Same Firebase config as main project
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
export const storage = getStorage(app)

// Post interface with difficulty level
export interface Post {
    id?: string
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
    investmentRequired?: boolean
    author: {
        uid: string
        name: string
        email: string
    }
    createdAt: Timestamp
    updatedAt: Timestamp
    publishedAt?: Timestamp
    views?: number
}

// CRUD operations for posts
export const postsCollection = collection(db, 'posts')

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(postsCollection, {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
    })
    return docRef.id
}

export const updatePost = async (postId: string, postData: Partial<Post>) => {
    const postRef = doc(db, 'posts', postId)
    await updateDoc(postRef, {
        ...postData,
        updatedAt: serverTimestamp(),
    })
}

export const deletePost = async (postId: string) => {
    const postRef = doc(db, 'posts', postId)
    await deleteDoc(postRef)
}

export const getAllPosts = async (): Promise<Post[]> => {
    const q = query(postsCollection, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post))
}

// Upload image
export const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, `posts/${path}/${file.name}`)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
}
