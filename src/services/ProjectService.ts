/**
 * ProjectService.ts — MIGRATED TO SUPABASE
 */
import { supabase } from '@/lib/supabase'

export interface Project {
    id?: string
    userId: string
    user_id?: string
    title: string
    description: string
    startAmount: number
    start_amount?: number
    targetAmount: number
    target_amount?: number
    currentAmount: number
    current_amount?: number
    currency: string
    status: 'active' | 'completed' | 'paused'
    tags: string[]
    milestones?: Milestone[]
    coverImage?: string
    cover_image?: string
    featuredImage?: string
    featured_image?: string
    icon?: string
    iconColor?: string
    icon_color?: string
    displayMode?: 'icon' | 'featured' | 'both'
    display_mode?: string
    createdAt?: any
    created_at?: string
    updatedAt?: any
    updated_at?: string
}

export interface ProjectEntry {
    id?: string
    projectId: string
    project_id?: string
    content: string
    type: 'note' | 'trade' | 'update'
    date: any
    tags?: string[]
    images?: string[]
}

export interface Milestone {
    id: string
    amount: number
    label: string
    achieved: boolean
    achievedAt?: any
}

function normProject(r: any): Project {
    return {
        id:            r.id,
        userId:        r.user_id,
        user_id:       r.user_id,
        title:         r.title,
        description:   r.description,
        startAmount:   r.start_amount,
        start_amount:  r.start_amount,
        targetAmount:  r.target_amount,
        target_amount: r.target_amount,
        currentAmount: r.current_amount,
        current_amount: r.current_amount,
        currency:      r.currency,
        status:        r.status,
        tags:          r.tags ?? [],
        milestones:    r.milestones ?? [],
        coverImage:    r.cover_image,
        cover_image:   r.cover_image,
        featuredImage: r.featured_image,
        featured_image: r.featured_image,
        icon:          r.icon,
        iconColor:     r.icon_color,
        icon_color:    r.icon_color,
        displayMode:   r.display_mode,
        display_mode:  r.display_mode,
        createdAt:     r.created_at,
        created_at:    r.created_at,
        updatedAt:     r.updated_at,
        updated_at:    r.updated_at,
    }
}

function normEntry(r: any): ProjectEntry {
    return {
        id:        r.id,
        projectId: r.project_id,
        project_id: r.project_id,
        content:   r.content,
        type:      r.type,
        date:      r.date,
        tags:      r.tags ?? [],
        images:    r.images ?? [],
    }
}

export const ProjectService = {
    createProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'created_at' | 'updated_at'>): Promise<string> => {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                user_id:       project.userId,
                title:         project.title,
                description:   project.description,
                start_amount:  project.startAmount ?? project.start_amount,
                target_amount: project.targetAmount ?? project.target_amount,
                current_amount: project.currentAmount ?? project.current_amount,
                currency:      project.currency,
                status:        project.status,
                tags:          project.tags,
                milestones:    project.milestones ?? [],
                cover_image:   project.coverImage ?? project.cover_image ?? null,
                featured_image: project.featuredImage ?? project.featured_image ?? null,
                icon:          project.icon ?? null,
                icon_color:    project.iconColor ?? project.icon_color ?? null,
                display_mode:  project.displayMode ?? project.display_mode ?? null,
                created_at:    new Date().toISOString(),
                updated_at:    new Date().toISOString(),
            })
            .select('id')
            .single()

        if (error) throw new Error(error.message)
        return data?.id ?? ''
    },

    getUserProjects: async (userId: string): Promise<Project[]> => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return (data ?? []).map(normProject)
    },

    getProject: async (projectId: string): Promise<Project | null> => {
        const { data, error } = await supabase
            .from('projects').select('*').eq('id', projectId).single()
        if (error || !data) return null
        return normProject(data)
    },

    updateProject: async (projectId: string, data: Partial<Project>): Promise<void> => {
        const patch: Record<string, any> = { updated_at: new Date().toISOString() }
        if (data.title         !== undefined) patch.title          = data.title
        if (data.description   !== undefined) patch.description    = data.description
        if (data.startAmount   !== undefined) patch.start_amount   = data.startAmount
        if (data.targetAmount  !== undefined) patch.target_amount  = data.targetAmount
        if (data.currentAmount !== undefined) patch.current_amount = data.currentAmount
        if (data.currency      !== undefined) patch.currency       = data.currency
        if (data.status        !== undefined) patch.status         = data.status
        if (data.tags          !== undefined) patch.tags           = data.tags
        if (data.milestones    !== undefined) patch.milestones     = data.milestones
        if (data.coverImage    !== undefined) patch.cover_image    = data.coverImage
        if (data.featuredImage !== undefined) patch.featured_image = data.featuredImage
        if (data.icon          !== undefined) patch.icon           = data.icon
        if (data.iconColor     !== undefined) patch.icon_color     = data.iconColor
        if (data.displayMode   !== undefined) patch.display_mode   = data.displayMode

        const { error } = await supabase.from('projects').update(patch).eq('id', projectId)
        if (error) throw new Error(error.message)
    },

    deleteProject: async (projectId: string): Promise<void> => {
        const { error } = await supabase.from('projects').delete().eq('id', projectId)
        if (error) throw new Error(error.message)
    },

    addEntry: async (entry: Omit<ProjectEntry, 'id' | 'date'>): Promise<string> => {
        const { data, error } = await supabase
            .from('project_entries')
            .insert({
                project_id: entry.projectId ?? entry.project_id,
                content:    entry.content,
                type:       entry.type,
                date:       new Date().toISOString(),
                tags:       entry.tags ?? [],
                images:     entry.images ?? [],
            })
            .select('id')
            .single()

        if (error) throw new Error(error.message)
        return data?.id ?? ''
    },

    getEntries: async (projectId: string): Promise<ProjectEntry[]> => {
        const { data, error } = await supabase
            .from('project_entries')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: false })

        if (error) throw new Error(error.message)
        return (data ?? []).map(normEntry)
    },

    updateEntry: async (entryId: string, content: string): Promise<void> => {
        const { error } = await supabase
            .from('project_entries').update({ content }).eq('id', entryId)
        if (error) throw new Error(error.message)
    },

    deleteEntry: async (entryId: string): Promise<void> => {
        const { error } = await supabase.from('project_entries').delete().eq('id', entryId)
        if (error) throw new Error(error.message)
    },
}
