/**
 * senzo-admin/src/services/firebase.ts — MIGRATED TO SUPABASE
 * Keeps filename for backward-compat with admin page imports.
 */
import { supabase } from '../lib/supabase'

export { supabase as auth, supabase as db, supabase as storage }

export interface Post {
    id?: string
    title: string
    slug: string
    content: string
    excerpt: string
    featured_image?: string
    featuredImage?: string
    category: string
    tags: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    status: 'draft' | 'published'
    type: 'article' | 'case' | 'game' | 'project' | 'airdrop'
    source_url?: string
    sourceUrl?: string
    ai_generated?: boolean
    aiGenerated?: boolean
    project_link?: string
    projectLink?: string
    investment_required?: boolean
    investmentRequired?: boolean
    author: { uid: string; name: string; email: string }
    created_at?: string
    createdAt?: any
    updated_at?: string
    updatedAt?: any
    published_at?: string
    publishedAt?: any
    views?: number
}

function normPost(r: any): Post {
    return {
        id:                 r.id,
        title:              r.title,
        slug:               r.slug,
        content:            r.content,
        excerpt:            r.excerpt,
        featured_image:     r.featured_image,
        featuredImage:      r.featured_image,
        category:           r.category,
        tags:               r.tags ?? [],
        difficulty:         r.difficulty,
        status:             r.status,
        type:               r.type,
        source_url:         r.source_url,
        sourceUrl:          r.source_url,
        ai_generated:       r.ai_generated,
        aiGenerated:        r.ai_generated,
        project_link:       r.project_link,
        projectLink:        r.project_link,
        investment_required: r.investment_required,
        investmentRequired:  r.investment_required,
        author:             r.author ?? { uid: '', name: '', email: '' },
        created_at:         r.created_at,
        createdAt:          r.created_at,
        updated_at:         r.updated_at,
        updatedAt:          r.updated_at,
        published_at:       r.published_at,
        publishedAt:        r.published_at,
        views:              r.views ?? 0,
    }
}

export const createPost = async (
    postData: Omit<Post, 'id' | 'created_at' | 'createdAt' | 'updated_at' | 'updatedAt'>
): Promise<string> => {
    const { data, error } = await supabase
        .from('posts')
        .insert({
            title:               postData.title,
            slug:                postData.slug,
            content:             postData.content,
            excerpt:             postData.excerpt,
            featured_image:      postData.featured_image ?? postData.featuredImage ?? null,
            category:            postData.category,
            tags:                postData.tags,
            difficulty:          postData.difficulty,
            status:              postData.status,
            type:                postData.type,
            source_url:          postData.source_url ?? postData.sourceUrl ?? null,
            ai_generated:        postData.ai_generated ?? postData.aiGenerated ?? false,
            project_link:        postData.project_link ?? postData.projectLink ?? null,
            investment_required: postData.investment_required ?? postData.investmentRequired ?? false,
            author:              postData.author,
            views:               0,
            created_at:          new Date().toISOString(),
            updated_at:          new Date().toISOString(),
        })
        .select('id')
        .single()

    if (error) throw new Error(error.message)
    return data?.id ?? ''
}

export const updatePost = async (postId: string, postData: Partial<Post>): Promise<void> => {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (postData.title             !== undefined) patch.title              = postData.title
    if (postData.slug              !== undefined) patch.slug               = postData.slug
    if (postData.content           !== undefined) patch.content            = postData.content
    if (postData.excerpt           !== undefined) patch.excerpt            = postData.excerpt
    if (postData.featured_image    !== undefined) patch.featured_image     = postData.featured_image
    if (postData.featuredImage     !== undefined) patch.featured_image     = postData.featuredImage
    if (postData.category          !== undefined) patch.category           = postData.category
    if (postData.tags              !== undefined) patch.tags               = postData.tags
    if (postData.difficulty        !== undefined) patch.difficulty         = postData.difficulty
    if (postData.status            !== undefined) patch.status             = postData.status
    if (postData.type              !== undefined) patch.type               = postData.type
    if (postData.source_url        !== undefined) patch.source_url         = postData.source_url
    if (postData.sourceUrl         !== undefined) patch.source_url         = postData.sourceUrl
    if (postData.ai_generated      !== undefined) patch.ai_generated       = postData.ai_generated
    if (postData.aiGenerated       !== undefined) patch.ai_generated       = postData.aiGenerated
    if (postData.project_link      !== undefined) patch.project_link       = postData.project_link
    if (postData.projectLink       !== undefined) patch.project_link       = postData.projectLink
    if (postData.investment_required !== undefined) patch.investment_required = postData.investment_required
    if (postData.author            !== undefined) patch.author             = postData.author

    const { error } = await supabase.from('posts').update(patch).eq('id', postId)
    if (error) throw new Error(error.message)
}

export const deletePost = async (postId: string): Promise<void> => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) throw new Error(error.message)
}

export const getAllPosts = async (): Promise<Post[]> => {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map(normPost)
}

// Upload image to Supabase Storage bucket "posts"
export const uploadImage = async (file: File, path: string): Promise<string> => {
    const storagePath = `posts/${path}/${file.name}`
    const { error } = await supabase.storage
        .from('posts')
        .upload(storagePath, file, { upsert: true })

    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('posts').getPublicUrl(storagePath)
    return data.publicUrl
}
