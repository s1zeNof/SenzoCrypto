import { Server, Cpu, HardDrive, Activity, TrendingUp, Zap, Globe, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useState } from 'react'

interface ComputeNode {
    id: string
    name: string
    status: 'online' | 'offline' | 'maintenance'
    region: string
    cpu: number
    memory: number
    storage: number
    uptime: number
    requests: number
}

export default function ComputeNodes() {
    const [nodes] = useState<ComputeNode[]>([
        {
            id: '1',
            name: 'EU-West-1',
            status: 'online',
            region: 'Europe',
            cpu: 45,
            memory: 62,
            storage: 38,
            uptime: 99.98,
            requests: 15420,
        },
        {
            id: '2',
            name: 'US-East-1',
            status: 'online',
            region: 'North America',
            cpu: 72,
            memory: 81,
            storage: 54,
            uptime: 99.95,
            requests: 23180,
        },
        {
            id: '3',
            name: 'Asia-Pacific-1',
            status: 'online',
            region: 'Asia',
            cpu: 38,
            memory: 51,
            storage: 42,
            uptime: 99.97,
            requests: 12340,
        },
        {
            id: '4',
            name: 'EU-Central-1',
            status: 'maintenance',
            region: 'Europe',
            cpu: 0,
            memory: 0,
            storage: 0,
            uptime: 99.92,
            requests: 0,
        },
    ])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'text-success'
            case 'offline':
                return 'text-danger'
            case 'maintenance':
                return 'text-warning'
            default:
                return 'text-foreground-muted'
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-success/20'
            case 'offline':
                return 'bg-danger/20'
            case 'maintenance':
                return 'bg-warning/20'
            default:
                return 'bg-surface'
        }
    }

    const totalNodes = nodes.length
    const onlineNodes = nodes.filter((n) => n.status === 'online').length
    const avgCpu = Math.round(
        nodes.reduce((sum, n) => sum + n.cpu, 0) / nodes.filter((n) => n.status === 'online').length
    )
    const totalRequests = nodes.reduce((sum, n) => sum + n.requests, 0)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-3">
                    <span className="gradient-text">Compute Nodes</span>
                </h1>
                <p className="text-foreground-muted text-lg">
                    Глобальна мережа обчислювальних вузлів для високошвидкісної торгівлі та аналітики
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-lg">
                                <Server className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground-muted">Всього вузлів</p>
                                <p className="text-2xl font-bold num">{totalNodes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/20 rounded-lg">
                                <Activity className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground-muted">Онлайн</p>
                                <p className="text-2xl font-bold num">{onlineNodes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-secondary/20 rounded-lg">
                                <Cpu className="w-6 h-6 text-secondary" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground-muted">Серд. CPU</p>
                                <p className="text-2xl font-bold num">{avgCpu}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-warning/20 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground-muted">Запитів/год</p>
                                <p className="text-2xl font-bold num">{totalRequests.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Низька затримка</h3>
                        <p className="text-sm text-foreground-muted">
                            Мінімальна затримка &lt;10ms для критичних торгових операцій
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mb-4">
                            <Globe className="w-6 h-6 text-success" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Глобальна мережа</h3>
                        <p className="text-sm text-foreground-muted">
                            Вузли в 15+ країнах для найкращої продуктивності
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="p-6">
                        <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-secondary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Висока доступність</h3>
                        <p className="text-sm text-foreground-muted">
                            99.9% uptime з автоматичним failover
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Nodes List */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Статус вузлів</CardTitle>
                    <CardDescription>Real-time моніторинг обчислювальних вузлів</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                className="p-4 bg-surface rounded-lg border border-border hover:border-border-hover transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusBg(
                                                node.status
                                            )}`}
                                        >
                                            <Server className={`w-5 h-5 ${getStatusColor(node.status)}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{node.name}</h4>
                                            <p className="text-sm text-foreground-muted">{node.region}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(
                                            node.status
                                        )} ${getStatusColor(node.status)}`}
                                    >
                                        {node.status === 'online' && 'Онлайн'}
                                        {node.status === 'offline' && 'Офлайн'}
                                        {node.status === 'maintenance' && 'Обслуговування'}
                                    </span>
                                </div>

                                {node.status === 'online' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Cpu className="w-4 h-4 text-foreground-muted" />
                                                <span className="text-xs text-foreground-muted">CPU</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${node.cpu}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold num">{node.cpu}%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <HardDrive className="w-4 h-4 text-foreground-muted" />
                                                <span className="text-xs text-foreground-muted">Memory</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-secondary rounded-full transition-all"
                                                        style={{ width: `${node.memory}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold num">{node.memory}%</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-foreground-muted mb-2">Uptime</p>
                                            <p className="text-sm font-semibold text-success num">
                                                {node.uptime}%
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-foreground-muted mb-2">Requests</p>
                                            <p className="text-sm font-semibold num">
                                                {node.requests.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {node.status === 'maintenance' && (
                                    <div className="text-sm text-warning">
                                        Вузол знаходиться на обслуговуванні. Очікуваний час відновлення: 30 хв
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Technical Specs */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Технічні характеристики</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-3">Апаратне забезпечення</h4>
                            <ul className="space-y-2 text-sm text-foreground-muted">
                                <li>• AMD EPYC 7763 64-Core Processor</li>
                                <li>• 512GB DDR4 ECC RAM</li>
                                <li>• 4TB NVMe SSD Storage</li>
                                <li>• 10Gbps Network Interface</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Програмне забезпечення</h4>
                            <ul className="space-y-2 text-sm text-foreground-muted">
                                <li>• Docker containerization</li>
                                <li>• Kubernetes orchestration</li>
                                <li>• Redis in-memory cache</li>
                                <li>• PostgreSQL database cluster</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
