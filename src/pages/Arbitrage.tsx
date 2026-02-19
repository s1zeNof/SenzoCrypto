import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export default function Arbitrage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Arbitrage</h1>
                <p className="text-foreground-muted">
                    Find price differences across exchanges and markets.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Arbitrage Opportunities</CardTitle>
                    <CardDescription>Real-time price comparison and profit calculator</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground-muted">Coming soon: CEX/DEX comparison, funding rate arbitrage</p>
                </CardContent>
            </Card>
        </div>
    )
}
