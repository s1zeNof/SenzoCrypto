import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Bookmark, User, Clock, Eye, Brain, Trophy } from 'lucide-react'
import { getPostBySlug, type Post } from '@/services/posts'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import QuizModal from '@/components/academy/QuizModal'

export default function PostDetail() {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { user, userData, toggleSavePost } = useAuth()
    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [isQuizOpen, setIsQuizOpen] = useState(false)

    useEffect(() => {
        loadPost()
    }, [slug])

    const loadPost = async () => {
        if (!slug) return

        try {
            const data = await getPostBySlug(slug)
            setPost(data)
        } catch (error) {
            console.error('Error loading post:', error)
        } finally {
            setLoading(false)
        }
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

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Пост не знайдено</h2>
                    <Link to="/app/academy" className="text-primary hover:underline">
                        Повернутися до Academy
                    </Link>
                </div>
            </div>
        )
    }

    const difficultyBadge = getDifficultyBadge(post.difficulty)

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                </button>

                {/* Header */}
                <div className="mb-8">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyBadge.style}`}>
                            {difficultyBadge.label}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary border border-primary/30">
                            {post.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-6">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {post.author.name}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(new Date(post.createdAt))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {post.views} переглядів
                        </div>
                        {userData?.masteredPosts?.includes(post.id) && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                                <Trophy className="w-4 h-4" />
                                <span className="text-xs font-medium">Засвоєно</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {/* Save Button */}
                        <button
                            onClick={() => user ? toggleSavePost(post.id) : navigate('/auth/login')}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${userData?.savedPosts?.includes(post.id)
                                ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30'
                                : 'bg-surface border-border hover:bg-surface-hover'
                                }`}
                        >
                            <Bookmark className={`w-4 h-4 ${userData?.savedPosts?.includes(post.id) ? 'fill-current' : ''}`} />
                            {userData?.savedPosts?.includes(post.id) ? 'Збережено' : 'Зберегти в профіль'}
                        </button>

                        {/* Quiz Button */}
                        {user && (
                            <button
                                onClick={() => setIsQuizOpen(true)}
                                className="relative flex items-center gap-2 px-4 py-2 text-white rounded-lg overflow-hidden group"
                            >
                                {/* Animated gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient" />
                                <div className="relative flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Пройти AI Quiz
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Featured Image */}
                {post.featuredImage && (
                    <div className="mb-8 rounded-lg overflow-hidden">
                        <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-auto object-cover"
                        />
                    </div>
                )}

                {/* Excerpt */}
                <div className="glass-card p-6 mb-8">
                    <p className="text-lg text-gray-300 leading-relaxed">
                        {post.excerpt}
                    </p>
                </div>

                {/* Airdrop/Game Specific Info */}
                {(post.rewardStatus || post.deadline || post.steps) && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Card */}
                        <div className="glass-card p-6 border-l-4 border-primary">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary" />
                                Інформація про винагороду
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Статус:</span>
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${post.rewardStatus === 'Confirmed' ? 'bg-green-500/20 text-green-400' :
                                        post.rewardStatus === 'Speculative' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {post.rewardStatus === 'Confirmed' ? 'Підтверджено' :
                                            post.rewardStatus === 'Speculative' ? 'Можливо' : 'Невідомо'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Дедлайн:</span>
                                    <span className="text-white font-medium">{post.deadline || 'Не вказано'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Steps Card */}
                        {post.steps && post.steps.length > 0 && (
                            <div className="glass-card p-6 md:col-span-2">
                                <h3 className="text-lg font-bold mb-4">📝 Що потрібно зробити:</h3>
                                <div className="space-y-3">
                                    {post.steps.map((step, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold mt-0.5">
                                                {index + 1}
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <article className="post-content prose prose-invert prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </article>

                {/* Tags */}
                {post.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">Теги:</h3>
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-surface text-sm rounded-full text-gray-300 hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Posts Section (Placeholder) */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">Схожі статті</h2>
                    <div className="text-gray-400">Скоро тут з'являться рекомендації...</div>
                </div>
            </div>

            <QuizModal
                isOpen={isQuizOpen}
                onClose={() => setIsQuizOpen(false)}
                postContent={post.content}
                postId={post.id}
                postTitle={post.title}
            />
        </div>
    )
}
