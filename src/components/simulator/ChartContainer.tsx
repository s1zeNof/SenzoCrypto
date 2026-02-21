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

        let cancelled = false

        // ── 1. Paginated REST fetch: 3 pages × 1000 = 3000 candles ──────────────
        // Binance max per request = 1000. We chain requests using `endTime`
        // to fetch older history before the previous batch.
        // Result by timeframe:
        //   1m → ~2 days | 5m → ~10d | 15m → ~31d
        //   1h → ~125d   | 4h → ~1.4yr | 1d → ~8yr
        const fetchData = async () => {
            try {
                const LIMIT = 1000
                const PAGES = 3
                let allCandles: { time: Time; open: number; high: number; low: number; close: number }[] = []
                let endTime: number | undefined = undefined

                for (let page = 0; page < PAGES; page++) {
                    if (cancelled) return

                    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${LIMIT}`
                    if (endTime !== undefined) url += `&endTime=${endTime}`

                    const response = await fetch(url)
                    if (!response.ok || cancelled) break

                    const data: any[] = await response.json()
                    if (!data.length) break

                    const candles = data.map((d: any) => ({
                        time: d[0] / 1000 as Time,
                        open:  parseFloat(d[1]),
                        high:  parseFloat(d[2]),
                        low:   parseFloat(d[3]),
                        close: parseFloat(d[4]),
                    }))

                    // Prepend older candles before the current batch
                    allCandles = [...candles, ...allCandles]
                    // Next request: fetch candles ending just before the oldest candle
                    endTime = data[0][0] - 1

                    // If fewer than LIMIT returned, we've hit the start of history
                    if (data.length < LIMIT) break
                }

                if (cancelled) return

                // Sort by time (safety net) and deduplicate
                allCandles.sort((a, b) => (a.time as number) - (b.time as number))
                // Remove exact duplicates by time
                const seen = new Set<number>()
                allCandles = allCandles.filter(c => {
                    const t = c.time as number
                    if (seen.has(t)) return false
                    seen.add(t)
                    return true
                })

                fullDataRef.current = allCandles

                if (!isReplayModeRef.current) {
                    candleSeriesRef.current?.setData(allCandles)
                    onDataUpdate?.(allCandles)
                }
            } catch (error) {
                if (!cancelled) console.error('Error fetching Binance data:', error)
            }
        }

        fetchData()

        // ── 2. WebSocket Connection (Real-time, skipped in replay) ───────────────
        if (isReplayModeRef.current) return

        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`)

        ws.onmessage = (event) => {
            if (isReplayModeRef.current || cancelled) return

            const message = JSON.parse(event.data)
            const k = message.k

            const candle = {
                time:  k.t / 1000 as Time,
                open:  parseFloat(k.o),
                high:  parseFloat(k.h),
                low:   parseFloat(k.l),
                close: parseFloat(k.c),
            }

            candleSeriesRef.current?.update(candle)

            const lastFull = fullDataRef.current[fullDataRef.current.length - 1]
            if (lastFull && lastFull.time === candle.time) {
                fullDataRef.current[fullDataRef.current.length - 1] = candle
            } else {
                fullDataRef.current.push(candle)
            }
        }

        return () => {
            cancelled = true
            ws.close()
        }

    }, [symbol, interval])


    return (
        <div ref={chartContainerRef} className="w-full h-full" onDoubleClick={onDoubleClick} />
    )
}
