import { useMemo } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    ReferenceLine,
    Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { getUserTrades, type Trade } from '@/services/firebase'
import { useState, useEffect } from 'react'

export default function PnLCharts() {
    const { user } = useAuth()
    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadTrades()
        }
    }, [user])

    const loadTrades = async () => {
        if (!user) return
        const data = await getUserTrades(user.uid)
        // Sort trades by date ascending
        const sorted = data.sort((a, b) => {
            const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date)
            const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date)
            return dateA.getTime() - dateB.getTime()
        })
        setTrades(sorted)
        setLoading(false)
    }

    const chartData = useMemo(() => {
        if (trades.length === 0) return []

        const dailyData: Record<string, { date: string, dailyPnL: number, cumulativePnL: number }> = {}
        let cumulative = 0

        // Group by date
        trades.forEach(trade => {
            const tradeDate = trade.date.toDate ? trade.date.toDate() : new Date(trade.date)
            const dateKey = tradeDate.toISOString().split('T')[0]

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: dateKey,
                    dailyPnL: 0,
                    cumulativePnL: 0
                }
            }
            dailyData[dateKey].dailyPnL += trade.pnl
        })

        // Convert to array and calculate cumulative
        return Object.values(dailyData)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(day => {
                cumulative += day.dailyPnL
                return {
                    ...day,
                    cumulativePnL: cumulative
                }
            })
    }, [trades])

    if (loading) {
        return <div className="animate-pulse h-64 bg-surface rounded-xl"></div>
    }

    if (trades.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Аналіз PnL</CardTitle>
                    <CardDescription>Тут будуть ваші графіки прибутковості</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Ще немає даних про угоди
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Cumulative PnL Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Сукупний P&L (USD)</CardTitle>
                    <CardDescription>Загальний ріст вашого депозиту</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #333' }}
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('uk-UA')}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Сукупний PnL']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cumulativePnL"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Daily PnL Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Щоденний P&L</CardTitle>
                    <CardDescription>Прибуток та збиток по днях</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1b1e', border: '1px solid #333' }}
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('uk-UA')}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Денний PnL']}
                                />
                                <ReferenceLine y={0} stroke="#666" />
                                <Bar dataKey="dailyPnL">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.dailyPnL >= 0 ? '#22c55e' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
