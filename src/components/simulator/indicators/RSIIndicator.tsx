import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts'
import { calculateRSI } from '@/utils/indicators'
import { Settings } from 'lucide-react'

interface RSIIndicatorProps {
    data: any[]
    settings: any
    /** Explicit chart height in px — controlled by the pane wrapper in Simulator */
    height?: number
    onSettingsClick: () => void
}

export default function RSIIndicator({ data, settings, height = 150, onSettingsClick }: RSIIndicatorProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
    const upperLevelRef = useRef<ISeriesApi<'Line'> | null>(null)
    const middleLevelRef = useRef<ISeriesApi<'Line'> | null>(null)
    const lowerLevelRef = useRef<ISeriesApi<'Line'> | null>(null)

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
            width: chartContainerRef.current.clientWidth,
            height,
            timeScale: { timeVisible: true, secondsVisible: false },
            rightPriceScale: { borderVisible: false },
        })

        const commonLevel = {
            lineWidth: 1 as any,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
        }
        upperLevelRef.current  = chart.addLineSeries({ ...commonLevel, color: 'rgba(255, 255, 255, 0.2)' })
        middleLevelRef.current = chart.addLineSeries({ ...commonLevel, color: 'rgba(255, 255, 255, 0.1)' })
        lowerLevelRef.current  = chart.addLineSeries({ ...commonLevel, color: 'rgba(255, 255, 255, 0.2)' })

        const rsiSeries = chart.addLineSeries({
            color: settings.color || '#2962FF',
            lineWidth: (settings.lineWidth || 2) as any,
            priceLineVisible: true,
            lastValueVisible: true,
        })

        chartRef.current  = chart
        seriesRef.current = rsiSeries

        chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })

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
    // lightweight-charts controls the container div's inline height, so we must
    // drive it via applyOptions rather than CSS h-full (which LWC would override).
    useEffect(() => {
        if (chartRef.current && height > 0)
            chartRef.current.applyOptions({ height })
    }, [height])

    // ── Update data & style when props change ─────────────────────────────────
    useEffect(() => {
        if (!seriesRef.current || !data || data.length === 0) return

        const rsiData = calculateRSI(
            data.map(d => ({ time: d.time, close: d.close })),
            settings.period || 14
        )
        if (rsiData.length > 0) seriesRef.current.setData(rsiData as any)

        seriesRef.current.applyOptions({
            color: settings.color,
            lineWidth: (settings.lineWidth || 2) as any,
        })

        const t0 = data[0].time as any
        const t1 = data[data.length - 1].time as any
        const upperVal  = settings.upperBandValue  ?? settings.overbought ?? 70
        const lowerVal  = settings.lowerBandValue  ?? settings.oversold   ?? 30
        const middleVal = settings.middleBandValue ?? 50

        if (upperLevelRef.current) {
            upperLevelRef.current.applyOptions({ color: settings.upperBandColor  || 'rgba(255,255,255,0.2)' })
            if (t0 && t1) upperLevelRef.current.setData([{ time: t0, value: upperVal  }, { time: t1, value: upperVal  }])
        }
        if (lowerLevelRef.current) {
            lowerLevelRef.current.applyOptions({ color: settings.lowerBandColor  || 'rgba(255,255,255,0.2)' })
            if (t0 && t1) lowerLevelRef.current.setData([{ time: t0, value: lowerVal  }, { time: t1, value: lowerVal  }])
        }
        if (middleLevelRef.current) {
            middleLevelRef.current.applyOptions({ color: settings.middleBandColor || 'rgba(255,255,255,0.1)' })
            if (t0 && t1) middleLevelRef.current.setData([{ time: t0, value: middleVal }, { time: t1, value: middleVal }])
        }
    }, [data, settings])

    return (
        <div className="bg-background/50 relative">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                <span className="text-xs font-bold text-gray-400 bg-surface/80 backdrop-blur-sm px-2 py-0.5 rounded">
                    RSI ({settings.period || 14})
                </span>
                <button onClick={onSettingsClick} title="RSI Settings"
                    className="p-1 hover:bg-white/10 rounded transition-colors">
                    <Settings className="w-3 h-3 text-gray-500 hover:text-white" />
                </button>
            </div>
            {/* LWC sets this div's height via inline style — do NOT add h-full here */}
            <div ref={chartContainerRef} className="w-full" />
        </div>
    )
}
