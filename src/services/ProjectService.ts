import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

export interface Project {
    id?: string
    userId: string
    title: string
    description: string
    startAmount: number
    targetAmount: number
    currentAmount: number
    currency: string
    status: 'active' | 'completed' | 'paused'
    tags: string[]
    milestones?: Milestone[]  // Intermediate goals
    // Visual Identity
    coverImage?: string      // URL to cover image (full-width hero)
    featuredImage?: string   // URL to featured image (thumbnail)
    icon?: string            // Icon name or emoji
    iconColor?: string       // Hex color for icon
    displayMode?: 'icon' | 'featured' | 'both'  // How to display in detail view
    createdAt?: any
    updatedAt?: any
}

export interface ProjectEntry {
    id?: string
    projectId: string
    content: string
    type: 'note' | 'trade' | 'update'
    date: any
    tags?: string[]       // Optional tags for filtering
    images?: string[]     // URLs to attached images
}

export interface Milestone {
    id: string
    amount: number
    label: string
    achieved: boolean
    achievedAt?: any
}


const PROJECTS_COLLECTION = 'projects'
const ENTRIES_COLLECTION = 'project_entries'

export const ProjectService = {
    // Create a new project
    createProject: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
        const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
            ...project,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })
        return docRef.id
    },

    // Get all projects for a user
    getUserProjects: async (userId: string) => {
        const q = query(
            collection(db, PROJECTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project))
    },

    // Get a single project by ID
    getProject: async (projectId: string) => {
        const docRef = doc(db, PROJECTS_COLLECTION, projectId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Project
        }
        return null
    },

    // Update a project
    updateProject: async (projectId: string, data: Partial<Project>) => {
        const docRef = doc(db, PROJECTS_COLLECTION, projectId)
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        })
    },

    // Delete a project
    deleteProject: async (projectId: string) => {
        const docRef = doc(db, PROJECTS_COLLECTION, projectId)
        await deleteDoc(docRef)
    },

    // Add a diary entry
    addEntry: async (entry: Omit<ProjectEntry, 'id' | 'date'>) => {
        const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), {
            ...entry,
            date: serverTimestamp()
        })
        return docRef.id
    },

    // Get entries for a project
    getEntries: async (projectId: string) => {
        const q = query(
            collection(db, ENTRIES_COLLECTION),
            where('projectId', '==', projectId),
            orderBy('date', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectEntry))
    },

    // Update a diary entry
    updateEntry: async (entryId: string, content: string) => {
        const docRef = doc(db, ENTRIES_COLLECTION, entryId)
        await updateDoc(docRef, {
            content
        })
    },

    // Delete a diary entry
    deleteEntry: async (entryId: string) => {
        const docRef = doc(db, ENTRIES_COLLECTION, entryId)
        await deleteDoc(docRef)
    }
}
