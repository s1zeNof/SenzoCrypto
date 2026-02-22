import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, HistogramSeriesPartialOptions } from 'lightweight-charts'
import { calculateMACD } from '@/utils/indicators'
import { Settings, X } from 'lucide-react'


interface MACDIndicatorProps {
    data: any[]
    settings?: { fast: number; slow: number; signal: number; colorFast?: string; colorSlow?: string; colorHistogram?: string }
    onClose: () => void
    onSettingsClick?: () => void
}

export default function MACDIndicator({ data, settings: externalSettings, onClose, onSettingsClick }: MACDIndicatorProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)

    // Series Refs
    const histogramSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
    const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const signalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)

    // Use external settings or defaults
    const settings = {
        fast: externalSettings?.fast ?? 12,
        slow: externalSettings?.slow ?? 26,
        signal: externalSettings?.signal ?? 9,
        colorFast: externalSettings?.colorFast ?? '#2962FF',
        colorSlow: externalSettings?.colorSlow ?? '#FF6D00',
        colorHistogram: externalSettings?.colorHistogram ?? '#26A69A',
    }

    useEffect(() => {
        if (!chartContainerRef.current) return

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#D9D9D9',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 150,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderVisible: false,
            },
        })

        // 1. Histogram
        const histogramSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: 'right', // Share scale
        })

        // 2. MACD Line
        const macdSeries = chart.addLineSeries({
            color: settings.colorFast,
            lineWidth: 2,
            priceScaleId: 'right',
        })

        // 3. Signal Line
        const signalSeries = chart.addLineSeries({
            color: settings.colorSlow,
            lineWidth: 2,
            priceScaleId: 'right',
        })

        chartRef.current = chart
        histogramSeriesRef.current = histogramSeries
        macdSeriesRef.current = macdSeries
        signalSeriesRef.current = signalSeries

        // ResizeObserver keeps the chart in sync when the pane is dragged to a new height
        const ro = new ResizeObserver(() => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                })
            }
        })
        ro.observe(chartContainerRef.current)

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }

        window.addEventListener('resize', handleResize)

        return () => {
            ro.disconnect()
            window.removeEventListener('resize', handleResize)
            chart.remove()
        }
    }, [])

    useEffect(() => {
        if (!data || data.length === 0 || !chartRef.current) return

        const candleData = data.map(d => ({ time: d.time, close: d.close }))
        const macdData = calculateMACD(candleData, settings.fast, settings.slow, settings.signal)

        if (!macdData || Array.isArray(macdData)) return

        // Update line colors when settings change
        macdSeriesRef.current?.applyOptions({ color: settings.colorFast })
        signalSeriesRef.current?.applyOptions({ color: settings.colorSlow })

        // Update data
        macdSeriesRef.current?.setData(macdData.macd.map((d: any) => ({ time: d.time as any, value: d.value })))
        signalSeriesRef.current?.setData(macdData.signal.map((d: any) => ({ time: d.time as any, value: d.value })))

        // Colorize Histogram based on value
        const colorizedHistogram = macdData.histogram.map((d: any, i: number, arr: any[]) => {
            const prev = i > 0 ? arr[i - 1].value : 0
            const val = d.value
            let color = '#26A69A'

            if (val >= 0) {
                color = val >= prev ? '#26A69A' : '#4DB6AC'
            } else {
                color = val < prev ? '#EF5350' : '#E57373'
            }

            return { time: d.time as any, value: val, color }
        })

        histogramSeriesRef.current?.setData(colorizedHistogram)
        chartRef.current.timeScale().fitContent()

    }, [data, settings.fast, settings.slow, settings.signal, settings.colorFast, settings.colorSlow])

    return (
        <div className="bg-background/50 relative group h-full">
            {/* Header */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 bg-surface/80 backdrop-blur-sm px-2 py-1 rounded">
                    MACD ({settings.fast}, {settings.slow}, {settings.signal})
                </span>
                {onSettingsClick && (
                    <button
                        onClick={onSettingsClick}
                        className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="MACD Settings"
                    >
                        <Settings className="w-3 h-3 text-gray-400 hover:text-white" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                    <X className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
            </div>
            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    )
}
