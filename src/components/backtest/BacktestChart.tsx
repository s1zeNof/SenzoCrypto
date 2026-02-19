import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import ChartContainer from '@/components/simulator/ChartContainer'
import {
    addBacktestTrade,
    type BacktestTrade,
} from '@/services/firebase'
import { calculateBacktestStats } from '@/utils/backtestStats'
import {
    Play, Square, SkipForward, ChevronDown, TrendingUp, TrendingDown,
    Search, Loader2
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivePosition {
    side: 'long' | 'short'
    entryPrice: number
    size: number
    stopLoss?: number
    takeProfit?: number
    entryTime: Date
}

interface ReplayApi {
    startReplay: (time: Time) => void
    nextCandle: () => void
    stopReplay: () => void
}

interface Props {
    userId: string
    strategyName: string
    trades: BacktestTrade[]
    onTradeSaved: (trade: BacktestTrade) => void
}

const INTERVALS = ['1m','5m','15m','30m','1h','4h','1d','1w']

const POPULAR_SYMBOLS = [
    'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
    'ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function LivePnl({ pos, price }: { pos: ActivePosition; price: number }) {
    const diff = pos.side === 'long' ? price - pos.entryPrice : pos.entryPrice - price
    const pnl  = (diff / pos.entryPrice) * pos.size
    const color = pnl >= 0 ? 'text-green-400' : 'text-red-400'
    return (
        <span className={`font-mono font-bold text-sm ${color}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT
        </span>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BacktestChart({ userId, strategyName, trades, onTradeSaved }: Props) {
    // Chart refs
    const chartApiRef   = useRef<IChartApi | null>(null)
    const seriesApiRef  = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const replayApiRef  = useRef<ReplayApi | null>(null)
    const replayIdxRef  = useRef<number>(-1)
    const fullDataRef   = useRef<any[]>([])
    const markersRef    = useRef<any[]>([])

    // Price lines refs
    const entryLineRef = useRef<any>(null)
    const slLineRef    = useRef<any>(null)
    const tpLineRef    = useRef<any>(null)

    // Chart controls
    const [symbol, setSymbol]     = useState('BTCUSDT')
    const [interval, setInterval] = useState('1h')
    const [symbolSearch, setSymbolSearch]       = useState('')
    const [symbolResults, setSymbolResults]     = useState<string[]>([])
    const [showSymbolDrop, setShowSymbolDrop]   = useState(false)
    const [isSearching, setIsSearching]         = useState(false)

    // Replay state
    const [isReplayMode, setIsReplayMode]           = useState(false)
    const [isSelectingStart, setIsSelectingStart]   = useState(false)
    const isSelectingRef = useRef(false)

    // Position state
    const [position, setPosition]   = useState<ActivePosition | null>(null)
    const positionRef               = useRef<ActivePosition | null>(null)
    const [capital, setCapital]     = useState('1000')
    const [slPrice, setSlPrice]     = useState('')
    const [tpPrice, setTpPrice]     = useState('')
    const [currentPrice, setCurrentPrice] = useState(0)
    const currentPriceRef = useRef(0)

    // Close modal
    const [showCloseModal, setShowCloseModal] = useState(false)
    const [closeNotes, setCloseNotes]         = useState('')
    const [isSaving, setIsSaving]             = useState(false)

    // Stats
    const stats = useMemo(() => calculateBacktestStats(trades), [trades])

    // ── Symbol search ─────────────────────────────────────────────────────────

    const searchSymbols = useCallback(async (q: string) => {
        if (q.length < 2) { setSymbolResults([]); return }
        setIsSearching(true)
        try {
            const res  = await fetch('https://api.binance.com/api/v3/exchangeInfo')
            const data = await res.json()
            const all: string[] = data.symbols
                .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
                .map((s: any) => s.symbol)
            setSymbolResults(all.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 20))
        } catch { setSymbolResults([]) }
        finally { setIsSearching(false) }
    }, [])

    useEffect(() => {
        const t = setTimeout(() => searchSymbols(symbolSearch), 300)
        return () => clearTimeout(t)
    }, [symbolSearch, searchSymbols])

    // ── Track current price via crosshair ─────────────────────────────────────

    useEffect(() => {
        const chart = chartApiRef.current
        if (!chart) return
        const handler = (param: any) => {
            if (param.seriesData && seriesApiRef.current) {
                const d = param.seriesData.get(seriesApiRef.current) as any
                if (d?.close) {
                    currentPriceRef.current = d.close
                    setCurrentPrice(d.close)
                }
            }
        }
        chart.subscribeCrosshairMove(handler)
        return () => chart.unsubscribeCrosshairMove(handler)
    }, [chartApiRef.current])

    // ── Replay markers ────────────────────────────────────────────────────────

    const refreshMarkers = useCallback(() => {
        seriesApiRef.current?.setMarkers(markersRef.current)
    }, [])

    // ── Chart ready callback ──────────────────────────────────────────────────

    const handleChartReady = useCallback((
        chart: IChartApi,
        series: ISeriesApi<'Candlestick'>,
        api: ReplayApi
    ) => {
        chartApiRef.current  = chart
        seriesApiRef.current = series
        replayApiRef.current = api

        // Subscribe to click for replay start selection
        chart.subscribeClick((param: any) => {
            if (!isSelectingRef.current || !param.time) return
            replayApiRef.current?.startReplay(param.time as Time)
            setIsSelectingStart(false)
            isSelectingRef.current = false
            setIsReplayMode(true)
        })

        // Track crosshair price
        chart.subscribeCrosshairMove((param: any) => {
            if (param.seriesData) {
                const d = param.seriesData.get(series) as any
                if (d?.close) {
                    currentPriceRef.current = d.close
                    setCurrentPrice(d.close)
                }
            }
        })
    }, [])

    const handleDataUpdate = useCallback((data: any[]) => {
        fullDataRef.current = data
        if (data.length > 0) {
            const last = data[data.length - 1]
            currentPriceRef.current = last.close
            setCurrentPrice(last.close)
        }
    }, [])

    // ── Replay controls ───────────────────────────────────────────────────────

    const startSelectingReplayStart = () => {
        isSelectingRef.current = true
        setIsSelectingStart(true)
        setIsReplayMode(false)
    }

    const nextCandle = () => {
        replayApiRef.current?.nextCandle()
        replayIdxRef.current += 1
        // Update current price to latest candle close
        const idx = replayIdxRef.current
        if (fullDataRef.current[idx]) {
            const close = fullDataRef.current[idx].close
            currentPriceRef.current = close
            setCurrentPrice(close)
            // Auto-close on SL/TP hit
            checkAutoClose(close)
        }
        refreshMarkers()
    }

    const stopReplay = () => {
        replayApiRef.current?.stopReplay()
        replayIdxRef.current = -1
        setIsReplayMode(false)
        setIsSelectingStart(false)
        isSelectingRef.current = false
        // Remove price lines if position open
        if (positionRef.current) {
            clearPriceLines()
            setPosition(null)
            positionRef.current = null
        }
        markersRef.current = []
        refreshMarkers()
    }

    // ── Price lines helpers ───────────────────────────────────────────────────

    const clearPriceLines = () => {
        const series = seriesApiRef.current as any
        if (!series) return
        if (entryLineRef.current) { try { series.removePriceLine(entryLineRef.current) } catch {} ; entryLineRef.current = null }
        if (slLineRef.current)    { try { series.removePriceLine(slLineRef.current) }    catch {} ; slLineRef.current = null }
        if (tpLineRef.current)    { try { series.removePriceLine(tpLineRef.current) }    catch {} ; tpLineRef.current = null }
    }

    // ── Auto close on SL/TP ───────────────────────────────────────────────────

    const checkAutoClose = (price: number) => {
        const pos = positionRef.current
        if (!pos) return
        let hit = false
        if (pos.stopLoss) {
            if (pos.side === 'long'  && price <= pos.stopLoss) hit = true
            if (pos.side === 'short' && price >= pos.stopLoss) hit = true
        }
        if (pos.takeProfit) {
            if (pos.side === 'long'  && price >= pos.takeProfit) hit = true
            if (pos.side === 'short' && price <= pos.takeProfit) hit = true
        }
        if (hit) {
            doClosePosition(price, 'SL/TP hit (auto)')
        }
    }

    // ── Open position ─────────────────────────────────────────────────────────

    const openPosition = (side: 'long' | 'short') => {
        if (!isReplayMode || positionRef.current) return
        const idx   = replayIdxRef.current
        const candle = fullDataRef.current[idx] ?? fullDataRef.current[fullDataRef.current.length - 1]
        if (!candle) return

        const entryPrice = candle.close
        const size       = parseFloat(capital) || 1000
        const sl         = slPrice ? parseFloat(slPrice) : undefined
        const tp         = tpPrice ? parseFloat(tpPrice) : undefined

        const pos: ActivePosition = { side, entryPrice, size, stopLoss: sl, takeProfit: tp, entryTime: new Date(candle.time * 1000) }
        setPosition(pos)
        positionRef.current = pos

        // Draw price lines on candlestick series
        const series = seriesApiRef.current as any
        if (series) {
            entryLineRef.current = series.createPriceLine({
                price: entryPrice,
                color: side === 'long' ? '#10B981' : '#EF4444',
                lineWidth: 2, lineStyle: 0,
                axisLabelVisible: true,
                title: `Entry ${side === 'long' ? 'LONG' : 'SHORT'}`,
            })
            if (sl) slLineRef.current = series.createPriceLine({
                price: sl, color: '#EF4444', lineWidth: 1, lineStyle: 2,
                axisLabelVisible: true, title: 'SL',
            })
            if (tp) tpLineRef.current = series.createPriceLine({
                price: tp, color: '#10B981', lineWidth: 1, lineStyle: 2,
                axisLabelVisible: true, title: 'TP',
            })
        }

        // Add entry marker
        const newMarker = {
            time: candle.time as Time,
            position: side === 'long' ? 'belowBar' : 'aboveBar',
            color: side === 'long' ? '#10B981' : '#EF4444',
            shape: side === 'long' ? 'arrowUp' : 'arrowDown',
            text: `${side === 'long' ? '▲ LONG' : '▼ SHORT'} @${entryPrice.toFixed(2)}`,
        }
        markersRef.current = [...markersRef.current, newMarker]
        seriesApiRef.current?.setMarkers(markersRef.current)
    }

    // ── Close position ────────────────────────────────────────────────────────

    const doClosePosition = async (exitPrice: number, notes: string) => {
        const pos = positionRef.current
        if (!pos) return

        const idx    = replayIdxRef.current
        const candle = fullDataRef.current[idx] ?? fullDataRef.current[fullDataRef.current.length - 1]

        const diff      = pos.side === 'long' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice
        const pnl       = (diff / pos.entryPrice) * pos.size
        const risk      = pos.stopLoss
            ? Math.abs(pos.side === 'long' ? pos.entryPrice - pos.stopLoss : pos.stopLoss - pos.entryPrice)
            : 0
        const rMultiple = risk > 0 ? diff / risk : 0
        const status: BacktestTrade['status'] = pnl > 0.001 ? 'win' : pnl < -0.001 ? 'loss' : 'breakeven'

        const trade: Omit<BacktestTrade, 'id' | 'createdAt'> = {
            userId, strategyName,
            pair: symbol, timeframe: interval,
            side: pos.side, entryPrice: pos.entryPrice, exitPrice,
            stopLoss: pos.stopLoss, takeProfit: pos.takeProfit,
            size: pos.size, pnl: parseFloat(pnl.toFixed(2)),
            rMultiple: parseFloat(rMultiple.toFixed(2)), status,
            entryTime: pos.entryTime, exitTime: new Date((candle?.time ?? Date.now() / 1000) * 1000),
            notes: notes || undefined,
        }

        setIsSaving(true)
        try {
            const id = await addBacktestTrade(userId, trade)
            onTradeSaved({ ...trade, id, createdAt: new Date() })
        } catch (e) {
            console.error(e)
        } finally {
            setIsSaving(false)
        }

        // Add close marker
        if (candle) {
            const closeMarker = {
                time: candle.time as Time,
                position: pos.side === 'long' ? 'aboveBar' : 'belowBar',
                color: pnl >= 0 ? '#10B981' : '#EF4444',
                shape: 'circle',
                text: `Close ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}$`,
            }
            markersRef.current = [...markersRef.current, closeMarker]
            seriesApiRef.current?.setMarkers(markersRef.current)
        }

        clearPriceLines()
        setPosition(null)
        positionRef.current = null
        setShowCloseModal(false)
        setCloseNotes('')
    }

    const handleCloseClick = () => {
        if (!positionRef.current) return
        setShowCloseModal(true)
    }

    // ── Render ────────────────────────────────────────────────────────────────

    const canOpen = isReplayMode && !position

    return (
        <div className="h-full flex flex-col overflow-hidden">

            {/* ── Top bar ── */}
            <div className="h-12 flex items-center gap-3 px-4 bg-surface border-b border-border flex-shrink-0 overflow-x-auto">

                {/* Symbol selector */}
                <div className="relative flex-shrink-0">
                    <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-lg px-2 py-1 cursor-pointer"
                        onClick={() => setShowSymbolDrop(v => !v)}>
                        <span className="text-sm font-bold text-white">{symbol}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                    {showSymbolDrop && (
                        <div className="absolute top-9 left-0 z-50 bg-surface border border-border rounded-xl shadow-2xl w-56 overflow-hidden">
                            <div className="p-2 border-b border-border flex items-center gap-2">
                                <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <input
                                    autoFocus
                                    className="bg-transparent text-sm text-white outline-none w-full placeholder-gray-500"
                                    placeholder="Пошук..."
                                    value={symbolSearch}
                                    onChange={e => setSymbolSearch(e.target.value)}
                                />
                                {isSearching && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {(symbolSearch.length >= 2 ? symbolResults : POPULAR_SYMBOLS).map(s => (
                                    <button key={s} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover text-white"
                                        onClick={() => { setSymbol(s); setShowSymbolDrop(false); setSymbolSearch('') }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Interval buttons */}
                <div className="flex gap-1 flex-shrink-0">
                    {INTERVALS.map(iv => (
                        <button key={iv}
                            onClick={() => setInterval(iv)}
                            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                interval === iv
                                    ? 'bg-primary text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                            }`}>
                            {iv}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-border flex-shrink-0" />

                {/* Replay controls */}
                {!isReplayMode && !isSelectingStart && (
                    <button onClick={startSelectingReplayStart}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs rounded-lg font-medium flex-shrink-0">
                        <Play className="w-3 h-3" /> Replay
                    </button>
                )}
                {isSelectingStart && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-yellow-400 animate-pulse font-medium">
                            ← Клікни на свічку для старту
                        </span>
                        <button onClick={() => { setIsSelectingStart(false); isSelectingRef.current = false }}
                            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-surface-hover">
                            Скасувати
                        </button>
                    </div>
                )}
                {isReplayMode && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={nextCandle}
                            className="flex items-center gap-1 px-3 py-1.5 bg-surface-elevated border border-border hover:bg-surface-hover text-white text-xs rounded-lg">
                            <SkipForward className="w-3 h-3" /> +1 свічка
                        </button>
                        <button onClick={stopReplay}
                            className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-red-400 hover:bg-surface-hover text-xs rounded-lg">
                            <Square className="w-3 h-3" /> Стоп
                        </button>
                    </div>
                )}

                {/* Stats bar — right side */}
                <div className="ml-auto flex items-center gap-4 text-xs flex-shrink-0">
                    <StatChip label="Win Rate" value={`${stats.winRate.toFixed(0)}%`}
                        color={stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'} />
                    <StatChip label="PF" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} />
                    <StatChip label="PnL" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}$`}
                        color={stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'} />
                    <StatChip label="Угод" value={String(stats.totalTrades)} />
                </div>
            </div>

            {/* ── Chart ── */}
            <div className="flex-1 relative overflow-hidden">
                <ChartContainer
                    symbol={symbol}
                    interval={interval}
                    onChartReady={handleChartReady}
                    onDataUpdate={handleDataUpdate}
                />
                {/* Selecting overlay hint */}
                {isSelectingStart && (
                    <div className="absolute inset-0 bg-black/20 pointer-events-none flex items-center justify-center">
                        <div className="bg-surface border border-yellow-400/50 rounded-xl px-6 py-3 text-yellow-400 font-medium text-sm animate-pulse">
                            Клікни на будь-яку свічку, щоб розпочати бектест з цього моменту
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom trading panel ── */}
            <div className="flex-shrink-0 bg-surface border-t border-border px-5 py-3">
                <div className="flex items-center gap-5 flex-wrap">

                    {/* Inputs */}
                    <div className="flex items-center gap-3">
                        <LabeledInput label="Капітал $" value={capital} onChange={setCapital} width="w-24" />
                        <LabeledInput label="Стоп-лосс" value={slPrice} onChange={setSlPrice} width="w-28" placeholder="необов'яз." />
                        <LabeledInput label="Тейк-профіт" value={tpPrice} onChange={setTpPrice} width="w-28" placeholder="необов'яз." />
                    </div>

                    {/* Buy / Sell buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => openPosition('long')}
                            disabled={!canOpen}
                            className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors">
                            <TrendingUp className="w-4 h-4" /> BUY / LONG
                        </button>
                        <button
                            onClick={() => openPosition('short')}
                            disabled={!canOpen}
                            className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors">
                            <TrendingDown className="w-4 h-4" /> SELL / SHORT
                        </button>
                    </div>

                    {/* Active position display */}
                    {position && (
                        <div className="flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                                <span className={`font-bold ${position.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                    {position.side === 'long' ? '▲ LONG' : '▼ SHORT'}
                                </span>
                                <span className="text-gray-400">Entry: <span className="text-white font-mono">${position.entryPrice.toFixed(4)}</span></span>
                                <span className="text-gray-400">Size: <span className="text-white font-mono">${position.size}</span></span>
                                {currentPrice > 0 && <LivePnl pos={position} price={currentPrice} />}
                            </div>
                            <button
                                onClick={handleCloseClick}
                                className="ml-4 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl flex-shrink-0">
                                Закрити позицію
                            </button>
                        </div>
                    )}

                    {/* Hint */}
                    {!isReplayMode && !position && (
                        <p className="text-xs text-gray-500 italic">
                            Натисни <span className="text-primary font-medium">Replay</span>, вибери свічку — і починай бектест
                        </p>
                    )}
                </div>
            </div>

            {/* ── Close position modal ── */}
            {showCloseModal && position && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">Закрити позицію</h3>
                        <div className="space-y-3 mb-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Напрямок:</span>
                                <span className={`font-bold ${position.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                    {position.side === 'long' ? '▲ LONG' : '▼ SHORT'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Ціна входу:</span>
                                <span className="font-mono">${position.entryPrice.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Поточна ціна:</span>
                                <span className="font-mono">${currentPrice.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">PnL:</span>
                                {currentPrice > 0 && <LivePnl pos={position} price={currentPrice} />}
                            </div>
                        </div>
                        <textarea
                            className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary mb-4 resize-none"
                            placeholder="Нотатки (необов'язково)..."
                            rows={3}
                            value={closeNotes}
                            onChange={e => setCloseNotes(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCloseModal(false); setCloseNotes('') }}
                                className="flex-1 py-2 border border-border rounded-xl text-sm hover:bg-surface-hover">
                                Скасувати
                            </button>
                            <button
                                onClick={() => doClosePosition(currentPriceRef.current || currentPrice, closeNotes)}
                                disabled={isSaving}
                                className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                Підтвердити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatChip({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex flex-col items-end leading-tight">
            <span className="text-gray-500 text-[10px]">{label}</span>
            <span className={`font-mono font-bold ${color}`}>{value}</span>
        </div>
    )
}

function LabeledInput({ label, value, onChange, width = 'w-24', placeholder = '' }: {
    label: string; value: string; onChange: (v: string) => void; width?: string; placeholder?: string
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500 leading-none">{label}</span>
            <input
                type="number"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${width} bg-surface-elevated border border-border focus:border-primary rounded-lg px-2 py-1 text-sm text-white outline-none font-mono`}
            />
        </div>
    )
}
