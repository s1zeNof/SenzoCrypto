import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, LogOut, User as UserIcon, Settings, ChevronDown, FileText, Server, Code, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { logout } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import Ticker from './Ticker'

export default function Navbar() {
    const navigate = useNavigate()
    const { user, userData } = useAuth()

    const handleLogout = async () => {
        await logout()
        navigate('/auth/login')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-surface/80 backdrop-blur-lg">
            <div className="flex items-center justify-between h-full px-6">
                {/* Logo */}
                <Link to="/app/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-base">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold gradient-text">Senzo Crypto</span>
                </Link>

                {/* Developer Mega Menu — hidden for now, preserved for future use */}
                <div className="relative group ml-8 hidden">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-surface-hover transition-all">
                        <span className="text-sm font-medium">Develop</span>
                        <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                    </button>

                    {/* Mega Menu Dropdown */}
                    <div className="absolute left-0 top-full mt-2 w-[600px] bg-surface border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top z-50 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Docs Card */}
                            <Link
                                to="/app/docs"
                                className="group/card p-4 rounded-xl border border-border hover:border-primary/50 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 hover:from-blue-500/10 hover:to-cyan-500/10 transition-all hover:scale-[1.02]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 group-hover/card:shadow-lg group-hover/card:shadow-blue-500/30 transition-all">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1 group-hover/card:text-primary transition-colors">Documentation</h3>
                                        <p className="text-xs text-foreground-muted line-clamp-2">Complete guides, API reference, and tutorials</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Compute Nodes Card */}
                            <Link
                                to="/app/compute-nodes"
                                className="group/card p-4 rounded-xl border border-border hover:border-success/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:from-green-500/10 hover:to-emerald-500/10 transition-all hover:scale-[1.02]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 group-hover/card:shadow-lg group-hover/card:shadow-green-500/30 transition-all">
                                        <Server className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1 group-hover/card:text-success transition-colors">Compute Nodes</h3>
                                        <p className="text-xs text-foreground-muted line-clamp-2">Global network infrastructure and monitoring</p>
                                    </div>
                                </div>
                            </Link>

                            {/* SDK Card */}
                            <Link
                                to="/app/sdk"
                                className="group/card p-4 rounded-xl border border-border hover:border-secondary/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 transition-all hover:scale-[1.02]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 group-hover/card:shadow-lg group-hover/card:shadow-purple-500/30 transition-all">
                                        <Code className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1 group-hover/card:text-secondary transition-colors">SDK</h3>
                                        <p className="text-xs text-foreground-muted line-clamp-2">Developer tools for TypeScript, Python, Rust & Go</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Community Card */}
                            <Link
                                to="/app/community"
                                className="group/card p-4 rounded-xl border border-border hover:border-warning/50 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 hover:from-orange-500/10 hover:to-yellow-500/10 transition-all hover:scale-[1.02]"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 group-hover/card:shadow-lg group-hover/card:shadow-orange-500/30 transition-all">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1 group-hover/card:text-warning transition-colors">Community</h3>
                                        <p className="text-xs text-foreground-muted line-clamp-2">Join our global community on Twitter, GitHub & more</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Quick Links */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center justify-between text-xs">
                                <a href="https://x.com/SynzaLabs" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-primary transition-colors">
                                    Twitter →
                                </a>
                                <a href="https://github.com/SynzaLab" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-primary transition-colors">
                                    GitHub →
                                </a>
                                <span className="text-foreground-muted">Documentation →</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Ticker */}
                <Ticker />

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="relative group">
                            <button className="flex items-center gap-3 hover:opacity-80 transition-base">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-medium">{userData?.displayName || user.email}</div>
                                    <div className="text-xs text-foreground-muted">@{userData?.username || 'user'}</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                                    <div className="w-full h-full rounded-full bg-surface overflow-hidden">
                                        {userData?.photoURL ? (
                                            <img src={userData.photoURL} alt={userData.displayName || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-surface text-primary font-bold">
                                                {(userData?.displayName || user.email || 'U')[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                                <div className="p-2">
                                    <Link to="/app/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
                                        <UserIcon className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">Мій профіль</span>
                                    </Link>
                                    <Link to="/app/profile?tab=settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors">
                                        <Settings className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium">Налаштування</span>
                                    </Link>
                                    <div className="h-px bg-border my-2" />
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-left">
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-medium">Вийти</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/auth/login">
                                <Button variant="ghost" size="sm">Увійти</Button>
                            </Link>
                            <Link to="/auth/register">
                                <Button size="sm">Реєстрація</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
