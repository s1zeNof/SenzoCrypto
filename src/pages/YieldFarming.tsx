import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export default function YieldFarming() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Yield Farming & Airdrops</h1>
                <p className="text-foreground-muted">
                    Discover staking opportunities and upcoming airdrops.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Ecosystems</CardTitle>
                    <CardDescription>Track farming opportunities across DeFi protocols</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground-muted">Coming soon: Ecosystem cards, APY calculator, airdrop scanner</p>
                </CardContent>
            </Card>
        </div>
    )
}
