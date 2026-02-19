import { Users, MessageCircle, Github, Twitter, BookOpen, Send, Heart, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export default function Community() {
    const socialLinks = [
        {
            name: 'Twitter (X)',
            handle: '@SynzaLabs',
            url: 'https://x.com/SynzaLabs',
            icon: <Twitter className="w-6 h-6" />,
            description: 'Слідкуйте за оновленнями та новинами',
            color: 'bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30',
            followers: '2.5K',
        },
        {
            name: 'GitHub',
            handle: '@SynzaLab',
            url: 'https://github.com/SynzaLab',
            icon: <Github className="w-6 h-6" />,
            description: 'Open source код та внески спільноти',
            color: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
            followers: '850',
        },
        {
            name: 'GitBook Docs',
            handle: 'Documentation',
            url: '#',
            icon: <BookOpen className="w-6 h-6" />,
            description: 'Повна документація та гайди',
            color: 'bg-primary/20 text-primary border-primary/30',
            followers: 'Coming Soon',
        },
        {
            name: 'Telegram',
            handle: '@SenzoChat',
            url: '#',
            icon: <Send className="w-6 h-6" />,
            description: 'Спільнота та підтримка 24/7',
            color: 'bg-[#0088cc]/20 text-[#0088cc] border-[#0088cc]/30',
            followers: '1.2K',
        },
    ]

    const communityStats = [
        { label: 'Активних користувачів', value: '12,500+', icon: Users, color: 'text-primary' },
        { label: 'Угод за день', value: '45,000+', icon: TrendingUp, color: 'text-success' },
        { label: 'Обсяг торгівлі', value: '$2.5M', icon: Heart, color: 'text-danger' },
        { label: 'Країн', value: '85+', icon: MessageCircle, color: 'text-warning' },
    ]

    const communityFeatures = [
        {
            title: '🎓 Навчальна спільнота',
            description: 'Діліться знаннями та вчіться у досвідчених трейдерів',
            benefits: ['Щотижневі вебінари', 'Гайди від експертів', 'Mentorship програма'],
        },
        {
            title: '🤝 Кооперація',
            description: 'Співпрацюйте з іншими трейдерами та розробниками',
            benefits: ['Спільні торгові стратегії', 'API інтеграції', 'Copy trading'],
        },
        {
            title: '🏆 Конкурси і винагороди',
            description: 'Беріть участь у торгових змаганнях',
            benefits: ['Щомісячні конкурси', 'Призовий фонд', 'Рейтинг трейдерів'],
        },
        {
            title: '💬 Підтримка спільноти',
            description: 'Отримуйте допомогу від команди та спільноти',
            benefits: ['24/7 чат підтримки', 'FAQ база знань', 'Швидкі відповіді'],
        },
    ]

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">
                    <span className="gradient-text">Senzo Community</span>
                </h1>
                <p className="text-foreground-muted text-xl max-w-3xl mx-auto">
                    Приєднуйтесь до глобальної спільноти крипто-трейдерів, розробників та ентузіастів
                </p>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {communityStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card key={index} className="glass-card">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-surface-elevated rounded-lg">
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-foreground-muted">{stat.label}</p>
                                        <p className="text-2xl font-bold num">{stat.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Social Links */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Приєднуйтесь до нас</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {socialLinks.map((link, index) => (
                        <Card key={index} className="glass-card group hover:scale-[1.02] transition-all">
                            <CardContent className="p-6">
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`p-4 rounded-xl ${link.color} group-hover:scale-110 transition-transform`}
                                        >
                                            {link.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                                                {link.name}
                                            </h3>
                                            <p className="text-foreground-muted text-sm mb-2">
                                                {link.handle}
                                            </p>
                                            <p className="text-foreground-subtle text-sm mb-3">
                                                {link.description}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-foreground-muted" />
                                                <span className="text-sm font-semibold num">
                                                    {link.followers}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Community Features */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Переваги спільноти</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {communityFeatures.map((feature, index) => (
                        <Card key={index} className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {feature.benefits.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                            <span className="text-foreground-muted">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Contributing Section */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Github className="w-6 h-6 text-primary" />
                        <CardTitle className="text-2xl">Долучайтесь до розробки</CardTitle>
                    </div>
                    <CardDescription>
                        Senzo - це open source проект. Ми вітаємо внески від спільноти!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">🔨 Розробка</h4>
                            <p className="text-sm text-foreground-muted mb-3">
                                Додавайте нові функції та виправляйте баги
                            </p>
                            <a
                                href="https://github.com/SynzaLab"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-sm hover:underline flex items-center gap-1"
                            >
                                GitHub Repository →
                            </a>
                        </div>

                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">📝 Документація</h4>
                            <p className="text-sm text-foreground-muted mb-3">
                                Покращуйте документацію та гайди
                            </p>
                            <a
                                href="#"
                                className="text-primary text-sm hover:underline flex items-center gap-1"
                            >
                                Contribute Docs →
                            </a>
                        </div>

                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">🌍 Переклад</h4>
                            <p className="text-sm text-foreground-muted mb-3">
                                Допомагайте з локалізацією платформи
                            </p>
                            <a
                                href="#"
                                className="text-primary text-sm hover:underline flex items-center gap-1"
                            >
                                Translation Guide →
                            </a>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-sm">
                            <strong>Новачок у open source?</strong> Не проблема! Ми маємо задачі з міткою
                            "good first issue" спеціально для початківців. Приєднуйтесь до нашого Discord,
                            щоб отримати допомогу від спільноти.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="glass-card">
                <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-3">Будьте в курсі подій</h2>
                    <p className="text-foreground-muted mb-6 max-w-2xl mx-auto">
                        Підпишіться на наш newsletter, щоб отримувати оновлення, новини та ексклюзивний
                        контент
                    </p>
                    <div className="flex gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                        />
                        <button className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg font-semibold transition-colors">
                            Підписатись
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Code of Conduct */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Правила спільноти</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-foreground-muted">
                        <p>
                            ✅ <strong>Будьте поважними</strong> - Ставтесь до інших з повагою та професіоналізмом
                        </p>
                        <p>
                            ✅ <strong>Допомагайте іншим</strong> - Діліться знаннями та досвідом
                        </p>
                        <p>
                            ✅ <strong>Конструктивна критика</strong> - Давайте зворотний зв'язок конструктивно
                        </p>
                        <p>
                            ❌ <strong>Заборонено</strong> - Спам, шахрайство, hate speech та маніпуляції ринком
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
