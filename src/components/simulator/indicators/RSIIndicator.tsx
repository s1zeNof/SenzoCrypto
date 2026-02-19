import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts'
import { calculateRSI } from '@/utils/indicators'
import { Settings } from 'lucide-react'

interface RSIIndicatorProps {
    data: any[]
    settings: any // Using any to support new complex settings structure
    onSettingsClick: () => void
}

export default function RSIIndicator({ data, settings, onSettingsClick }: RSIIndicatorProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Line"> | null>(null)

    // Level Refs
    const upperLevelRef = useRef<ISeriesApi<"Line"> | null>(null)
    const middleLevelRef = useRef<ISeriesApi<"Line"> | null>(null)
    const lowerLevelRef = useRef<ISeriesApi<"Line"> | null>(null)

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
            height: 150,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderVisible: false,
            },
        })

        // Initialize Level Series
        const commonLevelOptions = {
            lineWidth: 1 as any,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
        }

        upperLevelRef.current = chart.addLineSeries({ ...commonLevelOptions, color: 'rgba(255, 255, 255, 0.2)' })
        middleLevelRef.current = chart.addLineSeries({ ...commonLevelOptions, color: 'rgba(255, 255, 255, 0.1)' })
        lowerLevelRef.current = chart.addLineSeries({ ...commonLevelOptions, color: 'rgba(255, 255, 255, 0.2)' })

        // Initialize RSI Series
        const rsiSeries = chart.addLineSeries({
            color: settings.color || '#2962FF',
            lineWidth: (settings.lineWidth || 2) as any,
            priceLineVisible: true,
            lastValueVisible: true,
        })

        chartRef.current = chart
        seriesRef.current = rsiSeries

        // Set scale limits
        chart.priceScale('right').applyOptions({
            scaleMargins: {
                top: 0.1,
                bottom: 0.1,
            },
        })

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                })
            }
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            chart.remove()
        }
    }, [])

    // Update RSI data and Levels when data or settings change
    useEffect(() => {
        if (!seriesRef.current || !data || data.length === 0) return

        // Calculate RSI
        const candleData = data.map(d => ({ time: d.time, close: d.close }))
        const rsiData = calculateRSI(candleData, settings.period || 14)

        if (rsiData.length > 0) {
            seriesRef.current.setData(rsiData as any)
        }

        // Styles Update
        seriesRef.current.applyOptions({
            color: settings.color,
            lineWidth: (settings.lineWidth || 2) as any,
        })

        // Levels Update
        const t0 = data[0].time as any
        const t1 = data[data.length - 1].time as any

        // Defaults or Settings values
        const upperVal = settings.upperBandValue ?? settings.overbought ?? 70
        const lowerVal = settings.lowerBandValue ?? settings.oversold ?? 30
        const middleVal = settings.middleBandValue ?? 50

        // Colors
        const upperColor = settings.upperBandColor || 'rgba(255, 255, 255, 0.2)'
        const lowerColor = settings.lowerBandColor || 'rgba(255, 255, 255, 0.2)'
        const middleColor = settings.middleBandColor || 'rgba(255, 255, 255, 0.1)'

        if (upperLevelRef.current) {
            upperLevelRef.current.applyOptions({ color: upperColor })
            if (t0 && t1) upperLevelRef.current.setData([{ time: t0, value: upperVal }, { time: t1, value: upperVal }])
        }

        if (lowerLevelRef.current) {
            lowerLevelRef.current.applyOptions({ color: lowerColor })
            if (t0 && t1) lowerLevelRef.current.setData([{ time: t0, value: lowerVal }, { time: t1, value: lowerVal }])
        }

        if (middleLevelRef.current) {
            middleLevelRef.current.applyOptions({ color: middleColor })
            if (t0 && t1) middleLevelRef.current.setData([{ time: t0, value: middleVal }, { time: t1, value: middleVal }])
        }

    }, [data, settings])

    return (
        <div className="border-t border-border bg-background/50 relative">
            {/* Header */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 bg-surface/80 backdrop-blur-sm px-2 py-1 rounded">
                    RSI ({settings.period || 14})
                </span>
                <button
                    onClick={onSettingsClick}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="RSI Settings"
                >
                    <Settings className="w-3 h-3 text-gray-400 hover:text-white" />
                </button>
            </div>

            {/* Chart */}
            <div ref={chartContainerRef} className="w-full" />
        </div>
    )
}
