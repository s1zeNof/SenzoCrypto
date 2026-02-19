import { useEffect, useRef } from 'react'
import { IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts'
import { calculateEMA, calculateBollingerBands, calculateSMA } from '@/utils/indicators'

interface ChartOverlaysProps {
    chart: IChartApi | null
    data: any[]
    activeIndicators: string[]
}

export default function ChartOverlays({ chart, data, activeIndicators }: ChartOverlaysProps) {
    // Refs for series to manage cleanup
    const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
    const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null)
    const bbMiddleRef = useRef<ISeriesApi<"Line"> | null>(null)

    // EMA Management
    useEffect(() => {
        if (!chart || !data.length) return

        if (activeIndicators.includes('ema')) {
            // Create if not exists
            if (!emaSeriesRef.current) {
                emaSeriesRef.current = chart.addLineSeries({
                    color: '#2962FF',
                    lineWidth: 2 as any,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    title: 'EMA 20', // Default
                })
            }

            // Update Data
            const emaData = calculateEMA(data, 20).map(d => ({ time: d.time as any, value: d.value }))
            emaSeriesRef.current.setData(emaData)

        } else {
            // Remove if exists
            if (emaSeriesRef.current) {
                chart.removeSeries(emaSeriesRef.current)
                emaSeriesRef.current = null
            }
        }
    }, [chart, data, activeIndicators])

    // SMA Management
    useEffect(() => {
        if (!chart || !data.length) return

        if (activeIndicators.includes('sma')) {
            if (!smaSeriesRef.current) {
                smaSeriesRef.current = chart.addLineSeries({
                    color: '#FF6D00',
                    lineWidth: 2 as any,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    title: 'SMA 20',
                })
            }

            const smaData = calculateSMA(data, 20).map(d => ({ time: d.time as any, value: d.value }))
            smaSeriesRef.current.setData(smaData)

        } else {
            if (smaSeriesRef.current) {
                chart.removeSeries(smaSeriesRef.current)
                smaSeriesRef.current = null
            }
        }
    }, [chart, data, activeIndicators])

    // Bollinger Bands Management
    useEffect(() => {
        if (!chart || !data.length) return

        if (activeIndicators.includes('bollinger')) {
            // Create series
            if (!bbUpperRef.current) {
                const commonOptions = {
                    lineWidth: 1 as any,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    color: '#26A69A'
                }
                bbUpperRef.current = chart.addLineSeries({ ...commonOptions, title: 'BB Upper' })
                bbLowerRef.current = chart.addLineSeries({ ...commonOptions, title: 'BB Lower' })
                bbMiddleRef.current = chart.addLineSeries({ ...commonOptions, color: '#FF5252', title: 'BB Basis' })
            }

            // Calc Data
            const bbData = calculateBollingerBands(data, 20, 2)

            bbUpperRef.current.setData(bbData.map(d => ({ time: d.time as any, value: d.upper })))
            bbLowerRef.current?.setData(bbData.map(d => ({ time: d.time as any, value: d.lower })))
            bbMiddleRef.current?.setData(bbData.map(d => ({ time: d.time as any, value: d.middle })))

        } else {
            // Remove
            if (bbUpperRef.current) {
                chart.removeSeries(bbUpperRef.current)
                chart.removeSeries(bbLowerRef.current!)
                chart.removeSeries(bbMiddleRef.current!)
                bbUpperRef.current = null
                bbLowerRef.current = null
                bbMiddleRef.current = null
            }
        }
    }, [chart, data, activeIndicators])

    // Cleanup all on unmount
    useEffect(() => {
        return () => {
            if (chart) {
                if (emaSeriesRef.current) chart.removeSeries(emaSeriesRef.current)
                if (smaSeriesRef.current) chart.removeSeries(smaSeriesRef.current)
                if (bbUpperRef.current) {
                    chart.removeSeries(bbUpperRef.current)
                    chart.removeSeries(bbLowerRef.current!)
                    chart.removeSeries(bbMiddleRef.current!)
                }
            }
        }
    }, [chart])

    return null
}
