import { Link } from 'react-router-dom'
import {
    TrendingUp,
    Wallet,
    BarChart3,
    Sprout,
    ArrowLeftRight,
    BookOpen,
    Zap,
    Shield,
    Clock,
    TrendingDown,
    Target
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 animated-gradient opacity-30" />

                <div className="relative container-tight py-20 md:py-32">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
                            <span className="gradient-text">Master Crypto Trading</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-foreground-muted mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Професійна платформа для трейдингу, аналітики та заробітку в криптовалюті
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link to="/auth/register">
                                <Button size="lg" className="text-lg px-8">
                                    Почати безкоштовно
                                </Button>
                            </Link>
                            <Link to="/auth/login">
                                <Button size="lg" variant="outline" className="text-lg px-8">
                                    Увійти
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="container-tight py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <Card key={index} glass className="text-center p-6">
                            <div className="text-3xl md:text-4xl font-bold gradient-text num mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-foreground-muted">{stat.label}</div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="container-tight py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">Все для успішного трейдингу</h2>
                    <p className="text-xl text-foreground-muted">
                        Оберіть інструмент який вам потрібен
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Link key={index} to={feature.link}>
                            <Card className="h-full transition-all hover:scale-105 hover:border-primary cursor-pointer group">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {feature.available ? (
                                        <div className="flex items-center gap-2 text-success text-sm">
                                            <Zap className="w-4 h-4" />
                                            <span>Доступно зараз</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-warning text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>Скоро</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Benefits Section */}
            <section className="container-tight py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">Чому обирають Senzo?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="text-center">
                            <div className={`w-16 h-16 rounded-full ${benefit.color} flex items-center justify-center mx-auto mb-4`}>
                                <benefit.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                            <p className="text-foreground-muted">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="container-tight py-20">
                <Card glass className="p-12 text-center">
                    <h2 className="text-4xl font-bold mb-4">Готові почати заробляти?</h2>
                    <p className="text-xl text-foreground-muted mb-8 max-w-2xl mx-auto">
                        Приєднуйтесь до тисяч трейдерів які вже використовують Senzo для успішної торгівлі
                    </p>
                    <Link to="/auth/register">
                        <Button size="lg" className="text-lg px-12">
                            Створити акаунт
                        </Button>
                    </Link>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8">
                <div className="container-tight text-center text-foreground-muted">
                    <p>&copy; 2025 Senzo Crypto. Всі права захищені.</p>
                </div>
            </footer>
        </div>
    )
}

// Data
const stats = [
    { value: '10K+', label: 'Активних користувачів' },
    { value: '$50M+', label: 'Обсяг торгів' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Підтримка' },
]

const features = [
    {
        title: 'Trading',
        description: 'Професійний інтерфейс для трейдингу з графіками та аналізом',
        icon: TrendingUp,
        color: 'bg-primary',
        link: '/auth/register',
        available: true,
    },
    {
        title: 'Portfolio',
        description: 'Відстежуйте свої активи та прибутки в реальному часі',
        icon: Wallet,
        color: 'bg-success',
        link: '/auth/register',
        available: true,
    },
    {
        title: 'Analytics  ',
        description: 'Детальна аналітика вашої торгівлі та ризик-менеджмент',
        icon: BarChart3,
        color: 'bg-info',
        link: '/auth/register',
        available: true,
    },
    {
        title: 'Yield Farming',
        description: 'Знаходьте найкращі можливості для стейкінгу та фармінгу',
        icon: Sprout,
        color: 'bg-secondary',
        link: '/auth/register',
        available: false,
    },
    {
        title: 'Arbitrage',
        description: 'Автоматичний сканер арбітражних можливостей',
        icon: ArrowLeftRight,
        color: 'bg-warning',
        link: '/auth/register',
        available: false,
    },
    {
        title: 'Навчання',
        description: 'Курси та матеріали для початківців та професіоналів',
        icon: BookOpen,
        color: 'bg-danger',
        link: '/auth/register',
        available: false,
    },
]

const benefits = [
    {
        title: 'Швидко',
        description: 'Миттєве виконання ордерів та оновлення даних в реальному часі',
        icon: Zap,
        color: 'bg-warning',
    },
    {
        title: 'Безпечно',
        description: 'Ваші дані захищені найсучаснішими технологіями шифрування',
        icon: Shield,
        color: 'bg-success',
    },
    {
        title: 'Точно',
        description: 'Професійні інструменти аналізу для прийняття правильних рішень',
        icon: Target,
        color: 'bg-primary',
    },
]
