import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

export interface EmojiPack {
    id?: string
    name: string
    description?: string
    emojis: Emoji[]
    isActive: boolean
    createdAt?: any
    updatedAt?: any
}

export interface Emoji {
    id: string
    name: string
    url: string  // URL to PNG/WebP image
    keywords: string[]  // For search
}

export interface StickerPack {
    id?: string
    name: string
    description?: string
    stickers: Sticker[]
    isActive: boolean
    createdAt?: any
    updatedAt?: any
}

export interface Sticker {
    id: string
    name: string
    lottieData: string  // Lottie JSON stored as string (to avoid Firestore nested array issues)
    thumbnailUrl?: string  // Optional preview image
    keywords: string[]
}

const EMOJI_PACKS_COLLECTION = 'emoji_packs'
const STICKER_PACKS_COLLECTION = 'sticker_packs'

export const EmojiStickerService = {
    // ==================== EMOJI PACKS ====================

    // Get all active emoji packs
    getActiveEmojiPacks: async (): Promise<EmojiPack[]> => {
        const q = query(
            collection(db, EMOJI_PACKS_COLLECTION),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as EmojiPack))
            .filter(pack => pack.isActive)
    },

    // Get all emoji packs (admin)
    getAllEmojiPacks: async (): Promise<EmojiPack[]> => {
        const q = query(
            collection(db, EMOJI_PACKS_COLLECTION),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmojiPack))
    },

    // Create emoji pack
    createEmojiPack: async (pack: Omit<EmojiPack, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const docRef = await addDoc(collection(db, EMOJI_PACKS_COLLECTION), {
            ...pack,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })
        return docRef.id
    },

    // Update emoji pack
    updateEmojiPack: async (packId: string, data: Partial<EmojiPack>): Promise<void> => {
        const docRef = doc(db, EMOJI_PACKS_COLLECTION, packId)
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        })
    },

    // Delete emoji pack
    deleteEmojiPack: async (packId: string): Promise<void> => {
        const docRef = doc(db, EMOJI_PACKS_COLLECTION, packId)
        await deleteDoc(docRef)
    },

    // Upload emoji image
    uploadEmojiImage: async (file: File, emojiId: string): Promise<string> => {
        const storageRef = ref(storage, `emojis/${emojiId}/${file.name}`)
        await uploadBytes(storageRef, file)
        return await getDownloadURL(storageRef)
    },

    // ==================== STICKER PACKS ====================

    // Get all active sticker packs
    getActiveStickerPacks: async (): Promise<StickerPack[]> => {
        const q = query(
            collection(db, STICKER_PACKS_COLLECTION),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as StickerPack))
            .filter(pack => pack.isActive)
    },

    // Get all sticker packs (admin)
    getAllStickerPacks: async (): Promise<StickerPack[]> => {
        const q = query(
            collection(db, STICKER_PACKS_COLLECTION),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StickerPack))
    },

    // Create sticker pack
    createStickerPack: async (pack: Omit<StickerPack, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const docRef = await addDoc(collection(db, STICKER_PACKS_COLLECTION), {
            ...pack,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })
        return docRef.id
    },

    // Update sticker pack
    updateStickerPack: async (packId: string, data: Partial<StickerPack>): Promise<void> => {
        const docRef = doc(db, STICKER_PACKS_COLLECTION, packId)
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        })
    },

    // Delete sticker pack
    deleteStickerPack: async (packId: string): Promise<void> => {
        const docRef = doc(db, STICKER_PACKS_COLLECTION, packId)
        await deleteDoc(docRef)
    },

    // Upload sticker (Lottie JSON)
    uploadStickerLottie: async (file: File, stickerId: string): Promise<string> => {
        const storageRef = ref(storage, `stickers/${stickerId}/animation.json`)
        await uploadBytes(storageRef, file)
        return await getDownloadURL(storageRef)
    },

    // Upload sticker thumbnail
    uploadStickerThumbnail: async (file: File, stickerId: string): Promise<string> => {
        const storageRef = ref(storage, `stickers/${stickerId}/thumbnail.png`)
        await uploadBytes(storageRef, file)
        return await getDownloadURL(storageRef)
    }
}
