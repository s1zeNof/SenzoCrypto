/**
 * posts.ts — MIGRATED TO SUPABASE
 */
import { supabase } from '@/lib/supabase'

export interface Post {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    featuredImage?: string
    featured_image?: string
    category: string
    tags: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    status: 'draft' | 'published'
    type: 'article' | 'case' | 'game' | 'project' | 'airdrop'
    sourceUrl?: string
    source_url?: string
    aiGenerated?: boolean
    ai_generated?: boolean
    projectLink?: string
    project_link?: string
    investmentRequired?: boolean
    investment_required?: boolean
    rewardStatus?: 'Confirmed' | 'Speculative' | 'Unknown'
    reward_status?: string
    deadline?: string
    steps?: string[]
    author: { uid: string; name: string; email: string }
    createdAt?: any
    created_at?: string
    updatedAt?: any
    updated_at?: string
    views?: number
}

function normalisePost(r: any): Post {
    return {
        id:                  r.id,
        title:               r.title,
        slug:                r.slug,
        content:             r.content,
        excerpt:             r.excerpt,
        featuredImage:       r.featured_image,
        featured_image:      r.featured_image,
        category:            r.category,
        tags:                r.tags ?? [],
        difficulty:          r.difficulty,
        status:              r.status,
        type:                r.type,
        sourceUrl:           r.source_url,
        source_url:          r.source_url,
        aiGenerated:         r.ai_generated,
        ai_generated:        r.ai_generated,
        projectLink:         r.project_link,
        project_link:        r.project_link,
        investmentRequired:  r.investment_required,
        investment_required: r.investment_required,
        rewardStatus:        r.reward_status,
        reward_status:       r.reward_status,
        deadline:            r.deadline,
        steps:               r.steps ?? [],
        author:              r.author ?? { uid: '', name: '', email: '' },
        createdAt:           r.created_at,
        created_at:          r.created_at,
        updatedAt:           r.updated_at,
        updated_at:          r.updated_at,
        views:               r.views ?? 0,
    }
}

export const getAllPosts = async (): Promise<Post[]> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })

        if (error) { console.error('getAllPosts error:', error); throw error }
        return (data ?? []).map(normalisePost)
    } catch (e) {
        console.error('Error in getAllPosts:', e)
        throw e
    }
}

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
    const { data, error } = await supabase
        .from('posts').select('*').eq('slug', slug).single()
    if (error || !data) return null
    return normalisePost(data)
}

export const getPostById = async (id: string): Promise<Post | null> => {
    const { data, error } = await supabase
        .from('posts').select('*').eq('id', id).single()
    if (error || !data) return null
    return normalisePost(data)
}

export const getPostsByType = async (type: string): Promise<Post[]> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'published')
            .eq('type', type)
            .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(normalisePost)
    } catch (e) {
        console.error('Error in getPostsByType:', e)
        throw e
    }
}
