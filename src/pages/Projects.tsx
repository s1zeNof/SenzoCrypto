import { useState, useEffect } from 'react'
import { Plus, Target, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProjectService, Project } from '@/services/ProjectService'
import ProjectCard from '@/components/projects/ProjectCard'
import CreateProjectModal from '@/components/projects/CreateProjectModal'

export default function Projects() {
    const { user } = useAuth()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const [error, setError] = useState<string | null>(null)

    const fetchProjects = async () => {
        if (!user) return
        try {
            setError(null)
            const data = await ProjectService.getUserProjects(user.uid)
            setProjects(data)
        } catch (error: any) {
            console.error('Failed to fetch projects:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [user])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <p className="font-bold">Помилка завантаження проектів:</p>
                    <p className="text-sm">{error}</p>
                    {error.includes('index') && (
                        <p className="text-xs mt-2 text-gray-400">
                            Схоже, потрібен індекс Firestore. Перевірте консоль розробника для посилання на створення індексу.
                        </p>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Мої Проекти</h1>
                    <p className="text-gray-400">Відстежуйте свої цілі та челенджі</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Створити проект
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-surface/30 border border-border/50 rounded-2xl border-dashed">
                    <div className="inline-block p-4 rounded-full bg-surface border border-border mb-4">
                        <Target className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">У вас ще немає проектів</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                        Створіть свій перший челендж, щоб почати відстежувати прогрес та вести щоденник.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Створити проект
                    </button>
                </div>
            )}

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onProjectCreated={fetchProjects}
            />
        </div>
    )
}
