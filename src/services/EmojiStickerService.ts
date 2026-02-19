/**
 * EmojiStickerService.ts — MIGRATED TO SUPABASE
 * Storage: Supabase Storage buckets "emojis" and "stickers"
 */
import { supabase } from '@/lib/supabase'

export interface EmojiPack {
    id?: string
    name: string
    description?: string
    emojis: Emoji[]
    isActive: boolean
    is_active?: boolean
    createdAt?: any
    created_at?: string
    updatedAt?: any
    updated_at?: string
}

export interface Emoji {
    id: string
    name: string
    url: string
    keywords: string[]
}

export interface StickerPack {
    id?: string
    name: string
    description?: string
    stickers: Sticker[]
    isActive: boolean
    is_active?: boolean
    createdAt?: any
    created_at?: string
    updatedAt?: any
    updated_at?: string
}

export interface Sticker {
    id: string
    name: string
    lottieData: string
    thumbnailUrl?: string
    keywords: string[]
}

function normEmoji(r: any): EmojiPack {
    return { id: r.id, name: r.name, description: r.description, emojis: r.emojis ?? [],
        isActive: r.is_active, is_active: r.is_active,
        createdAt: r.created_at, created_at: r.created_at,
        updatedAt: r.updated_at, updated_at: r.updated_at }
}

function normSticker(r: any): StickerPack {
    return { id: r.id, name: r.name, description: r.description, stickers: r.stickers ?? [],
        isActive: r.is_active, is_active: r.is_active,
        createdAt: r.created_at, created_at: r.created_at,
        updatedAt: r.updated_at, updated_at: r.updated_at }
}

export const EmojiStickerService = {
    // ── Emoji Packs ───────────────────────────────────────────────────────────

    getActiveEmojiPacks: async (): Promise<EmojiPack[]> => {
        const { data } = await supabase
            .from('emoji_packs').select('*').eq('is_active', true)
            .order('created_at', { ascending: false })
        return (data ?? []).map(normEmoji)
    },

    getAllEmojiPacks: async (): Promise<EmojiPack[]> => {
        const { data } = await supabase
            .from('emoji_packs').select('*').order('created_at', { ascending: false })
        return (data ?? []).map(normEmoji)
    },

    createEmojiPack: async (pack: Omit<EmojiPack, 'id' | 'createdAt' | 'updatedAt' | 'created_at' | 'updated_at'>): Promise<string> => {
        const { data, error } = await supabase
            .from('emoji_packs')
            .insert({ name: pack.name, description: pack.description ?? null,
                emojis: pack.emojis, is_active: pack.isActive ?? pack.is_active ?? true,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .select('id').single()
        if (error) throw new Error(error.message)
        return data?.id ?? ''
    },

    updateEmojiPack: async (packId: string, data: Partial<EmojiPack>): Promise<void> => {
        const patch: Record<string, any> = { updated_at: new Date().toISOString() }
        if (data.name        !== undefined) patch.name      = data.name
        if (data.description !== undefined) patch.description = data.description
        if (data.emojis      !== undefined) patch.emojis    = data.emojis
        if (data.isActive    !== undefined) patch.is_active = data.isActive
        await supabase.from('emoji_packs').update(patch).eq('id', packId)
    },

    deleteEmojiPack: async (packId: string): Promise<void> => {
        await supabase.from('emoji_packs').delete().eq('id', packId)
    },

    uploadEmojiImage: async (file: File, emojiId: string): Promise<string> => {
        const path = `emojis/${emojiId}/${file.name}`
        const { error } = await supabase.storage.from('emojis').upload(path, file, { upsert: true })
        if (error) throw new Error(error.message)
        const { data } = supabase.storage.from('emojis').getPublicUrl(path)
        return data.publicUrl
    },

    // ── Sticker Packs ─────────────────────────────────────────────────────────

    getActiveStickerPacks: async (): Promise<StickerPack[]> => {
        const { data } = await supabase
            .from('sticker_packs').select('*').eq('is_active', true)
            .order('created_at', { ascending: false })
        return (data ?? []).map(normSticker)
    },

    getAllStickerPacks: async (): Promise<StickerPack[]> => {
        const { data } = await supabase
            .from('sticker_packs').select('*').order('created_at', { ascending: false })
        return (data ?? []).map(normSticker)
    },

    createStickerPack: async (pack: Omit<StickerPack, 'id' | 'createdAt' | 'updatedAt' | 'created_at' | 'updated_at'>): Promise<string> => {
        const { data, error } = await supabase
            .from('sticker_packs')
            .insert({ name: pack.name, description: pack.description ?? null,
                stickers: pack.stickers, is_active: pack.isActive ?? pack.is_active ?? true,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .select('id').single()
        if (error) throw new Error(error.message)
        return data?.id ?? ''
    },

    updateStickerPack: async (packId: string, data: Partial<StickerPack>): Promise<void> => {
        const patch: Record<string, any> = { updated_at: new Date().toISOString() }
        if (data.name        !== undefined) patch.name      = data.name
        if (data.description !== undefined) patch.description = data.description
        if (data.stickers    !== undefined) patch.stickers  = data.stickers
        if (data.isActive    !== undefined) patch.is_active = data.isActive
        await supabase.from('sticker_packs').update(patch).eq('id', packId)
    },

    deleteStickerPack: async (packId: string): Promise<void> => {
        await supabase.from('sticker_packs').delete().eq('id', packId)
    },

    uploadStickerLottie: async (file: File, stickerId: string): Promise<string> => {
        const path = `stickers/${stickerId}/animation.json`
        const { error } = await supabase.storage.from('stickers').upload(path, file, { upsert: true })
        if (error) throw new Error(error.message)
        const { data } = supabase.storage.from('stickers').getPublicUrl(path)
        return data.publicUrl
    },

    uploadStickerThumbnail: async (file: File, stickerId: string): Promise<string> => {
        const path = `stickers/${stickerId}/thumbnail.png`
        const { error } = await supabase.storage.from('stickers').upload(path, file, { upsert: true })
        if (error) throw new Error(error.message)
        const { data } = supabase.storage.from('stickers').getPublicUrl(path)
        return data.publicUrl
    },
}
