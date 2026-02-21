import { useState, useEffect, useRef, useCallback } from 'react'
import ChartContainer from '@/components/simulator/ChartContainer'
import DrawingOverlay, { DrawingTool } from '@/components/simulator/DrawingOverlay'
import IndicatorsPanel from '@/components/simulator/IndicatorsPanel'
import DrawingSettingsModal from '@/components/simulator/DrawingSettingsModal'
import RSIIndicator from '@/components/simulator/indicators/RSIIndicator'
import RSISettings from '@/components/simulator/indicators/RSISettings'
import MACDIndicator from '@/components/simulator/indicators/MACDIndicator'
import MACDSettings from '@/components/simulator/indicators/MACDSettings'
import ChartOverlays from '@/components/simulator/ChartOverlays'
import BottomPanel from '@/components/simulator/BottomPanel'
import { Layout, Settings, Layers, MousePointer2, Minus, BoxSelect, Type, TrendingUp, TrendingDown, X, Magnet, Trash2, ArrowRight, GitBranch, BarChart2, Triangle, MoveHorizontal } from 'lucide-react'
import { IChartApi, ISeriesApi } from 'lightweight-charts'

// --- Paper Trading Logic (Mini Hook) ---
interface Position {
    id: string
    symbol: string
    type: 'LONG' | 'SHORT'
    entryPrice: number
    size: number
    leverage: number
    pnl: number
}

export default function Simulator() {
    const [symbol, setSymbol] = useState('BTCUSDT')
    const [interval, setInterval] = useState('1h')

    // Symbol Search State
    const [symbolSearch, setSymbolSearch] = useState('')
    const [symbolResults, setSymbolResults] = useState<string[]>([])
    const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false)
    const [isSearchingSymbol, setIsSearchingSymbol] = useState(false)
    const symbolSearchRef = useRef<HTMLDivElement>(null)

    const POPULAR_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT']

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (symbolSearchRef.current && !symbolSearchRef.current.contains(e.target as Node)) {
                setIsSymbolDropdownOpen(false)
                setSymbolSearch('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Search symbols via Binance API
    const searchSymbols = useCallback(async (query: string) => {
        if (!query) {
            setSymbolResults(POPULAR_SYMBOLS)
            return
        }
        setIsSearchingSymbol(true)
        try {
            const response = await fetch('https://api.binance.com/api/v3/exchangeInfo')
            const data = await response.json()
            const matches = (data.symbols as any[])
                .filter((s: any) => s.symbol.includes(query.toUpperCase()) && s.quoteAsset === 'USDT' && s.status === 'TRADING')
                .map((s: any) => s.symbol)
                .slice(0, 20)
            setSymbolResults(matches)
        } catch {
            setSymbolResults(POPULAR_SYMBOLS.filter(s => s.includes(query.toUpperCase())))
        } finally {
            setIsSearchingSymbol(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => searchSymbols(symbolSearch), 300)
        return () => clearTimeout(timer)
    }, [symbolSearch, searchSymbols])

    // Chart API Refs
    const [chartApi, setChartApi] = useState<IChartApi | null>(null)
    const [seriesApi, setSeriesApi] = useState<ISeriesApi<"Candlestick"> | null>(null)
    const [currentPrice, setCurrentPrice] = useState<number>(0)

    // Drawing State
    const [activeTool, setActiveTool] = useState<DrawingTool>('cursor')
    const [favoriteTools, setFavoriteTools] = useState<DrawingTool[]>([])
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

    // Lifted Drawing State for Persistence & Editing
    const [drawings, setDrawings] = useState<any[]>([])
    const [editingDrawing, setEditingDrawing] = useState<any | null>(null)
    const [isMagnetEnabled, setIsMagnetEnabled] = useState(true) // Magnet enabled by default

    // Load drawings from localStorage when symbol changes
    useEffect(() => {
        const storageKey = `simulator_drawings_${symbol}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                setDrawings(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load drawings', e)
                setDrawings([])
            }
        } else {
            setDrawings([])
        }
    }, [symbol])

    // Save drawings to localStorage on change (per symbol)
    useEffect(() => {
        const storageKey = `simulator_drawings_${symbol}`
        localStorage.setItem(storageKey, JSON.stringify(drawings))
    }, [drawings, symbol])

    const handleDrawingUpdate = (updatedDrawing: any) => {
        setDrawings(prev => prev.map(d => d.id === updatedDrawing.id ? updatedDrawing : d))
    }

    const handleDeleteDrawing = (id: string) => {
        setDrawings(prev => prev.filter(d => d.id !== id))
    }

    const handleClearAllDrawings = () => {
        if (drawings.length === 0) return
        if (confirm(`Очистити всі малюнки для ${symbol}? Це не можна відмінити.`)) {
            setDrawings([])
        }
    }

    // Tool Groups Configuration
    const TOOL_GROUPS = [
        {
            id: 'lines',
            icon: <Minus className="w-5 h-5 -rotate-45" />,
            label: 'Лінії',
            tools: [
                { id: 'line',       label: 'Trend Line',       icon: <Minus className="w-4 h-4 -rotate-45" /> },
                { id: 'ray',        label: 'Ray',              icon: <ArrowRight className="w-4 h-4 -rotate-12" /> },
                { id: 'extended',   label: 'Extended Line',    icon: <MoveHorizontal className="w-4 h-4" /> },
                { id: 'horizontal', label: 'Horizontal Line',  icon: <Minus className="w-4 h-4" /> },
                { id: 'vertical',   label: 'Vertical Line',    icon: <Minus className="w-4 h-4 rotate-90" /> },
                { id: 'arrow',      label: 'Arrow',            icon: <ArrowRight className="w-4 h-4" /> },
            ]
        },
        {
            id: 'geometry',
            icon: <BoxSelect className="w-5 h-5" />,
            label: 'Геометрія',
            tools: [
                { id: 'zone',    label: 'Rectangle / Zone', icon: <BoxSelect className="w-4 h-4" /> },
                { id: 'channel', label: 'Parallel Channel', icon: <GitBranch className="w-4 h-4" /> },
                { id: 'text',    label: 'Text',             icon: <Type className="w-4 h-4" /> },
            ]
        },
        {
            id: 'fibonacci',
            icon: <Triangle className="w-5 h-5" />,
            label: 'Fibonacci',
            tools: [
                { id: 'fibonacci', label: 'Fibonacci Retracement', icon: <BarChart2 className="w-4 h-4" /> },
            ]
        },
        {
            id: 'measure',
            icon: <Settings className="w-5 h-5" />,
            label: 'Вимірювання',
            tools: [
                { id: 'measure', label: 'Price Range', icon: <Settings className="w-4 h-4" /> },
            ]
        }
    ]

    const toggleFavorite = (toolId: DrawingTool, e: React.MouseEvent) => {
        e.stopPropagation()
        setFavoriteTools(prev =>
            prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
        )
    }

    // UI State
    const [isTerminalVisible, setIsTerminalVisible] = useState(true)
    const [showIndicators, setShowIndicators] = useState(false)
    const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Indicators State
    const [activeIndicators, setActiveIndicators] = useState<string[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [rsiSettings, setRSISettings] = useState({
        period: 14,
        overbought: 70,
        oversold: 30,
        source: 'close',
        showDeviation: false,
        smoothingType: 'sma',
        smoothingPeriod: 14,
        color: '#2962FF',
        lineWidth: 2,
        showZones: true,
        // Add defaults for new fields... component handles missing ones gracefully
    })
    const [editingRSI, setEditingRSI] = useState(false)

    // MACD State
    const [macdSettings, setMACDSettings] = useState({ fast: 12, slow: 26, signal: 9 })
    const [editingMACD, setEditingMACD] = useState(false)

    // Load/Save active indicators per Symbol
    useEffect(() => {
        const storageKey = `simulator_indicators_${symbol}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                setActiveIndicators(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load indicators', e)
                setActiveIndicators([])
            }
        } else {
            setActiveIndicators([])
        }

        // Load Settings
        const savedRSI = localStorage.getItem(`simulator_rsi_settings_${symbol}`)
        if (savedRSI) setRSISettings(JSON.parse(savedRSI))

        const savedMACD = localStorage.getItem(`simulator_macd_settings_${symbol}`)
        if (savedMACD) setMACDSettings(JSON.parse(savedMACD))

    }, [symbol])

    // Save Active Indicators
    useEffect(() => {
        const storageKey = `simulator_indicators_${symbol}`
        localStorage.setItem(storageKey, JSON.stringify(activeIndicators))
    }, [activeIndicators, symbol])

    // Save Settings Persistence
    useEffect(() => {
        localStorage.setItem(`simulator_rsi_settings_${symbol}`, JSON.stringify(rsiSettings))
    }, [rsiSettings, symbol])

    useEffect(() => {
        localStorage.setItem(`simulator_macd_settings_${symbol}`, JSON.stringify(macdSettings))
    }, [macdSettings, symbol])

    // Indicator handlers
    const handleAddIndicator = (indicatorId: string) => {
        if (!activeIndicators.includes(indicatorId)) {
            setActiveIndicators(prev => [...prev, indicatorId])
        }
        setShowIndicators(false) // Close panel after adding
    }

    const handleRemoveIndicator = (indicatorId: string) => {
        setActiveIndicators(prev => prev.filter(id => id !== indicatorId))
    }


    // Trading State
    const [positions, setPositions] = useState<Position[]>([])
    const [orderAmount, setOrderAmount] = useState<string>('1000')
    const [leverage, setLeverage] = useState<number>(20)

    // Timeframes
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

    // Update PnL on price change
    useEffect(() => {
        if (positions.length === 0) return
        setPositions(prev => prev.map(pos => {
            const priceDiff = currentPrice - pos.entryPrice
            const pnlPercent = (priceDiff / pos.entryPrice) * pos.leverage * (pos.type === 'LONG' ? 1 : -1)
            return { ...pos, pnl: pos.size * pnlPercent }
        }))
    }, [currentPrice])

    const placeOrder = (type: 'LONG' | 'SHORT') => {
        if (!currentPrice) return
        const amount = parseFloat(orderAmount)
        const newPosition: Position = {
            id: Math.random().toString(36).substr(2, 9),
            symbol,
            type,
            entryPrice: currentPrice,
            size: amount,
            leverage,
            pnl: 0
        }
        setPositions([...positions, newPosition])
    }

    const closePosition = (id: string) => {
        setPositions(prev => prev.filter(p => p.id !== id))
    }

    // Replay State
    const [isReplayActive, setIsReplayActive] = useState(false)
    const [isReplaySelectionMode, setIsReplaySelectionMode] = useState(false)
    const [isReplayPaused, setIsReplayPaused] = useState(true)
    const [replaySpeed, setReplaySpeed] = useState(1000) // ms per candle
    const [replayApi, setReplayApi] = useState<any>(null)
    const replayIntervalRef = useRef<number | null>(null)

    // Replay Logic
    useEffect(() => {
        if (isReplayActive && !isReplayPaused && replayApi) {
            replayIntervalRef.current = window.setInterval(() => {
                replayApi.nextCandle()
            }, replaySpeed)
        } else {
            if (replayIntervalRef.current !== null) window.clearInterval(replayIntervalRef.current)
        }
        return () => { if (replayIntervalRef.current !== null) window.clearInterval(replayIntervalRef.current) }
    }, [isReplayActive, isReplayPaused, replaySpeed, replayApi])

    const handleReplayClick = () => {
        if (isReplayActive) {
            // Stop Replay
            setIsReplayActive(false)
            setIsReplaySelectionMode(false)
            setIsReplayPaused(true)
            replayApi?.stopReplay()
        } else {
            // Start Replay Mode -> Enter Selection Mode
            setIsReplayActive(true)
            setIsReplaySelectionMode(true)
            setIsReplayPaused(true)
        }
    }

    // Keep ref in sync for chart callbacks
    const isReplaySelectionModeRef = useRef(isReplaySelectionMode)
    useEffect(() => { isReplaySelectionModeRef.current = isReplaySelectionMode }, [isReplaySelectionMode])

    // ── Fix: stop replay when timeframe OR symbol changes ──────────────────────
    // Without this, fullDataRef inside ChartContainer gets overwritten with new
    // interval's candles while replayIndexRef still points to the old index →
    // nextCandle() returns wrong-interval data → chart breaks.
    useEffect(() => {
        if (!isReplayActive) return
        // Stop the playback timer immediately
        if (replayIntervalRef.current !== null) {
            window.clearInterval(replayIntervalRef.current)
            replayIntervalRef.current = null
        }
        // Reset all replay state
        setIsReplayActive(false)
        setIsReplaySelectionMode(false)
        setIsReplayPaused(true)
        // Tell ChartContainer to reset its refs and show full new data
        replayApi?.stopReplay()
    }, [interval, symbol]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-background text-white overflow-hidden relative">
            {/* ... (Top Toolbar) ... */}
            <div className="hidden md:flex h-12 border-b border-border items-center px-4 gap-4 bg-surface/50">
                {/* Symbol Search */}
                <div className="relative" ref={symbolSearchRef}>
                    <button
                        onClick={() => { setIsSymbolDropdownOpen(!isSymbolDropdownOpen); setSymbolResults(POPULAR_SYMBOLS) }}
                        className="font-bold text-lg flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded transition-colors"
                    >
                        <img src="https://bin.bnbstatic.com/static/images/common/favicon.ico" className="w-5 h-5" alt="" />
                        {symbol}
                        <span className="text-xs text-gray-500 ml-2">BINANCE</span>
                    </button>
                    {isSymbolDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border rounded-lg shadow-2xl z-50">
                            <div className="p-2 border-b border-border">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Пошук пари... (BTC, ETH, SOL)"
                                    value={symbolSearch}
                                    onChange={e => setSymbolSearch(e.target.value)}
                                    className="w-full bg-black/30 border border-border rounded px-3 py-1.5 text-sm outline-none focus:border-primary placeholder-gray-500"
                                />
                            </div>
                            <div className="py-1 text-xs text-gray-500 px-3 pt-2 font-bold uppercase tracking-wider">
                                {symbolSearch ? 'Результати пошуку' : 'Популярні пари'}
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {isSearchingSymbol ? (
                                    <div className="text-center text-gray-400 text-sm py-4">Пошук...</div>
                                ) : symbolResults.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm py-4">Нічого не знайдено</div>
                                ) : (
                                    symbolResults.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { setSymbol(s); setIsSymbolDropdownOpen(false); setSymbolSearch('') }}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex justify-between items-center ${s === symbol ? 'text-primary bg-primary/10' : ''}`}
                                        >
                                            <span className="font-mono">{s}</span>
                                            {s === symbol && <span className="text-xs text-primary">✓</span>}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-border mx-2" />

                {/* Timeframes */}
                <div className="flex gap-1">
                    {timeframes.map(tf => (
                        <button
                            key={tf}
                            onClick={() => setInterval(tf)}
                            className={`px-3 py-1 text-sm rounded hover:bg-white/10 transition-colors ${interval === tf ? 'text-primary font-bold bg-primary/10' : 'text-gray-400'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-border mx-2" />

                <button onClick={() => setShowIndicators(!showIndicators)} className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-white/10 transition-colors ${showIndicators || activeIndicators.length > 0 ? 'text-primary' : 'text-gray-400'}`}>
                    <Layers className="w-4 h-4" />
                    <span className="text-sm">Indicators{activeIndicators.length > 0 && ` (${activeIndicators.length})`}</span>
                </button>

                {/* Clear All Drawings */}
                {drawings.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete all drawings for this symbol?')) {
                                setDrawings([])
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        title={`Clear all drawings for ${symbol}`}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Clear ({drawings.length})</span>
                    </button>
                )}

                {/* Replay Button */}
                <button
                    onClick={handleReplayClick}
                    className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-white/10 transition-colors ${isReplayActive ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400'}`}
                >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Replay</span>
                </button>

                {/* Replay Controls (Visible only when active AND NOT in selection mode) */}
                {isReplayActive && !isReplaySelectionMode && (
                    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2 py-1 animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => setIsReplayPaused(!isReplayPaused)} className="p-1 hover:text-white text-primary">
                            {isReplayPaused ? '▶' : '⏸'}
                        </button>
                        <button onClick={() => replayApi?.nextCandle()} className="p-1 hover:text-white text-gray-400">
                            ⏭
                        </button>
                        <select
                            value={replaySpeed}
                            onChange={(e) => setReplaySpeed(Number(e.target.value))}
                            className="bg-transparent text-xs text-gray-400 outline-none"
                        >
                            <option value={1000}>1x</option>
                            <option value={500}>2x</option>
                            <option value={200}>5x</option>
                            <option value={50}>10x</option>
                        </select>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button onClick={handleReplayClick} className="p-1 hover:text-red-500 text-gray-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Replay Selection Hint */}
                {isReplaySelectionMode && (
                    <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 text-blue-200 rounded-lg px-3 py-1 text-sm animate-pulse">
                        <span>Select start point on chart</span>
                    </div>
                )}

                {/* Drawing Tool Hints */}
                {activeTool !== 'cursor' && (
                    <div className="flex items-center gap-3 bg-surface/90 border border-border rounded-lg px-3 py-1 text-xs text-gray-400">
                        {isMagnetEnabled && (
                            <span className="flex items-center gap-1">
                                <Magnet className="w-3 h-3 text-blue-400" />
                                <span>Snap ON</span>
                                <span className="text-gray-500">|</span>
                                <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-[10px]">Ctrl</kbd>
                                <span>to override</span>
                            </span>
                        )}
                        <span className="text-gray-500">|</span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-[10px]">Shift</kbd>
                            <span>for angle snap</span>
                        </span>
                    </div>
                )}

                <div className="flex-1" />

                <button onClick={() => setIsTerminalVisible(!isTerminalVisible)} className={`p-2 rounded transition-colors ${isTerminalVisible ? 'text-primary bg-primary/10' : 'text-gray-400 hover:bg-white/10'}`} title="Toggle Terminal">
                    <Layout className="w-5 h-5" />
                </button>
            </div>

            {/* Main Content - Full Screen Chart */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <div className="flex-1 relative">
                    <ChartContainer
                        symbol={symbol}
                        interval={interval}
                        onDataUpdate={setChartData}
                        onChartReady={(chart, series, api) => {
                            setChartApi(chart)
                            setSeriesApi(series)
                            setReplayApi(api) // Capture Replay API

                            // Hack to get current price update from chart for terminal
                            chart.subscribeCrosshairMove((param) => {
                                if (param.seriesData.get(series)) {
                                    const data = param.seriesData.get(series) as any
                                    if (data) setCurrentPrice(data.close || data.value)
                                }
                            })

                            // Replay "Cut" Logic: Click to set start time
                            chart.subscribeClick((param) => {
                                // Use ref to get latest state value inside closure
                                if (isReplaySelectionModeRef.current && param.time) {
                                    api.startReplay(param.time as any)
                                    setIsReplaySelectionMode(false) // Exit selection mode, start playback UI
                                }
                            })
                        }}

                        isMagnetEnabled={isMagnetEnabled}
                        onDoubleClick={() => setIsBottomPanelOpen(true)}
                    />

                    {/* Drawing Overlay */}
                    <DrawingOverlay
                        chart={chartApi}
                        series={seriesApi}
                        activeTool={activeTool}
                        onToolComplete={() => setActiveTool('cursor')}
                        isReplaySelectionMode={isReplaySelectionMode}
                        drawings={drawings}
                        onDrawingsChange={setDrawings}
                        onEditDrawing={setEditingDrawing}

                        isMagnetEnabled={isMagnetEnabled}
                        interval={interval}
                        data={chartData}
                    />

                    {/* Drawing Settings Modal */}
                    {editingDrawing && (
                        <DrawingSettingsModal
                            drawing={editingDrawing}
                            onSave={handleDrawingUpdate}
                            onDelete={handleDeleteDrawing}
                            onClose={() => setEditingDrawing(null)}
                        />
                    )}

                    {/* Indicators Panel */}
                    {showIndicators && (
                        <IndicatorsPanel
                            onClose={() => setShowIndicators(false)}
                            onAddIndicator={handleAddIndicator}
                            activeIndicators={activeIndicators}
                        />
                    )}

                    {/* Chart Overlays (EMA, SMA, Bollinger) */}
                    <ChartOverlays
                        chart={chartApi}
                        data={chartData}
                        activeIndicators={activeIndicators}
                    />
                </div>

                {/* RSI Indicator Pane */}
                {activeIndicators.includes('rsi') && (
                    <div className="h-[150px] shrink-0" onDoubleClick={() => setEditingRSI(true)}>
                        <RSIIndicator
                            data={chartData}
                            settings={rsiSettings}
                            onSettingsClick={() => setEditingRSI(true)}
                        />
                    </div>
                )}

                {/* MACD Indicator Pane */}
                {activeIndicators.includes('macd') && (
                    <div className="h-[150px] shrink-0 border-t border-border" onDoubleClick={() => setEditingMACD(true)}>
                        <MACDIndicator
                            data={chartData}
                            settings={macdSettings}
                            onClose={() => handleRemoveIndicator('macd')}
                            onSettingsClick={() => setEditingMACD(true)}
                        />
                    </div>
                )}

                {/* Bottom Panel */}
                <BottomPanel
                    isOpen={isBottomPanelOpen}
                    onToggle={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                    activeIndicators={activeIndicators}
                    onRemoveIndicator={handleRemoveIndicator}
                    onEditIndicator={(id) => {
                        if (id === 'rsi') setEditingRSI(true)
                        if (id === 'macd') setEditingMACD(true)
                        if (id === 'sma' || id === 'ema' || id === 'bollinger') setShowIndicators(true) // Fallback to main panel for now
                    }}
                />

                {/* RSI Settings Modal */}
                {editingRSI && (
                    <RSISettings
                        settings={rsiSettings}
                        onSave={setRSISettings}
                        onDelete={() => handleRemoveIndicator('rsi')}
                        onClose={() => setEditingRSI(false)}
                    />
                )}

                {/* MACD Settings Modal */}
                {editingMACD && (
                    <MACDSettings
                        settings={macdSettings}
                        onSave={setMACDSettings}
                        onClose={() => setEditingMACD(false)}
                    />
                )}

                {/* Floating Favorites Toolbar */}
                {favoriteTools.length > 0 && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface/90 backdrop-blur-sm border border-border p-1 rounded-lg shadow-xl z-30 animate-in fade-in slide-in-from-top-4">
                        <div className="px-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider cursor-grab active:cursor-grabbing">Favs</div>
                        <div className="w-px h-4 bg-border mx-1" />
                        {favoriteTools.map(toolId => {
                            // Find icon for tool
                            let icon = <MousePointer2 className="w-4 h-4" />
                            TOOL_GROUPS.forEach(g => {
                                const t = g.tools.find(t => t.id === toolId)
                                if (t) icon = t.icon
                            })

                            return (
                                <button
                                    key={toolId}
                                    onClick={() => setActiveTool(toolId)}
                                    className={`p-2 rounded transition-colors ${activeTool === toolId ? 'bg-primary text-white' : 'hover:bg-white/10 text-gray-400'}`}
                                >
                                    {icon}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Desktop Left Toolbar (Drawing Tools) */}
                <div className="hidden md:flex absolute top-4 left-4 flex-col gap-1 bg-surface/90 p-1 rounded-lg border border-border shadow-xl backdrop-blur-sm z-20">
                    <button onClick={() => setActiveTool('cursor')} className={`p-2 rounded transition-colors ${activeTool === 'cursor' ? 'bg-primary text-white' : 'hover:bg-white/10 text-gray-400'}`} title="Cursor"><MousePointer2 className="w-5 h-5" /></button>

                    {/* Magnet Toggle */}
                    <button
                        onClick={() => setIsMagnetEnabled(!isMagnetEnabled)}
                        className={`p-2 rounded transition-colors ${isMagnetEnabled ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-gray-400'}`}
                        title={isMagnetEnabled ? "Magnet On (Ctrl to override)" : "Magnet Off"}
                    >
                        <Magnet className="w-5 h-5" />
                    </button>

                    <div className="h-px bg-border mx-2 my-1" />

                    {TOOL_GROUPS.map(group => (
                        <div key={group.id} className="relative group/item">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setActiveTool(group.tools[0].id as DrawingTool)}
                                    className={`p-2 rounded-l transition-colors ${group.tools.some(t => t.id === activeTool) ? 'text-primary' : 'hover:bg-white/10 text-gray-400'}`}
                                >
                                    {group.icon}
                                </button>
                                <button
                                    onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                                    className="p-0.5 h-full hover:bg-white/10 rounded-r text-gray-500"
                                >
                                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-gray-400 border-r-[3px] border-r-transparent" />
                                </button>
                            </div>

                            {/* Dropdown */}
                            {expandedGroupId === group.id && (
                                <div className="absolute left-full top-0 ml-2 bg-surface border border-border rounded-lg shadow-xl p-1 min-w-[180px] flex flex-col gap-0.5">
                                    <div className="px-2 py-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">{group.label}</div>
                                    {group.tools.map(tool => (
                                        <div key={tool.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer group/tool" onClick={() => { setActiveTool(tool.id as DrawingTool); setExpandedGroupId(null) }}>
                                            <span className={`text-gray-400 ${activeTool === tool.id ? 'text-primary' : ''}`}>{tool.icon}</span>
                                            <span className={`text-sm flex-1 ${activeTool === tool.id ? 'text-primary' : 'text-gray-300'}`}>{tool.label}</span>
                                            <button
                                                onClick={(e) => toggleFavorite(tool.id as DrawingTool, e)}
                                                className={`opacity-0 group-hover/tool:opacity-100 hover:text-yellow-400 ${favoriteTools.includes(tool.id as DrawingTool) ? 'text-yellow-400 opacity-100' : 'text-gray-600'}`}
                                            >
                                                ★
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Floating Terminal Widget (Desktop) */}
                {isTerminalVisible && (
                    <div className="hidden md:flex absolute top-4 right-4 w-80 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-30 overflow-hidden flex-col max-h-[calc(100%-2rem)] animate-in fade-in slide-in-from-right-10 duration-300">
                        <div className="p-3 border-b border-border flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-sm">Термінал</h3>
                            <div className="flex gap-2 items-center">
                                <div className={`w-2 h-2 rounded-full ${currentPrice ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`} />
                                <button onClick={() => setIsTerminalVisible(false)} className="text-gray-400 hover:text-white"><Minus className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-end">
                                <label className="text-xs text-gray-400">Ціна</label>
                                <span className="text-lg font-mono font-bold text-white">${currentPrice.toFixed(2)}</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Сума (USDT)</label>
                                    <div className="relative">
                                        <input type="number" value={orderAmount} onChange={e => setOrderAmount(e.target.value)} className="w-full bg-black/20 border border-border rounded-lg p-2.5 text-sm focus:border-primary outline-none transition-colors" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">USDT</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-xs text-gray-400">Плече</label>
                                        <span className="text-xs font-bold text-primary">{leverage}x</span>
                                    </div>
                                    <input type="range" min="1" max="100" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full accent-primary h-1.5 bg-surface rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button onClick={() => placeOrder('LONG')} className="py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg shadow-lg shadow-green-500/20 transition-all active:scale-95 flex flex-col items-center justify-center">
                                    <span className="text-xs opacity-80">BUY</span>
                                    <span>LONG</span>
                                </button>
                                <button onClick={() => placeOrder('SHORT')} className="py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95 flex flex-col items-center justify-center">
                                    <span className="text-xs opacity-80">SELL</span>
                                    <span>SHORT</span>
                                </button>
                            </div>
                        </div>

                        {/* Positions List */}
                        <div className="border-t border-border bg-black/20 flex-1 overflow-y-auto min-h-[150px]">
                            <div className="p-3 text-xs text-gray-400 font-bold flex justify-between items-center sticky top-0 bg-surface/95 backdrop-blur z-10">
                                <span>Відкриті Позиції ({positions.length})</span>
                            </div>
                            {positions.length === 0 ? (
                                <div className="text-center text-gray-500 text-xs py-8">Немає позицій</div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {positions.map(pos => (
                                        <div key={pos.id} className="bg-surface border border-border rounded p-2 text-xs">
                                            <div className="flex justify-between mb-1">
                                                <span className={`font-bold ${pos.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>{pos.type} {pos.leverage}x</span>
                                                <span className={`font-mono ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}$</span>
                                            </div>
                                            <div className="flex justify-between text-gray-400">
                                                <span>Entry: {pos.entryPrice.toFixed(2)}</span>
                                                <button onClick={() => closePosition(pos.id)} className="text-white hover:text-red-500"><X className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Toolbar (TradingView Style) */}
            <div className="md:hidden h-14 bg-surface border-t border-border flex items-center justify-around px-2 z-50">
                <button className="flex flex-col items-center gap-1 text-primary">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px]">Chart</span>
                </button>
                <button onClick={() => setIsTerminalVisible(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                    <Layout className="w-5 h-5" />
                    <span className="text-[10px]">Trade</span>
                </button>
                <button onClick={() => setActiveTool('line')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                    <Minus className="w-5 h-5 -rotate-45" />
                    <span className="text-[10px]">Draw</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px]">Menu</span>
                </button>
            </div>

            {/* Mobile Terminal Modal */}
            {isTerminalVisible && (
                <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface">
                        <span className="font-bold">Trading Terminal</span>
                        <button onClick={() => setIsTerminalVisible(false)}><X className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {/* Mobile Terminal Content - Reused Logic */}
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="text-sm text-gray-400">Current Price</div>
                                <div className="text-3xl font-bold">${currentPrice.toFixed(2)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => placeOrder('LONG')} className="py-4 bg-green-500 rounded-xl font-bold text-xl shadow-lg shadow-green-500/20 active:scale-95 transition-transform">Buy / Long</button>
                                <button onClick={() => placeOrder('SHORT')} className="py-4 bg-red-500 rounded-xl font-bold text-xl shadow-lg shadow-red-500/20 active:scale-95 transition-transform">Sell / Short</button>
                            </div>

                            <div className="space-y-4 bg-surface p-4 rounded-xl border border-border">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">Amount (USDT)</label>
                                    <input type="number" value={orderAmount} onChange={e => setOrderAmount(e.target.value)} className="w-full bg-background p-3 rounded-lg text-lg outline-none border border-border focus:border-primary" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">Leverage: {leverage}x</label>
                                    <input type="range" min="1" max="100" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full accent-primary h-2 bg-background rounded-lg appearance-none" />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-2 text-gray-400">Open Positions</h3>
                                {positions.map(pos => (
                                    <div key={pos.id} className="bg-surface border border-border rounded-lg p-3 mb-2 flex justify-between items-center">
                                        <div>
                                            <div className={`font-bold ${pos.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>{pos.type} {pos.leverage}x</div>
                                            <div className="text-xs text-gray-400">Entry: {pos.entryPrice.toFixed(2)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-mono font-bold ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}$</div>
                                            <button onClick={() => closePosition(pos.id)} className="text-xs text-red-400 mt-1">Close</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
