import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'
import { calculateMACD } from '@/utils/indicators'
import { Settings, X } from 'lucide-react'

interface MACDIndicatorProps {
    data: any[]
    settings?: { fast: number; slow: number; signal: number; colorFast?: string; colorSlow?: string; colorHistogram?: string }
    /** Explicit chart height in px — controlled by the pane wrapper in Simulator */
    height?: number
    onClose: () => void
    onSettingsClick?: () => void
}

export default function MACDIndicator({ data, settings: externalSettings, height = 150, onClose, onSettingsClick }: MACDIndicatorProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
    const macdSeriesRef      = useRef<ISeriesApi<'Line'>      | null>(null)
    const signalSeriesRef    = useRef<ISeriesApi<'Line'>      | null>(null)

    const settings = {
        fast:           externalSettings?.fast           ?? 12,
        slow:           externalSettings?.slow           ?? 26,
        signal:         externalSettings?.signal         ?? 9,
        colorFast:      externalSettings?.colorFast      ?? '#2962FF',
        colorSlow:      externalSettings?.colorSlow      ?? '#FF6D00',
        colorHistogram: externalSettings?.colorHistogram ?? '#26A69A',
    }

    // ── Create chart once on mount ────────────────────────────────────────────
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
            width:  chartContainerRef.current.clientWidth,
            height,
            timeScale:       { timeVisible: true, secondsVisible: false },
            rightPriceScale: { borderVisible: false },
        })

        histogramSeriesRef.current = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'right' })
        macdSeriesRef.current      = chart.addLineSeries({ color: settings.colorFast, lineWidth: 2, priceScaleId: 'right' })
        signalSeriesRef.current    = chart.addLineSeries({ color: settings.colorSlow, lineWidth: 2, priceScaleId: 'right' })

        chartRef.current = chart

        const onResize = () => {
            if (chartContainerRef.current)
                chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
        window.addEventListener('resize', onResize)

        return () => {
            window.removeEventListener('resize', onResize)
            chart.remove()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Update chart height whenever the pane is resized ─────────────────────
    useEffect(() => {
        if (chartRef.current && height > 0)
            chartRef.current.applyOptions({ height })
    }, [height])

    // ── Update data & style when props change ─────────────────────────────────
    useEffect(() => {
        if (!data || data.length === 0 || !chartRef.current) return

        const macdData = calculateMACD(
            data.map(d => ({ time: d.time, close: d.close })),
            settings.fast, settings.slow, settings.signal
        )
        if (!macdData || Array.isArray(macdData)) return

        macdSeriesRef.current?.applyOptions({ color: settings.colorFast })
        signalSeriesRef.current?.applyOptions({ color: settings.colorSlow })

        macdSeriesRef.current?.setData(macdData.macd.map((d: any) => ({ time: d.time as any, value: d.value })))
        signalSeriesRef.current?.setData(macdData.signal.map((d: any) => ({ time: d.time as any, value: d.value })))

        const colorized = macdData.histogram.map((d: any, i: number, arr: any[]) => {
            const prev = i > 0 ? arr[i - 1].value : 0
            const val  = d.value
            const color = val >= 0
                ? (val >= prev ? '#26A69A' : '#4DB6AC')
                : (val <  prev ? '#EF5350' : '#E57373')
            return { time: d.time as any, value: val, color }
        })
        histogramSeriesRef.current?.setData(colorized)
        chartRef.current.timeScale().fitContent()
    }, [data, settings.fast, settings.slow, settings.signal, settings.colorFast, settings.colorSlow])

    return (
        <div className="bg-background/50 relative group">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                <span className="text-xs font-bold text-gray-400 bg-surface/80 backdrop-blur-sm px-2 py-0.5 rounded">
                    MACD ({settings.fast}, {settings.slow}, {settings.signal})
                </span>
                {onSettingsClick && (
                    <button onClick={onSettingsClick} title="MACD Settings"
                        className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                        <Settings className="w-3 h-3 text-gray-500 hover:text-white" />
                    </button>
                )}
                <button onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3 text-gray-500 hover:text-white" />
                </button>
            </div>
            {/* LWC sets this div's height via inline style — do NOT add h-full here */}
            <div ref={chartContainerRef} className="w-full" />
        </div>
    )
}
