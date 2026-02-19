import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { FileText, Settings, LogOut, PlusCircle, Smile, Sticker } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { toast } from 'sonner'

export default function Layout() {
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            toast.success('Вихід виконано')
            navigate('/login')
        } catch (error) {
            toast.error('Помилка виходу')
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-border flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">
                        <span className="text-primary">Senzo</span> Admin
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Content Management</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link
                        to="/posts"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.startsWith('/posts')
                                ? 'bg-primary text-white'
                                : 'text-gray-300 hover:bg-surface hover:text-white'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Пости</span>
                    </Link>

                    <Link
                        to="/emoji-packs"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.startsWith('/emoji-packs')
                                ? 'bg-primary text-white'
                                : 'text-gray-300 hover:bg-surface hover:text-white'
                            }`}
                    >
                        <Smile className="w-5 h-5" />
                        <span>Емоджі паки</span>
                    </Link>

                    <Link
                        to="/sticker-packs"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname.startsWith('/sticker-packs')
                                ? 'bg-primary text-white'
                                : 'text-gray-300 hover:bg-surface hover:text-white'
                            }`}
                    >
                        <Sticker className="w-5 h-5" />
                        <span>Стікер паки</span>
                    </Link>

                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/settings'
                                ? 'bg-primary text-white'
                                : 'text-gray-300 hover:bg-surface hover:text-white'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        <span>Налаштування</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-surface hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Вийти</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8">
                    <div className="text-sm text-gray-400">
                        Senzo Crypto Admin Panel
                    </div>
                    <Link
                        to="/posts/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Новий пост
                    </Link>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
