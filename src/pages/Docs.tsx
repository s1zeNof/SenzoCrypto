import { Book, Code, FileText, Search, ChevronRight, Rocket, Shield, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useState } from 'react'

interface DocSection {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    topics: { title: string; description: string }[]
}

export default function Docs() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSection, setSelectedSection] = useState<string | null>(null)

    const docSections: DocSection[] = [
        {
            id: 'getting-started',
            title: 'Початок роботи',
            description: 'Швидкий старт та базові концепції платформи',
            icon: <Rocket className="w-6 h-6" />,
            topics: [
                { title: 'Швидкий старт', description: 'Почніть працювати з платформою за 5 хвилин' },
                { title: 'Налаштування облікового запису', description: 'Конфігурація профілю та безпека' },
                { title: 'Перша транзакція', description: 'Виконайте свою першу криптовалютну операцію' },
                { title: 'Підключення гаманця', description: 'Інтеграція з Web3 гаманцями' },
            ],
        },
        {
            id: 'api',
            title: 'API Документація',
            description: 'REST API та WebSocket з\'єднання',
            icon: <Code className="w-6 h-6" />,
            topics: [
                { title: 'REST API', description: 'HTTP endpoints для торгівлі та даних' },
                { title: 'WebSocket API', description: 'Real-time потоки даних' },
                { title: 'Автентифікація', description: 'API ключі та OAuth2' },
                { title: 'Rate Limits', description: 'Обмеження запитів та best practices' },
            ],
        },
        {
            id: 'trading',
            title: 'Торгівля',
            description: 'Продвинуті торгові стратегії та інструменти',
            icon: <Zap className="w-6 h-6" />,
            topics: [
                { title: 'Типи ордерів', description: 'Market, Limit, Stop-Loss та інші' },
                { title: 'Технічний аналіз', description: 'Індикатори та графіки' },
                { title: 'Автоматизація', description: 'Торгові боти та стратегії' },
                { title: 'Управління ризиками', description: 'Position sizing та hedging' },
            ],
        },
        {
            id: 'security',
            title: 'Безпека',
            description: 'Захист активів та конфіденційності',
            icon: <Shield className="w-6 h-6" />,
            topics: [
                { title: 'Двофакторна автентифікація', description: '2FA та безпека облікового запису' },
                { title: 'Холодне зберігання', description: 'Hardware wallets та offline storage' },
                { title: 'Smart Contract Security', description: 'Перевірка безпеки контрактів' },
                { title: 'Best Practices', description: 'Рекомендації з безпеки' },
            ],
        },
        {
            id: 'defi',
            title: 'DeFi',
            description: 'Децентралізовані фінанси та протоколи',
            icon: <FileText className="w-6 h-6" />,
            topics: [
                { title: 'Yield Farming', description: 'Стратегії фармінгу та пули' },
                { title: 'Staking', description: 'Proof of Stake та винагороди' },
                { title: 'Liquidity Pools', description: 'AMM та надання ліквідності' },
                { title: 'Governance', description: 'DAO та токени управління' },
            ],
        },
    ]

    const filteredSections = docSections.filter(
        (section) =>
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.topics.some((topic) =>
                topic.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
    )

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-3">
                    <span className="gradient-text">Документація Senzo</span>
                </h1>
                <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
                    Повна документація для роботи з платформою, API та торговими інструментами
                </p>
            </div>

            {/* Search Bar */}
            <Card className="glass-card">
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Пошук в документації..."
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-foreground"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="glass-card hover:scale-[1.02] transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Швидкий старт</h3>
                        <p className="text-sm text-foreground-muted">Почніть за 5 хвилин</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:scale-[1.02] transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary/30 transition-colors">
                            <Code className="w-6 h-6 text-secondary" />
                        </div>
                        <h3 className="font-semibold mb-1">API Reference</h3>
                        <p className="text-sm text-foreground-muted">Вся документація API</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:scale-[1.02] transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-success/30 transition-colors">
                            <Book className="w-6 h-6 text-success" />
                        </div>
                        <h3 className="font-semibold mb-1">Гайди</h3>
                        <p className="text-sm text-foreground-muted">Покрокові інструкції</p>
                    </CardContent>
                </Card>
            </div>

            {/* Documentation Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSections.map((section) => (
                    <Card key={section.id} className="glass-card group">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    {section.icon}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl mb-2">{section.title}</CardTitle>
                                    <CardDescription>{section.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {section.topics.map((topic, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group/item"
                                    >
                                        <div>
                                            <h4 className="font-medium text-sm mb-1 group-hover/item:text-primary transition-colors">
                                                {topic.title}
                                            </h4>
                                            <p className="text-xs text-foreground-muted">
                                                {topic.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-foreground-muted group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Additional Resources */}
            <Card className="glass-card mt-8">
                <CardHeader>
                    <CardTitle>Додаткові ресурси</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">📚 Бібліотека знань</h4>
                            <p className="text-sm text-foreground-muted">
                                Детальні статті та гайди з криптовалют
                            </p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">💬 Спільнота</h4>
                            <p className="text-sm text-foreground-muted">
                                Discord, Telegram та форум підтримки
                            </p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">🎥 Відеоуроки</h4>
                            <p className="text-sm text-foreground-muted">
                                Навчальні відео та вебінари
                            </p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg">
                            <h4 className="font-semibold mb-2">🔄 Changelog</h4>
                            <p className="text-sm text-foreground-muted">
                                Останні оновлення та нові функції
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
