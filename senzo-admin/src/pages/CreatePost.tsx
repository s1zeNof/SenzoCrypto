import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createPost, uploadImage } from '../services/firebase'
import { generateSlug } from '../lib/utils'
import RichTextEditor from '../components/RichTextEditor'
import TagsInput from '../components/TagsInput'
import { Save, Eye, Upload, X, Clock } from 'lucide-react'
import { auth } from '../services/firebase'

interface PostForm {
    title: string
    slug: string
    excerpt: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    status: 'draft' | 'published'
    type: 'article' | 'case' | 'game' | 'project' | 'airdrop'
    sourceUrl?: string
}

export default function CreatePost() {
    const navigate = useNavigate()
    const { register, handleSubmit, watch, setValue } = useForm<PostForm>({
        defaultValues: {
            status: 'draft',
            difficulty: 'beginner',
            type: 'article'
        },
    })

    const [content, setContent] = useState('')
    const [featuredImage, setFeaturedImage] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [categories, setCategories] = useState<string[]>([])


    const statusValue = watch('status')

    // Auto-generate slug from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value
        setValue('title', title)
        setValue('slug', generateSlug(title))
    }

    // Calculate reading time
    const getReadingTime = () => {
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
        const minutes = Math.ceil(words / 200)
        return minutes
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const url = await uploadImage(file, 'featured')
            setFeaturedImage(url)
            toast.success('Зображення завантажено')
        } catch (error) {
            toast.error('Помилка завантаження зображення')
        } finally {
            setUploading(false)
        }
    }

    const onSubmit = async (data: PostForm) => {
        if (!content.trim()) {
            toast.error('Контент не може бути порожнім')
            return
        }

        if (categories.length === 0) {
            toast.error('Додайте хоча б одну категорію')
            return
        }

        const user = auth.currentUser
        if (!user) {
            toast.error('Потрібно увійти в систему')
            return
        }

        setSaving(true)
        try {
            await createPost({
                ...data,
                content,
                featuredImage,
                tags,
                category: categories[0], // Use first category as main
                author: {
                    uid: user.uid,
                    name: user.displayName || 'Admin',
                    email: user.email || '',
                },
            })

            toast.success(data.status === 'published' ? 'Пост опубліковано!' : 'Чернетка збережена!')
            navigate('/posts')
        } catch (error: any) {
            console.error('Error creating post:', error)
            toast.error('Помилка створення посту: ' + (error.message || error.toString()))
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface sticky top-0 z-10">
                <h1 className="text-2xl font-bold">Новий пост</h1>
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusValue === 'published'
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'bg-warning/20 text-warning border border-warning/30'
                        }`}>
                        {statusValue === 'published' ? 'Опубліковано' : 'Чернетка'}
                    </span>

                    <button
                        type="button"
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        Попередній перегляд
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Збереження...' : (statusValue === 'published' ? 'Опублікувати' : 'Зберегти чернетку')}
                    </button>
                </div>
            </div>

            {/* 2-Column Layout */}
            <div className="flex h-[calc(100vh-73px)]">
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="w-full">
                        {/* Title */}
                        <input
                            type="text"
                            {...register('title', { required: true })}
                            onChange={handleTitleChange}
                            placeholder="Введіть заголовок..."
                            className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none mb-4 placeholder:text-gray-600"
                            autoFocus
                        />

                        {/* Excerpt */}
                        <textarea
                            {...register('excerpt', { required: true })}
                            placeholder="Короткий опис (excerpt)..."
                            rows={3}
                            className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors mb-6 resize-none"
                        />

                        {/* Rich Text Editor */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-300">Контент</label>
                            <RichTextEditor content={content} onChange={setContent} />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 border-l border-border bg-surface overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Publish Settings */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg">Публікація</h3>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Статус</label>
                                <select
                                    {...register('status')}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="draft">Чернетка</option>
                                    <option value="published">Опубліковано</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Тип посту</label>
                                <select
                                    {...register('type')}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="article">Стаття</option>
                                    <option value="case">Кейс</option>
                                    <option value="game">Гра</option>
                                    <option value="project">Проект</option>
                                    <option value="airdrop">Аірдроп</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Рівень складності</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { value: 'beginner', label: 'Початковий', color: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' },
                                        { value: 'intermediate', label: 'Середній', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' },
                                        { value: 'advanced', label: 'Просунутий', color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' }
                                    ].map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => setValue('difficulty', level.value as any)}
                                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left flex items-center gap-2 ${watch('difficulty') === level.value
                                                ? level.color + ' ring-1 ring-offset-1 ring-offset-surface ring-white/20'
                                                : 'bg-background border-border text-gray-400 hover:border-gray-500'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${level.value === 'beginner' ? 'bg-green-500' :
                                                level.value === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} />
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Source URL */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Джерело (URL)</label>
                                <input
                                    type="url"
                                    {...register('sourceUrl')}
                                    placeholder="https://original-source.com"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                                />
                            </div>

                            {/* Reading Time */}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Час читання: ~{getReadingTime()} хв</span>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            {/* URL/Slug */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 text-gray-300">URL (slug)</label>
                                <input
                                    type="text"
                                    {...register('slug', { required: true })}
                                    placeholder="url-slug"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1">Автоматично генерується з заголовка</p>
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <TagsInput
                                    value={categories}
                                    onChange={setCategories}
                                    placeholder="Додати категорію..."
                                    label="Категорії"
                                />
                            </div>

                            {/* Tags */}
                            <div className="mb-6">
                                <TagsInput
                                    value={tags}
                                    onChange={setTags}
                                    placeholder="Додати тег..."
                                    label="Теги"
                                />
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            {/* Featured Image */}
                            <div>
                                <label className="block text-sm font-medium mb-3 text-gray-300">Головне зображення</label>

                                {featuredImage ? (
                                    <div className="relative group mb-3">
                                        <img
                                            src={featuredImage}
                                            alt="Featured"
                                            className="w-full h-40 object-cover rounded-lg border border-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFeaturedImage('')}
                                            className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Видалити зображення"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null}

                                <div className="space-y-3">
                                    {/* URL Input */}
                                    <div>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            value={featuredImage}
                                            onChange={(e) => setFeaturedImage(e.target.value)}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                                        />
                                    </div>

                                    <div className="text-center text-xs text-gray-500 font-medium">- АБО -</div>

                                    {/* File Upload */}
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-background/50">
                                        <Upload className="w-6 h-6 text-gray-500 mb-1" />
                                        <span className="text-xs text-gray-500">Завантажити файл</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>

                                {uploading && (
                                    <div className="mt-2 text-sm text-gray-400 text-center">Завантаження...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
