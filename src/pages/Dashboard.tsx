import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import {
    TrendingUp,
    Wallet,
    BarChart3,
    Sprout,
    ArrowLeftRight,
    BookOpen,
    Settings,
    FileText,
    Users,
    DollarSign,
    Activity,
    Zap
} from 'lucide-react'

export default function Dashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-4xl font-bold mb-2">Вітаємо в Senzo Crypto! 👋</h1>
                <p className="text-foreground-muted text-lg">
                    Оберіть модуль щоб почати роботу
                </p>
            </div>

            {/* Main Modules Grid */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Основні модулі</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mainModules.map((module) => (
                        <Link key={module.to} to={module.to}>
                            <Card className="h-full transition-all hover:scale-105 hover:border-primary cursor-pointer group">
                                <CardHeader>
                                    <div className={`w-14 h-14 rounded-xl ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-all`}>
                                        <module.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <CardTitle className="text-xl">{module.title}</CardTitle>
                                    <CardDescription className="text-base">{module.description}</CardDescription>
                                    {module.available ? (
                                        <div className="flex items-center gap-2 text-success text-sm mt-2">
                                            <Zap className="w-4 h-4" />
                                            <span>Доступно</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-warning text-sm mt-2">
                                            <Activity className="w-4 h-4" />
                                            <span>У розробці</span>
                                        </div>
                                    )}
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Additional Sections */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Додатково</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {additionalSections.map((section) => (
                        <Link key={section.to} to={section.to}>
                            <Card className="h-full transition-all hover:scale-105 hover:border-secondary cursor-pointer group">
                                <CardHeader className="text-center">
                                    <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-all`}>
                                        <section.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                    <CardDescription className="text-sm">{section.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Статистика платформи</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <Card key={index} glass className="text-center p-6">
                            <div className="text-3xl font-bold gradient-text num mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-foreground-muted">{stat.label}</div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Data
const mainModules = [
    {
        title: 'Trading',
        description: 'Професійний трейдинг з графіками та аналізом ордербуків',
        icon: TrendingUp,
        color: 'bg-primary',
        to: '/app/trading',
        available: true,
    },
    {
        title: 'Portfolio',
        description: 'Відстеження портфоліо та PNL в реальному часі',
        icon: Wallet,
        color: 'bg-success',
        to: '/app/portfolio',
        available: true,
    },
    {
        title: 'Analytics',
        description: 'Детальна аналітика та ризик-менеджмент',
        icon: BarChart3,
        color: 'bg-info',
        to: '/app/analytics',
        available: true,
    },
    {
        title: 'Yield Farming',
        description: 'Знайдіть найкращі можливості для стейкінгу',
        icon: Sprout,
        color: 'bg-secondary',
        to: '/app/farming',
        available: false,
    },
    {
        title: 'Arbitrage',
        description: 'Сканер арбітражних можливостей між біржами',
        icon: ArrowLeftRight,
        color: 'bg-warning',
        to: '/app/arbitrage',
        available: false,
    },
    {
        title: 'Навчання',
        description: 'Курси та матеріали для трейдерів',
        icon: BookOpen,
        color: 'bg-danger',
        to: '/app/learning',
        available: false,
    },
]

const additionalSections = [
    {
        title: 'Блог/Пости',
        description: 'Новини та статті',
        icon: FileText,
        color: 'bg-gradient-to-br from-purple-500 to-pink-500',
        to: '/app/blog',
    },
    {
        title: 'Спільнота',
        description: 'Обговорення та чат',
        icon: Users,
        color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        to: '/app/community',
    },
    {
        title: 'Token Sales',
        description: 'Управління участю в IDO',
        icon: DollarSign,
        color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
        to: '/app/token-sales',
    },
    {
        title: 'Налаштування',
        description: 'Профіль та параметри',
        icon: Settings,
        color: 'bg-gradient-to-br from-gray-500 to-gray-700',
        to: '/app/settings',
    },
]

const stats = [
    { value: '10K+', label: 'Користувачів' },
    { value: '$50M+', label: 'Обсяг торгів' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Підтримка' },
]
