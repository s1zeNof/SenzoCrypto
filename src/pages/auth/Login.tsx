import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { loginWithEmail, loginWithGoogle, loginWithGithub } from '@/services/firebase'

export default function Login() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { user, error: authError } = await loginWithEmail(formData.email, formData.password)

            if (authError) {
                setError(authError)
            } else if (user) {
                // Success! Redirect to app
                navigate('/app/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Помилка входу')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setError('')
        setLoading(true)
        try {
            const { user, error: authError } = await loginWithGoogle()
            if (authError) {
                setError(authError)
            } else if (user) {
                navigate('/app/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Помилка входу через Google')
        } finally {
            setLoading(false)
        }
    }

    const handleGithubLogin = async () => {
        setError('')
        setLoading(true)
        try {
            const { user, error: authError } = await loginWithGithub()
            if (authError) {
                setError(authError)
            } else if (user) {
                navigate('/app/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Помилка входу через GitHub')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Animated Background */}
            <div className="absolute inset-0 animated-gradient opacity-20" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold gradient-text">Senzo Crypto</span>
                </Link>

                <Card glass>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">З поверненням!</CardTitle>
                        <CardDescription>Увійдіть щоб продовжити роботу</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* Error message */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-danger">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-elevated border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="email@example.com"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">Пароль</label>
                                    <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                                        Забули пароль?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-surface-elevated border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={formData.remember}
                                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                    className="w-4 h-4 rounded border-border bg-surface-elevated text-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-foreground-muted cursor-pointer">
                                    Запам'ятати мене
                                </label>
                            </div>

                            {/* Submit Button */}
                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Вхід...
                                    </>
                                ) : (
                                    'Увійти'
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-surface-elevated text-foreground-muted">або</span>
                                </div>
                            </div>

                            {/* Social Login */}
                            <div className="space-y-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Увійти через Google
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    onClick={handleGithubLogin}
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    Увійти через GitHub
                                </Button>
                            </div>

                            {/* Register Link */}
                            <p className="text-center text-sm text-foreground-muted mt-6">
                                Немає акаунту?{' '}
                                <Link to="/auth/register" className="text-primary hover:underline font-medium">
                                    Зареєструватися
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
