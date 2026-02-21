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
            getCurrentTime: () => Time | null
            queueReplay: (time: Time) => void
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
    const pendingReplayTimeRef = useRef<Time | null>(null)
    const [isLoading, setIsLoading] = useState(false)

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
                    let index = fullDataRef.current.findIndex(d => (d.time as number) >= (time as number))
                    if (index === -1) index = fullDataRef.current.length - 1
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
                    pendingReplayTimeRef.current = null // cancel any queued restore
                    candleSeries.setData(fullDataRef.current)
                    chart.timeScale().fitContent()
                },
                getCurrentTime: () => {
                    const idx = replayIndexRef.current
                    if (idx < 0 || idx >= fullDataRef.current.length) return null
                    return fullDataRef.current[idx]?.time ?? null
                },
                queueReplay: (time: Time) => {
                    pendingReplayTimeRef.current = time
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

        // ── 1. Full-history REST fetch ───────────────────────────────────────────
        // Binance max per request = 1000. We chain backwards using `endTime`
        // until we get fewer than LIMIT candles (= start of exchange data).
        // Safety cap: MAX_PAGES × 1000 candles total.
        //   1m   → cap at 30 000 (~20 days)
        //   5m   → cap at 30 000 (~104 days)
        //   15m  → cap at 30 000 (~312 days)
        //   1h   → full BTC history ~70 000 candles (no cap hit)
        //   4h   → full BTC history ~18 000 candles (no cap hit)
        //   1d   → full BTC history ~3 000 candles  (no cap hit)
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const LIMIT = 1000
                const MAX_PAGES = 100 // hard safety cap
                let allCandles: { time: Time; open: number; high: number; low: number; close: number }[] = []
                let endTime: number | undefined = undefined

                for (let page = 0; page < MAX_PAGES; page++) {
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

                    allCandles = [...candles, ...allCandles]
                    endTime = data[0][0] - 1

                    // Fewer than LIMIT → we've reached the very first candle on exchange
                    if (data.length < LIMIT) break
                }

                if (cancelled) return

                // Sort by time (safety net) and deduplicate
                allCandles.sort((a, b) => (a.time as number) - (b.time as number))
                const seen = new Set<number>()
                allCandles = allCandles.filter(c => {
                    const t = c.time as number
                    if (seen.has(t)) return false
                    seen.add(t)
                    return true
                })

                fullDataRef.current = allCandles

                if (pendingReplayTimeRef.current !== null) {
                    // Timeframe switched during replay → restore at the saved time
                    const pendingTime = pendingReplayTimeRef.current as number
                    pendingReplayTimeRef.current = null
                    isReplayModeRef.current = true
                    let idx = allCandles.findIndex(d => (d.time as number) >= pendingTime)
                    if (idx === -1) idx = allCandles.length - 1
                    replayIndexRef.current = idx
                    candleSeriesRef.current?.setData(allCandles.slice(0, idx + 1))
                    chartRef.current?.timeScale().fitContent()
                    onDataUpdate?.(allCandles)
                } else if (!isReplayModeRef.current) {
                    candleSeriesRef.current?.setData(allCandles)
                    onDataUpdate?.(allCandles)
                }
            } catch (error) {
                if (!cancelled) console.error('Error fetching Binance data:', error)
            } finally {
                if (!cancelled) setIsLoading(false)
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
        <div className="w-full h-full relative">
            <div ref={chartContainerRef} className="w-full h-full" onDoubleClick={onDoubleClick} />
            {isLoading && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none z-10">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Завантаження даних...
                </div>
            )}
        </div>
    )
}
