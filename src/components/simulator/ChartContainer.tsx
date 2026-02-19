import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CrosshairMode } from 'lightweight-charts'
import { calculateRSI } from '@/utils/indicators'
import type { Indicator } from './IndicatorsModal'

interface ChartContainerProps {
    symbol: string
    interval: string
    indicators?: Indicator[]
    onChartReady?: (
        chart: IChartApi,
        series: ISeriesApi<"Candlestick">,
        replayApi: {
            startReplay: (time: Time) => void
            nextCandle: () => void
            stopReplay: () => void
        }
    ) => void
    onDataUpdate?: (data: any[]) => void
    isMagnetEnabled?: boolean
    onDoubleClick?: () => void
}


export default function ChartContainer({ symbol, interval, onChartReady, onDataUpdate, isMagnetEnabled = false, onDoubleClick }: ChartContainerProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

    // Data Refs for Replay
    const fullDataRef = useRef<any[]>([])
    const isReplayModeRef = useRef(false)
    const replayIndexRef = useRef<number>(-1) // Track current replay candle index

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
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: 1, // Magnet mode
            }
        })

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        })

        chartRef.current = chart
        candleSeriesRef.current = candleSeries

        // Expose API with Replay methods
        if (onChartReady) {
            onChartReady(chart, candleSeries, {
                startReplay: (time: Time) => {
                    isReplayModeRef.current = true
                    const index = fullDataRef.current.findIndex(d => d.time === time)
                    if (index !== -1) {
                        replayIndexRef.current = index
                        const slicedData = fullDataRef.current.slice(0, index + 1)
                        candleSeries.setData(slicedData)
                        chart.timeScale().fitContent()
                    }
                },
                nextCandle: () => {
                    if (!isReplayModeRef.current) return
                    const nextIndex = replayIndexRef.current + 1
                    if (nextIndex < fullDataRef.current.length) {
                        replayIndexRef.current = nextIndex
                        candleSeries.update(fullDataRef.current[nextIndex])
                    }
                },
                stopReplay: () => {
                    isReplayModeRef.current = false
                    replayIndexRef.current = -1
                    candleSeries.setData(fullDataRef.current)
                    chart.timeScale().fitContent()
                }
            })
        }

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                })
            }
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(chartContainerRef.current)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
        }
    }, [])

    // Update Crosshair Mode
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.applyOptions({
                crosshair: {
                    mode: isMagnetEnabled ? CrosshairMode.Magnet : CrosshairMode.Normal,
                },
            })
        }
    }, [isMagnetEnabled])

    // Fetch Data & Real-time Updates
    useEffect(() => {
        if (!candleSeriesRef.current) return

        // 1. Initial Fetch (REST API)
        const fetchData = async () => {
            try {
                // Binance API: https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1000
                const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`)
                const data = await response.json()

                const candles = data.map((d: any) => ({
                    time: d[0] / 1000 as Time,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                }))

                fullDataRef.current = candles // Store full data for replay
                if (!isReplayModeRef.current) {
                    candleSeriesRef.current?.setData(candles)
                    onDataUpdate?.(candles) // Expose data to parent
                }
            } catch (error) {
                console.error('Error fetching Binance data:', error)
            }
        }

        fetchData()

        // 2. WebSocket Connection (Real-time)
        // Only connect if NOT in replay mode
        if (isReplayModeRef.current) return

        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`)

        ws.onmessage = (event) => {
            if (isReplayModeRef.current) return // Ignore WS updates in replay mode

            const message = JSON.parse(event.data)
            const k = message.k

            const candle = {
                time: k.t / 1000 as Time,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            }

            candleSeriesRef.current?.update(candle)

            // Update fullDataRef as well so replay has latest data if started later
            const lastFull = fullDataRef.current[fullDataRef.current.length - 1]
            if (lastFull && lastFull.time === candle.time) {
                fullDataRef.current[fullDataRef.current.length - 1] = candle
            } else {
                fullDataRef.current.push(candle)
            }
        }

        return () => {
            ws.close()
        }

    }, [symbol, interval])


    return (
        <div ref={chartContainerRef} className="w-full h-full" onDoubleClick={onDoubleClick} />
    )
}
