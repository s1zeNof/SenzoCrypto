import {
    Code,
    Box,
    Blocks,
    FileCode,
    Terminal,
    Rocket,
    PackageOpen,
    Download,
    BookOpen,
    Github,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useState } from 'react'

interface SDKLanguage {
    id: string
    name: string
    icon: string
    description: string
    version: string
    installCommand: string
    features: string[]
}

export default function SDK() {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('typescript')

    const sdkLanguages: SDKLanguage[] = [
        {
            id: 'typescript',
            name: 'TypeScript/JavaScript',
            icon: '📘',
            description: 'Офіційний SDK для Node.js та браузерів',
            version: '2.4.1',
            installCommand: 'npm install @senzo/sdk',
            features: [
                'TypeScript типізація',
                'WebSocket real-time',
                'Promise-based API',
                'Tree-shaking support',
            ],
        },
        {
            id: 'python',
            name: 'Python',
            icon: '🐍',
            description: 'SDK для Python 3.8+',
            version: '1.8.3',
            installCommand: 'pip install senzo-sdk',
            features: ['Async/await підтримка', 'Type hints', 'Pandas інтеграція', 'Jupyter ready'],
        },
        {
            id: 'rust',
            name: 'Rust',
            icon: '🦀',
            description: 'Високопродуктивний SDK для Rust',
            version: '0.9.2',
            installCommand: 'cargo add senzo-sdk',
            features: ['Zero-cost abstractions', 'Memory safe', 'Ultra-low latency', 'Tokio async'],
        },
        {
            id: 'go',
            name: 'Go',
            icon: '🔷',
            description: 'SDK для Go 1.19+',
            version: '1.5.0',
            installCommand: 'go get github.com/senzo/sdk-go',
            features: ['Lightweight', 'Goroutine support', 'Context aware', 'Fast compilation'],
        },
    ]

    const currentSDK = sdkLanguages.find((sdk) => sdk.id === selectedLanguage) || sdkLanguages[0]

    const codeExamples = {
        typescript: `import { SenzoClient } from '@senzo/sdk';

// Ініціалізація клієнта
const client = new SenzoClient({
  apiKey: 'your_api_key',
  testnet: false
});

// Отримання ціни токену
const price = await client.getPrice('BTC/USDT');
console.log(\`BTC Price: \${price.last}\`);

// Виконання ордеру
const order = await client.createOrder({
  symbol: 'BTC/USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 45000
});

// WebSocket підписка
client.subscribe('ticker', { symbol: 'BTC/USDT' }, (data) => {
  console.log('New ticker:', data);
});`,
        python: `from senzo_sdk import SenzoClient

# Ініціалізація клієнта
client = SenzoClient(
    api_key='your_api_key',
    testnet=False
)

# Отримання ціни токену
price = await client.get_price('BTC/USDT')
print(f'BTC Price: {price.last}')

# Виконання ордеру
order = await client.create_order(
    symbol='BTC/USDT',
    type='limit',
    side='buy',
    amount=0.1,
    price=45000
)

# WebSocket підписка
async for ticker in client.subscribe_ticker('BTC/USDT'):
    print(f'New ticker: {ticker}')`,
        rust: `use senzo_sdk::{SenzoClient, OrderType, OrderSide};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Ініціалізація клієнта
    let client = SenzoClient::new("your_api_key", false);
    
    // Отримання ціни токену
    let price = client.get_price("BTC/USDT").await?;
    println!("BTC Price: {}", price.last);
    
    // Виконання ордеру
    let order = client.create_order(
        "BTC/USDT",
        OrderType::Limit,
        OrderSide::Buy,
        0.1,
        Some(45000.0)
    ).await?;
    
    Ok(())
}`,
        go: `package main

import (
    "fmt"
    "github.com/senzo/sdk-go"
)

func main() {
    // Ініціалізація клієнта
    client := senzo.NewClient("your_api_key", false)
    
    // Отримання ціни токену
    price, err := client.GetPrice("BTC/USDT")
    if err != nil {
        panic(err)
    }
    fmt.Printf("BTC Price: %f\\n", price.Last)
    
    // Виконання ордеру
    order, err := client.CreateOrder(&senzo.OrderParams{
        Symbol: "BTC/USDT",
        Type:   senzo.OrderTypeLimit,
        Side:   senzo.OrderSideBuy,
        Amount: 0.1,
        Price:  45000,
    })
}`,
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-3">
                    <span className="gradient-text">Senzo SDK</span>
                </h1>
                <p className="text-foreground-muted text-lg">
                    Потужні інструменти розробки для інтеграції з платформою Senzo
                </p>
            </div>

            {/* Quick Start */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card hover:scale-[1.02] transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Швидкий старт</h3>
                        <p className="text-sm text-foreground-muted">Інтеграція за 5 хвилин</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:scale-[1.02] transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary/30 transition-colors">
                            <BookOpen className="w-6 h-6 text-secondary" />
                        </div>
                        <h3 className="font-semibold mb-1">Документація</h3>
                        <p className="text-sm text-foreground-muted">Повна API reference</p>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:scale-[1.02] transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-success/30 transition-colors">
                            <Github className="w-6 h-6 text-success" />
                        </div>
                        <h3 className="font-semibold mb-1">GitHub</h3>
                        <p className="text-sm text-foreground-muted">Open source репозиторії</p>
                    </CardContent>
                </Card>
            </div>

            {/* Language Selection */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Виберіть мову програмування</CardTitle>
                    <CardDescription>SDK доступний для різних мов та платформ</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sdkLanguages.map((sdk) => (
                            <div
                                key={sdk.id}
                                onClick={() => setSelectedLanguage(sdk.id)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedLanguage === sdk.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-surface hover:border-border-hover'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{sdk.icon}</div>
                                <h4 className="font-semibold mb-1">{sdk.name}</h4>
                                <p className="text-xs text-foreground-muted mb-2">{sdk.description}</p>
                                <span className="text-xs px-2 py-1 bg-surface-elevated rounded num">
                                    v{sdk.version}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Installation */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-primary" />
                        <CardTitle>Встановлення</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-surface p-4 rounded-lg font-mono text-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-foreground-muted"># {currentSDK.name}</span>
                            <button className="text-xs px-3 py-1 bg-primary rounded hover:bg-primary-hover transition-colors">
                                Копіювати
                            </button>
                        </div>
                        <code className="text-primary">{currentSDK.installCommand}</code>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {currentSDK.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-success rounded-full" />
                                <span className="text-foreground-muted">{feature}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Code Example */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-secondary" />
                        <CardTitle>Приклад коду</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-[#0A0D14] p-6 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                            <code className="text-foreground font-mono">
                                {codeExamples[selectedLanguage as keyof typeof codeExamples]}
                            </code>
                        </pre>
                    </div>
                </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                            <Code className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">REST API</h3>
                        <p className="text-sm text-foreground-muted">
                            Повний доступ до всіх функцій через REST endpoints
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mb-4">
                            <Blocks className="w-6 h-6 text-success" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">WebSocket</h3>
                        <p className="text-sm text-foreground-muted">
                            Real-time потоки даних для цін, ордерів та балансів
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                            <Box className="w-6 h-6 text-secondary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Type Safety</h3>
                        <p className="text-sm text-foreground-muted">
                            Повна типізація для TypeScript, Python type hints та Rust
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                            <FileCode className="w-6 h-6 text-warning" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Error Handling</h3>
                        <p className="text-sm text-foreground-muted">
                            Розширена обробка помилок з детальними повідомленнями
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center mb-4">
                            <PackageOpen className="w-6 h-6 text-info" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Модульність</h3>
                        <p className="text-sm text-foreground-muted">
                            Використовуйте тільки потрібні модулі для мінімального розміру
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-danger/20 rounded-lg flex items-center justify-center mb-4">
                            <Rocket className="w-6 h-6 text-danger" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Висока продуктивність</h3>
                        <p className="text-sm text-foreground-muted">
                            Оптимізовано для мінімальної затримки та високої швидкості
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Resources */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Додаткові ресурси</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                API Reference
                            </h4>
                            <p className="text-sm text-foreground-muted">
                                Детальна документація всіх методів та параметрів
                            </p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Code Examples
                            </h4>
                            <p className="text-sm text-foreground-muted">
                                Готові приклади для різних use cases
                            </p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Github className="w-4 h-4" />
                                GitHub Repository
                            </h4>
                            <p className="text-sm text-foreground-muted">
                                Вихідний код та можливість contribute
                            </p>
                        </div>
                        <div className="p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Changelog
                            </h4>
                            <p className="text-sm text-foreground-muted">
                                Історія змін та оновлень SDK
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
