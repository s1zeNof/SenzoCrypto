import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Eye, Clock, FileText, Search, Image as ImageIcon } from 'lucide-react'
import { getAllPosts, deletePost, type Post } from '../services/firebase'
import { toast } from 'sonner'
import { formatDate } from '../lib/utils'

export default function PostsList() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            const data = await getAllPosts()
            setPosts(data)
        } catch (error) {
            toast.error('Помилка завантаження постів')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити цей пост?')) return

        try {
            await deletePost(id)
            setPosts(posts.filter(p => p.id !== id))
            toast.success('Пост видалено')
        } catch (error) {
            toast.error('Помилка видалення')
        }
    }

    // Get unique categories for filter
    const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)))

    // Filter posts
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || post.status === statusFilter
        const matchesDifficulty = difficultyFilter === 'all' || post.difficulty === difficultyFilter
        const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter

        return matchesSearch && matchesStatus && matchesDifficulty && matchesCategory
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Пости</h1>
                    <p className="text-gray-400 mt-1">Управління контентом блогу</p>
                </div>
                <Link
                    to="/posts/new"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    Створити пост
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-surface rounded-lg border border-border p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Пошук за назвою або описом..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                        >
                            <option value="all">Всі статуси</option>
                            <option value="published">Опубліковані</option>
                            <option value="draft">Чернетки</option>
                        </select>

                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                        >
                            <option value="all">Всі рівні</option>
                            <option value="beginner">Початковий</option>
                            <option value="intermediate">Середній</option>
                            <option value="advanced">Просунутий</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
                        >
                            <option value="all">Всі категорії</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Posts Table */}
            {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-lg border border-border">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Нічого не знайдено</h3>
                    <p className="text-gray-400">Спробуйте змінити параметри пошуку або фільтри</p>
                </div>
            ) : (
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background border-b border-border">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300 w-20">Фото</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Назва</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Категорія</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Рівень</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Статус</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Дата</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Перегляди</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Дії</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredPosts.map((post) => (
                                    <tr key={post.id} className="hover:bg-background/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {post.featuredImage ? (
                                                <img
                                                    src={post.featuredImage}
                                                    alt={post.title}
                                                    className="w-12 h-12 rounded-lg object-cover border border-border"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-gray-500">
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="font-medium truncate" title={post.title}>{post.title}</div>
                                            <div className="text-sm text-gray-400 mt-1 truncate" title={post.excerpt}>
                                                {post.excerpt}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary border border-primary/30">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${post.difficulty === 'beginner'
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : post.difficulty === 'intermediate'
                                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                }`}>
                                                {post.difficulty === 'beginner' ? 'Початковий' :
                                                    post.difficulty === 'intermediate' ? 'Середній' : 'Просунутий'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-2 w-fit px-3 py-1 rounded-full text-xs border ${post.status === 'published'
                                                ? 'bg-success/20 text-success border-success/30'
                                                : 'bg-warning/20 text-warning border-warning/30'
                                                }`}>
                                                {post.status === 'published' ? (
                                                    <>
                                                        <Eye className="w-3 h-3" />
                                                        Опубліковано
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-3 h-3" />
                                                        Чернетка
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                                            {post.createdAt && formatDate(post.createdAt.toDate())}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {post.views || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Link
                                                    to={`/posts/edit/${post.id}`}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Редагувати"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(post.id!)}
                                                    className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                                    title="Видалити"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
