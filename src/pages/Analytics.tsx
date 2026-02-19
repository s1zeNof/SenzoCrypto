import PnLCharts from '@/components/analytics/PnLCharts'

export default function Analytics() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold mb-2">Аналітика</h1>
                <p className="text-foreground-muted">
                    Детальна статистика вашої торгової ефективності.
                </p>
            </div>

            <PnLCharts />
        </div>
    )
}
