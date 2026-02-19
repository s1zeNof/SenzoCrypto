import { useState, useEffect } from 'react'
import { Search, Gamepad2 } from 'lucide-react'
import { getPostsByType, type Post } from '../services/posts'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/utils'

export default function CryptoGames() {
    const [posts, setPosts] = useState<Post[]>([])
    const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadPosts()
    }, [])

    useEffect(() => {
        filterPosts()
    }, [posts, searchQuery])

    const loadPosts = async () => {
        try {
            const data = await getPostsByType('game')
            setPosts(data)
        } catch (error) {
            console.error('Error loading games:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterPosts = () => {
        let filtered = [...posts]

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
                        <span className="gradient-text">Crypto Games</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Огляди нових P2E ігор, метавсесвітів та ігрових токенів
                    </p>
                </div>

                {/* Search */}
                <div className="glass-card p-6 mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Пошук ігор..."
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Posts Grid */}
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-16">
                        <Gamepad2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Ігор поки немає</h3>
                        <p className="text-gray-400">Слідкуйте за оновленнями, AI агент вже шукає нові проекти!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map((post) => (
                            <Link
                                key={post.id}
                                to={`/app/academy/${post.slug}`}
                                className="glass-card group hover:scale-[1.02] transition-all duration-300"
                            >
                                {/* Featured Image */}
                                {post.featuredImage && (
                                    <div className="aspect-video overflow-hidden rounded-t-lg relative">
                                        <img
                                            src={post.featuredImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">
                                            GAME
                                        </div>
                                    </div>
                                )}

                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{post.author.name}</span>
                                        <span>{formatDate(post.createdAt.toDate())}</span>
                                    </div>
                                    {post.sourceUrl && (
                                        <div className="mt-4 pt-4 border-t border-border text-xs text-blue-400 truncate">
                                            Джерело: {new URL(post.sourceUrl).hostname}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
