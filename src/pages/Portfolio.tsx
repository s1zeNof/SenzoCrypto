import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export default function Portfolio() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
                <p className="text-foreground-muted">
                    Track your crypto holdings and performance.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Holdings</CardTitle>
                    <CardDescription>Manage and track your crypto assets</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground-muted">Coming soon: Portfolio tracker with holdings and PNL</p>
                </CardContent>
            </Card>
        </div>
    )
}
