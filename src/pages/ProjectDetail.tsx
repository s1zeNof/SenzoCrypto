import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Target,
    Calendar,
    TrendingUp,
    Plus,
    Save,
    Trash2,
    MoreVertical,
    CheckCircle2,
    Clock,
    Loader2,
    Edit2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProjectService, Project, ProjectEntry } from '@/services/ProjectService'
import { EmojiStickerService, type StickerPack } from '@/services/EmojiStickerService'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import RichTextEditor from '@/components/ui/RichTextEditor'
import Lottie from 'lottie-react'

export default function ProjectDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [project, setProject] = useState<Project | null>(null)
    const [entries, setEntries] = useState<ProjectEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [newEntry, setNewEntry] = useState('')
    const [entryType, setEntryType] = useState<'note' | 'trade' | 'update'>('note')
    const [submitting, setSubmitting] = useState(false)
    const [editingAmount, setEditingAmount] = useState(false)
    const [tempAmount, setTempAmount] = useState('')
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
    const [editingContent, setEditingContent] = useState('')
    const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([])

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id && user) {
            fetchData()
        }
    }, [id, user])

    const fetchData = async () => {
        if (!id) return
        try {
            setError(null)
            const [projectData, entriesData, packs] = await Promise.all([
                ProjectService.getProject(id),
                ProjectService.getEntries(id),
                EmojiStickerService.getActiveStickerPacks()
            ])

            if (projectData) {
                setProject(projectData)
                setTempAmount(projectData.currentAmount.toString())
            }
            setEntries(entriesData)
            setStickerPacks(packs)
        } catch (error: any) {
            console.error('Failed to fetch project data:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddEntry = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!id || !newEntry.trim()) return

        setSubmitting(true)
        try {
            await ProjectService.addEntry({
                projectId: id,
                content: newEntry,
                type: entryType
            })
            setNewEntry('')
            await fetchData() // Refresh entries
        } catch (error) {
            console.error('Failed to add entry:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateAmount = async () => {
        if (!id || !project) return
        try {
            const newAmount = Number(tempAmount)
            await ProjectService.updateProject(id, { currentAmount: newAmount })
            setProject({ ...project, currentAmount: newAmount })
            setEditingAmount(false)

            // Auto-add an update entry
            await ProjectService.addEntry({
                projectId: id,
                content: `Оновлено баланс: ${project.currentAmount} -> ${newAmount} ${project.currency}`,
                type: 'update'
            })
            fetchData() // Refresh entries to show the update
        } catch (error) {
            console.error('Failed to update amount:', error)
        }
    }

    const handleDeleteProject = async () => {
        if (!id || !window.confirm('Ви впевнені, що хочете видалити цей проект?')) return
        try {
            await ProjectService.deleteProject(id)
            navigate('/app/projects')
        } catch (error) {
            console.error('Failed to delete project:', error)
        }
    }

    const handleStatusChange = async (status: Project['status']) => {
        if (!id || !project) return
        try {
            await ProjectService.updateProject(id, { status })
            setProject({ ...project, status })
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const handleEditEntry = (entry: ProjectEntry) => {
        if (!entry.id) return
        setEditingEntryId(entry.id)
        setEditingContent(entry.content)
    }

    const handleSaveEntry = async (entryId: string) => {
        try {
            await ProjectService.updateEntry(entryId, editingContent)
            setEntries(entries.map(e => e.id === entryId ? { ...e, content: editingContent } : e))
            setEditingEntryId(null)
            setEditingContent('')
        } catch (error) {
            console.error('Failed to update entry:', error)
        }
    }

    const handleDeleteEntry = async (entryId: string) => {
        if (!window.confirm('Видалити цей запис?')) return
        try {
            await ProjectService.deleteEntry(entryId)
            setEntries(entries.filter(e => e.id !== entryId))
        } catch (error) {
            console.error('Failed to delete entry:', error)
        }
    }

    const renderContent = (content: string) => {
        // Check for sticker tag: [sticker:ID]
        const stickerMatch = content.match(/^\[sticker:(.+)\]$/)
        if (stickerMatch) {
            const stickerId = stickerMatch[1]
            // Find sticker in packs
            for (const pack of stickerPacks) {
                const sticker = pack.stickers.find(s => s.id === stickerId)
                if (sticker) {
                    try {
                        const animData = typeof sticker.lottieData === 'string'
                            ? JSON.parse(sticker.lottieData)
                            : sticker.lottieData
                        return (
                            <div className="w-32 h-32" title={sticker.name}>
                                <Lottie animationData={animData} loop={true} className="w-full h-full" />
                            </div>
                        )
                    } catch (e) {
                        console.error('Failed to parse sticker data', e)
                    }
                }
            }
        }

        return <div className="text-gray-300" dangerouslySetInnerHTML={{ __html: content }} />
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto pt-20 px-4">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center">
                    <p className="font-bold text-lg mb-2">Помилка завантаження даних</p>
                    <p className="mb-4">{error}</p>
                    {error.includes('index') && (
                        <div className="bg-surface p-4 rounded-xl border border-border inline-block text-left max-w-2xl">
                            <p className="text-sm text-gray-400 mb-2">
                                Необхідно створити індекс у базі даних. Це стандартна процедура для нових запитів.
                            </p>
                            <p className="text-xs text-gray-500">
                                1. Відкрийте консоль розробника (F12) &rarr; Console.<br />
                                2. Знайдіть посилання, що починається з <code>https://console.firebase.google.com...</code><br />
                                3. Перейдіть за ним і натисніть "Create Index".
                            </p>
                        </div>
                    )}
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/app/projects')}
                            className="px-6 py-2 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
                        >
                            Назад до списку
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-gray-400">Проект не знайдено</h2>
                <button
                    onClick={() => navigate('/app/projects')}
                    className="mt-4 text-primary hover:underline"
                >
                    Повернутися до списку
                </button>
            </div>
        )
    }

    const progress = Math.min(100, Math.max(0, (project.currentAmount / project.targetAmount) * 100))

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header / Navigation */}
            <button
                onClick={() => navigate('/app/projects')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Назад до проектів
            </button>

            {/* Project Overview Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="p-2 hover:bg-surface-hover rounded-lg text-gray-400 hover:text-white transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="min-w-[160px] bg-surface border border-border rounded-xl p-1 shadow-xl z-50 animate-in zoom-in-95 duration-200">
                                <DropdownMenu.Item
                                    onClick={() => handleStatusChange('active')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-hover hover:text-white rounded-lg cursor-pointer outline-none"
                                >
                                    <Clock className="w-4 h-4" /> Активний
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleStatusChange('paused')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-hover hover:text-white rounded-lg cursor-pointer outline-none"
                                >
                                    <Clock className="w-4 h-4" /> На паузі
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleStatusChange('completed')}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-surface-hover hover:text-green-300 rounded-lg cursor-pointer outline-none"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Завершити
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="h-px bg-border my-1" />
                                <DropdownMenu.Item
                                    onClick={handleDeleteProject}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg cursor-pointer outline-none"
                                >
                                    <Trash2 className="w-4 h-4" /> Видалити
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${project.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                    project.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                                        'bg-blue-500/10 text-blue-500'
                                }`}>
                                {project.status === 'active' ? 'Активний' :
                                    project.status === 'paused' ? 'На паузі' : 'Завершено'}
                            </span>
                        </div>
                        <p className="text-gray-400 mb-6">{project.description}</p>

                        <div className="flex gap-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Поточна сума</div>
                                {editingAmount ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={tempAmount}
                                            onChange={(e) => setTempAmount(e.target.value)}
                                            className="bg-background border border-border rounded px-2 py-1 w-32 text-white"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateAmount} className="p-1 hover:text-green-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-bold text-white flex items-center gap-2 group cursor-pointer" onClick={() => setEditingAmount(true)}>
                                        {project.currentAmount} <span className="text-sm font-normal text-gray-500">{project.currency}</span>
                                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Ціль</div>
                                <div className="text-2xl font-bold text-gray-400">
                                    {project.targetAmount} <span className="text-sm font-normal text-gray-500">{project.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-64 bg-background/50 rounded-xl p-4 border border-border">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Прогрес</span>
                            <span className="text-white font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Add Entry */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            Додати запис
                        </h3>

                        <form onSubmit={handleAddEntry} className="bg-surface border border-border rounded-2xl p-4 space-y-4">
                            <div className="flex bg-background rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setEntryType('note')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${entryType === 'note' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Нотатка
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEntryType('trade')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${entryType === 'trade' ? 'bg-blue-500 text-white shadow' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Угода
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEntryType('update')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${entryType === 'update' ? 'bg-green-500 text-white shadow' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Апдейт
                                </button>
                            </div>


                            <RichTextEditor
                                value={newEntry}
                                onChange={setNewEntry}
                                placeholder="Що нового? Опишіть свій прогрес..."
                                minHeight="128px"
                                onSubmit={() => handleAddEntry()}
                            />


                            <button
                                type="submit"
                                disabled={submitting || !newEntry.trim()}
                                className="w-full py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Зберегти запис'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Історія проекту
                    </h3>

                    <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/50">
                        {entries.length > 0 ? (
                            entries.map(entry => (
                                <div key={entry.id} className="relative pl-12 group">
                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center z-10 ${entry.type === 'trade' ? 'bg-blue-500 text-white' :
                                            entry.type === 'update' ? 'bg-green-500 text-white' :
                                                'bg-surface-hover text-gray-400'
                                        }`}>
                                        {entry.type === 'trade' ? <TrendingUp className="w-4 h-4" /> :
                                            entry.type === 'update' ? <Target className="w-4 h-4" /> :
                                                <Clock className="w-4 h-4" />}
                                    </div>

                                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group/card">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider ${entry.type === 'trade' ? 'bg-blue-500/10 text-blue-500' :
                                                    entry.type === 'update' ? 'bg-green-500/10 text-green-500' :
                                                        'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                {entry.type === 'trade' ? 'Угода' :
                                                    entry.type === 'update' ? 'Оновлення' : 'Нотатка'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">
                                                    {entry.date?.toDate().toLocaleString('uk-UA', {
                                                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {editingEntryId !== entry.id && (
                                                    <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditEntry(entry)}
                                                            className="p-1 hover:text-primary text-gray-500 transition-colors"
                                                            title="Редагувати"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => entry.id && handleDeleteEntry(entry.id)}
                                                            className="p-1 hover:text-red-400 text-gray-500 transition-colors"
                                                            title="Видалити"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {editingEntryId === entry.id ? (
                                            <div className="space-y-2">
                                                <RichTextEditor
                                                    value={editingContent}
                                                    onChange={setEditingContent}
                                                    placeholder="Редагувати запис..."
                                                    minHeight="96px"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingEntryId(null)}
                                                        className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        Скасувати
                                                    </button>
                                                    <button
                                                        onClick={() => entry.id && handleSaveEntry(entry.id)}
                                                        className="px-3 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                                                    >
                                                        Зберегти
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            renderContent(entry.content)
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="pl-12 text-gray-500 italic">
                                Ще немає записів. Додайте перший запис про початок проекту!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
