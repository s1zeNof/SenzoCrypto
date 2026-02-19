import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { getAllPosts, type Post } from '../services/posts'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/utils'

export default function Academy() {
    const [posts, setPosts] = useState<Post[]>([])
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    useEffect(() => {
        loadPosts()
    }, [])

    useEffect(() => {
        filterPosts()
    }, [posts, searchQuery, selectedDifficulty, selectedCategory])

    const loadPosts = async () => {
        try {
            console.log('Loading posts...')
            const data = await getAllPosts()
            console.log('Posts loaded:', data.length, data)
            setPosts(data)
        } catch (error) {
            console.error('Error loading posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterPosts = () => {
        let filtered = [...posts]

        // Filter by difficulty
        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter(post => post.difficulty === selectedDifficulty)
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(post => post.category === selectedCategory)
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query))
            )
        }

        setFilteredPosts(filtered)
    }

    const getDifficultyBadge = (difficulty: string) => {
        const styles = {
            beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
            intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
        }
        const labels = {
            beginner: 'Початковий',
            intermediate: 'Середній',
            advanced: 'Просунутий'
        }
        return { style: styles[difficulty as keyof typeof styles], label: labels[difficulty as keyof typeof labels] }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="gradient-text">Senzo Academy</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Навчайтеся криптотрейдингу та DeFi від початкового до професійного рівня
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="glass-card p-6 mb-8">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Пошук статей..."
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        {/* Difficulty Filter */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-2 text-gray-300">Рів ень складності</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedDifficulty('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'all'
                                        ? 'bg-primary text-white'
                                        : 'bg-surface text-gray-400 hover:bg-surface-hover'
                                        }`}
                                >
                                    Всі
                                </button>
                                <button
                                    onClick={() => setSelectedDifficulty('beginner')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'beginner'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-surface text-gray-400 hover:bg-surface-hover'
                                        }`}
                                >
                                    Початковий
                                </button>
                                <button
                                    onClick={() => setSelectedDifficulty('intermediate')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'intermediate'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-surface text-gray-400 hover:bg-surface-hover'
                                        }`}
                                >
                                    Середній
                                </button>
                                <button
                                    onClick={() => setSelectedDifficulty('advanced')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'advanced'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-surface text-gray-400 hover:bg-surface-hover'
                                        }`}
                                >
                                    Просунутий
                                </button>
                            </div>
                        </div>

                        {/*Category Filter */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium mb-2 text-gray-300">Категорія</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="all">Всі категорії</option>
                                <option value="Trading">Trading</option>
                                <option value="DeFi">DeFi</option>
                                <option value="NFT">NFT</option>
                                <option value="News">Новини</option>
                                <option value="Tutorial">Навчання</option>
                                <option value="Analysis">Аналітика</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-400">
                        Знайдено: <span className="text-primary font-semibold">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'стаття' : 'статей'}
                    </div>
                </div>

                {/* Posts Grid */}
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-16">
                        <Filter className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Нічого не знайдено</h3>
                        <p className="text-gray-400">Спробуйте змінити фільтри або пошуковий запит</p>
                        <p className="text-xs text-gray-500 mt-2">Debug: Всього постів: {posts.length}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map((post) => {
                            const difficultyBadge = getDifficultyBadge(post.difficulty)

                            return (
                                <Link
                                    key={post.id}
                                    to={`/app/academy/${post.slug}`}
                                    className="glass-card group hover:scale-[1.02] transition-all duration-300"
                                >
                                    {/* Featured Image */}
                                    {post.featuredImage && (
                                        <div className="aspect-video overflow-hidden rounded-t-lg">
                                            <img
                                                src={post.featuredImage}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Badges */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${difficultyBadge.style}`}>
                                                {difficultyBadge.label}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                                {post.category}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>

                                        {/* Excerpt */}
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                            {post.excerpt}
                                        </p>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{post.author.name}</span>
                                            <span>{formatDate(post.createdAt.toDate())}</span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
