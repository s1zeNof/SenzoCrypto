import { useEffect, useState, useRef } from 'react'
import { IChartApi, ISeriesApi, Time, MouseEventParams } from 'lightweight-charts'
import { Trash2, Settings, Copy, Lock, LockOpen, Scissors } from 'lucide-react'

export type DrawingTool =
    | 'cursor' | 'line' | 'ray' | 'extended' | 'horizontal' | 'vertical'
    | 'zone' | 'text' | 'measure' | 'arrow' | 'channel' | 'fibonacci'

interface Point {
    time: Time
    price: number
}

interface Drawing {
    id: string
    type: DrawingTool
    points: Point[]
    color: string
    lineWidth: number
    lineStyle?: 'solid' | 'dashed' | 'dotted'
    text?: string
    locked?: boolean
    label?: string
}

interface DrawingOverlayProps {
    chart: IChartApi | null
    series: ISeriesApi<"Candlestick"> | null
    activeTool: DrawingTool
    onToolComplete: () => void
    isReplaySelectionMode?: boolean
    drawings?: Drawing[]
    onDrawingsChange?: (drawings: Drawing[]) => void
    onEditDrawing?: (drawing: Drawing) => void
    isMagnetEnabled?: boolean
    interval?: string
    data?: any[]
}

export default function DrawingOverlay({
    chart,
    series,
    activeTool,
    onToolComplete,
    isReplaySelectionMode,
    drawings = [],
    onDrawingsChange,
    onEditDrawing,
    isMagnetEnabled = false,
    interval = '1h',
    data = []
}: DrawingOverlayProps) {
    const getIntervalSeconds = (iv: string) => {
        const num = parseInt(iv) || 1
        if (iv.endsWith('m')) return num * 60
        if (iv.endsWith('h')) return num * 3600
        if (iv.endsWith('d')) return num * 86400
        if (iv.endsWith('w')) return num * 604800
        return 60
    }

    const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing> | null>(null)
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null)
    const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null)
    const [dragPointIndex, setDragPointIndex] = useState<number | null>(null)
    const [isDraggingDrawing, setIsDraggingDrawing] = useState(false)
    const [dragStartPos, setDragStartPos] = useState<Point | null>(null)
    const [mousePos, setMousePos] = useState<Point | null>(null)
    const [isShiftPressed, setIsShiftPressed] = useState(false)
    const [isCtrlPressed, setIsCtrlPressed] = useState(false)
    // Toolbar pixel position (updated each render)
    const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null)

    const overlayRef = useRef<HTMLDivElement>(null)

    // Keys
    useEffect(() => {
        const dn = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true)
            if (e.key === 'Control') setIsCtrlPressed(true)
            if (e.key === 'Escape') setSelectedDrawingId(null)
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
                const sel = drawings.find(d => d.id === selectedDrawingId)
                if (sel && !sel.locked && onDrawingsChange) {
                    onDrawingsChange(drawings.filter(d => d.id !== selectedDrawingId))
                    setSelectedDrawingId(null)
                }
            }
        }
        const up = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false)
            if (e.key === 'Control') setIsCtrlPressed(false)
        }
        window.addEventListener('keydown', dn)
        window.addEventListener('keyup', up)
        return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
    }, [selectedDrawingId, drawings, onDrawingsChange])

    const priceToScreenY = (price: number) => {
        if (!series) return null
        return series.priceToCoordinate(price)
    }

    const pointToScreen = (p: Point) => {
        if (!chart || !series) return null
        const timeScale = chart.timeScale()
        let x = timeScale.timeToCoordinate(p.time)
        const y = series.priceToCoordinate(p.price)
        if (x === null && data.length > 0) {
            const index = data.findIndex(d => d.time === p.time)
            if (index !== -1) {
                x = timeScale.logicalToCoordinate(index as any)
            } else {
                const lastCandle = data[data.length - 1]
                if (lastCandle) {
                    const lastIndex = data.length - 1
                    const seconds = getIntervalSeconds(interval)
                    const diff = Math.round(((p.time as number) - (lastCandle.time as number)) / seconds)
                    x = timeScale.logicalToCoordinate((lastIndex + diff) as any)
                }
            }
        }
        if (x === null || y === null) return null
        return { x, y }
    }

    const getPointFromEvent = (param: MouseEventParams): Point | null => {
        if (!param.point || !series || !chart) return null
        const price = series.coordinateToPrice(param.point.y)
        if (price === null) return null
        let time = param.time as Time
        if (!time) {
            const ts = chart.timeScale()
            const t = ts.coordinateToTime(param.point.x)
            if (t) {
                time = t
            } else {
                const logical = ts.coordinateToLogical(param.point.x)
                const last = data[data.length - 1]
                if (logical !== null && last) {
                    const lastCoord = ts.timeToCoordinate(last.time)
                    if (lastCoord !== null) {
                        const lastLogical = ts.coordinateToLogical(lastCoord)
                        if (lastLogical !== null) {
                            const diff = Math.round(logical - lastLogical)
                            time = ((last.time as number) + diff * getIntervalSeconds(interval)) as Time
                        }
                    }
                }
            }
        }
        if (!time) return null
        return { time, price }
    }

    const getMagnetSnappedPoint = (point: Point): Point => {
        if (!isMagnetEnabled || isCtrlPressed || !series || !chart) return point
        try {
            const sp = pointToScreen(point)
            if (!sp) return point
            const li = chart.timeScale().coordinateToLogical(sp.x)
            if (li === null) return point
            const cd = series.dataByIndex(Math.round(li)) as any
            if (!cd || typeof cd.open === 'undefined') return point
            const ohlc = [cd.open, cd.high, cd.low, cd.close]
            const closest = ohlc.reduce((p, c) => Math.abs(c - point.price) < Math.abs(p - point.price) ? c : p)
            if (Math.abs(closest - point.price) < point.price * 0.01) return { time: cd.time, price: closest }
        } catch { }
        return point
    }

    const getAngleSnappedPoint = (start: Point, cur: Point): Point => {
        if (!isShiftPressed) return cur
        const ss = pointToScreen(start)
        const cs = pointToScreen(cur)
        if (!ss || !cs) return cur
        const dx = Math.abs(cs.x - ss.x)
        const dy = Math.abs(cs.y - ss.y)
        return dx > dy ? { ...cur, price: start.price } : { ...cur, time: start.time }
    }

    // One-click tools
    const ONE_CLICK_TOOLS: DrawingTool[] = ['horizontal', 'vertical', 'text']

    const handleClick = (param: MouseEventParams) => {
        if (isReplaySelectionMode) return
        const rawPoint = getPointFromEvent(param)
        if (!rawPoint) return
        const point = getMagnetSnappedPoint(rawPoint)

        if (dragPointIndex !== null || isDraggingDrawing) {
            setDragPointIndex(null)
            setIsDraggingDrawing(false)
            setDragStartPos(null)
            return
        }

        if (activeTool !== 'cursor') {
            if (!currentDrawing) {
                if (activeTool === 'text') {
                    const labelText = prompt('Введіть текст:')
                    if (!labelText) { onToolComplete(); return }
                    const nd: Drawing = { id: crypto.randomUUID(), type: 'text', points: [point], color: '#FFFFFF', lineWidth: 14, text: labelText }
                    onDrawingsChange?.([...drawings, nd])
                    onToolComplete()
                    return
                }
                if (ONE_CLICK_TOOLS.includes(activeTool)) {
                    const nd: Drawing = { id: crypto.randomUUID(), type: activeTool, points: [point], color: '#2962FF', lineWidth: 2, lineStyle: 'solid' }
                    onDrawingsChange?.([...drawings, nd])
                    onToolComplete()
                    return
                }
                // Fibonacci needs 2 points, channel needs 3
                setCurrentDrawing({ id: crypto.randomUUID(), type: activeTool, points: [point], color: '#2962FF', lineWidth: 2, lineStyle: 'solid' })
            } else {
                const pts = currentDrawing.points || []
                let finalPoint = getMagnetSnappedPoint(rawPoint)
                if (activeTool !== 'zone' && activeTool !== 'measure' && activeTool !== 'channel') {
                    finalPoint = getAngleSnappedPoint(pts[0], finalPoint)
                }
                const newPts = [...pts, finalPoint]

                // Channel needs 3 points
                if (activeTool === 'channel' && newPts.length < 3) {
                    setCurrentDrawing({ ...currentDrawing, points: newPts })
                    return
                }

                const nd = { ...currentDrawing, points: newPts } as Drawing
                onDrawingsChange?.([...drawings, nd])
                setCurrentDrawing(null)
                onToolComplete()
            }
            return
        }

        if (!hoveredDrawingId) setSelectedDrawingId(null)
        else setSelectedDrawingId(hoveredDrawingId)
    }

    const handleMouseMove = (param: MouseEventParams) => {
        const point = getPointFromEvent(param)
        if (!point) return
        setMousePos(point)

        if (selectedDrawingId && dragPointIndex !== null && onDrawingsChange) {
            onDrawingsChange(drawings.map(d => {
                if (d.id !== selectedDrawingId) return d
                const np = [...d.points]; np[dragPointIndex] = point
                return { ...d, points: np }
            }))
            return
        }

        if (selectedDrawingId && isDraggingDrawing && dragStartPos && onDrawingsChange && chart) {
            const priceDelta = point.price - dragStartPos.price
            const ds = pointToScreen(dragStartPos)
            const cs = pointToScreen(point)
            let timeDelta = 0
            if (ds && cs) {
                const sl = chart.timeScale().coordinateToLogical(ds.x)
                const cl = chart.timeScale().coordinateToLogical(cs.x)
                if (sl !== null && cl !== null) timeDelta = Math.round(cl - sl)
            }
            setDragStartPos(point)
            onDrawingsChange(drawings.map(d => {
                if (d.id !== selectedDrawingId) return d
                const np = d.points.map(p => {
                    const ps = pointToScreen(p)
                    if (!ps) return { ...p, price: p.price + priceDelta }
                    const pl = chart.timeScale().coordinateToLogical(ps.x)
                    if (pl === null) return { ...p, price: p.price + priceDelta }
                    const nl = pl + timeDelta
                    const nc = chart.timeScale().logicalToCoordinate(nl as any)
                    if (nc !== null) {
                        const nt = chart.timeScale().coordinateToTime(nc)
                        if (nt) return { time: nt, price: p.price + priceDelta }
                    }
                    return { ...p, price: p.price + priceDelta }
                })
                return { ...d, points: np }
            }))
        }
    }

    const handleDoubleClick = (param: MouseEventParams) => {
        if (hoveredDrawingId && onEditDrawing) {
            const d = drawings.find(x => x.id === hoveredDrawingId)
            if (d) onEditDrawing(d)
        }
    }

    useEffect(() => {
        if (!chart) return
        chart.subscribeClick(handleClick)
        chart.subscribeCrosshairMove(handleMouseMove)
        chart.subscribeDblClick(handleDoubleClick)
        return () => {
            chart.unsubscribeClick(handleClick)
            chart.unsubscribeCrosshairMove(handleMouseMove)
            chart.unsubscribeDblClick(handleDoubleClick)
        }
    }, [chart, activeTool, currentDrawing, dragPointIndex, selectedDrawingId, isShiftPressed, isReplaySelectionMode, isDraggingDrawing, dragStartPos, drawings])

    // ─── Rendering ────────────────────────────────────────────────────────────

    const renderReplayCursor = () => {
        if (!isReplaySelectionMode || !mousePos) return null
        const sp = pointToScreen(mousePos)
        if (!sp) return null
        return (
            <g className="pointer-events-none">
                <line x1={sp.x} y1={0} x2={sp.x} y2="100%" stroke="#2962FF" strokeWidth={1} strokeDasharray="5,5" />
                <foreignObject x={sp.x - 12} y={sp.y - 12} width={24} height={24}>
                    <div className="text-white bg-blue-600 rounded-full p-1 shadow-lg">
                        <Scissors size={16} />
                    </div>
                </foreignObject>
            </g>
        )
    }

    const renderDrawing = (d: Drawing | Partial<Drawing>, isPreview = false) => {
        if (!d.points || d.points.length === 0) return null

        let pointsToRender = d.points
        if (isPreview && mousePos && d.points.length >= 1) {
            let pp = getMagnetSnappedPoint(mousePos)
            if (d.type !== 'zone' && d.type !== 'measure' && d.type !== 'channel') {
                pp = getAngleSnappedPoint(d.points[0], pp)
            }
            pointsToRender = [...d.points, pp]
        }

        const screenPoints = pointsToRender.map(pointToScreen).filter(Boolean) as { x: number; y: number }[]
        const isSelected = !isPreview && d.id === selectedDrawingId
        const isHovered = !isPreview && d.id === hoveredDrawingId
        const isActive = isSelected || isHovered
        const locked = (d as Drawing).locked

        const style = {
            stroke: d.color || '#2962FF',
            strokeWidth: (d.lineWidth || 2) as number,
            strokeDasharray: d.lineStyle === 'dashed' ? '8,4' : d.lineStyle === 'dotted' ? '2,3' : undefined,
        }

        const handleSelect = (e: React.MouseEvent) => {
            if (isPreview || locked) return
            e.stopPropagation()
            setSelectedDrawingId(d.id!)
        }
        const handleDragStart = (e: React.MouseEvent) => {
            if (isPreview || locked || !isSelected) return
            e.stopPropagation()
            setIsDraggingDrawing(true)
            setDragStartPos(mousePos)
        }
        const handleDblClick = (e: React.MouseEvent) => {
            if (isPreview) return
            e.stopPropagation()
            if (onEditDrawing) onEditDrawing(d as Drawing)
        }
        const commonHandlers = {
            onClick: handleSelect,
            onMouseDown: handleDragStart,
            onDoubleClick: handleDblClick,
            onMouseEnter: () => !isPreview && !locked && setHoveredDrawingId(d.id!),
            onMouseLeave: () => !isPreview && setHoveredDrawingId(null),
            className: isPreview ? 'pointer-events-none' : (locked ? 'cursor-not-allowed pointer-events-auto' : 'cursor-pointer pointer-events-auto'),
        }

        const Handle = ({ cx, cy, idx }: { cx: number; cy: number; idx: number }) => (
            <circle
                cx={cx} cy={cy} r={5}
                fill="white" stroke="#2962FF" strokeWidth={2}
                className={locked ? 'cursor-not-allowed' : 'cursor-move'}
                onMouseDown={(e) => { if (!locked) { e.stopPropagation(); setDragPointIndex(idx) } }}
            />
        )

        switch (d.type) {
            case 'line':
            case 'arrow': {
                if (screenPoints.length < 2) {
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                }
                const [p1, p2] = screenPoints
                const arrowId = `arrow-${d.id}`
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        {d.type === 'arrow' && (
                            <defs>
                                <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                                    <path d="M0,0 L0,6 L8,3 z" fill={d.color || '#2962FF'} />
                                </marker>
                            </defs>
                        )}
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={20} />
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...style} markerEnd={d.type === 'arrow' ? `url(#${arrowId})` : undefined} />
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'ray': {
                if (screenPoints.length < 2) return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                let [x1, y1] = [screenPoints[0].x, screenPoints[0].y]
                let [x2, y2] = [screenPoints[1].x, screenPoints[1].y]
                if (chart) {
                    const dx = x2 - x1; const dy = y2 - y1
                    const w = chart.timeScale().width()
                    if (dx !== 0) { const slope = dy / dx; x2 = dx > 0 ? w + 200 : -200; y2 = y1 + slope * (x2 - x1) }
                    else y2 = dy > 0 ? 10000 : -10000
                }
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={20} />
                        <line x1={x1} y1={y1} x2={x2} y2={y2} {...style} />
                        {isActive && <Handle cx={screenPoints[0].x} cy={screenPoints[0].y} idx={0} />}
                        {isActive && screenPoints[1] && <Handle cx={screenPoints[1].x} cy={screenPoints[1].y} idx={1} />}
                    </g>
                )
            }

            case 'extended': {
                if (screenPoints.length < 2) return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                let [x1, y1] = [screenPoints[0].x, screenPoints[0].y]
                let [x2, y2] = [screenPoints[1].x, screenPoints[1].y]
                if (chart) {
                    const dx = x2 - x1; const dy = y2 - y1; const w = chart.timeScale().width()
                    if (dx !== 0) {
                        const slope = dy / dx
                        const xRight = w + 200; const yRight = y1 + slope * (xRight - x1)
                        const xLeft = -200; const yLeft = y1 + slope * (xLeft - x1)
                        x1 = xLeft; y1 = yLeft; x2 = xRight; y2 = yRight
                    }
                }
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={20} />
                        <line x1={x1} y1={y1} x2={x2} y2={y2} {...style} />
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'horizontal': {
                const yPos = priceToScreenY(d.points[0].price)
                if (yPos === null) return null
                const anchorX = pointToScreen(d.points[0])
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <line x1={0} y1={yPos} x2="100%" y2={yPos} stroke="transparent" strokeWidth={20} />
                        <line x1={0} y1={yPos} x2="100%" y2={yPos} {...style} />
                        {/* Price label */}
                        <text x={4} y={yPos - 4} fill={d.color || '#2962FF'} fontSize={10} fontFamily="monospace">{d.label || ''}</text>
                        {isActive && anchorX && <Handle cx={anchorX.x} cy={yPos} idx={0} />}
                    </g>
                )
            }

            case 'vertical': {
                if (!screenPoints[0]) {
                    const sp1 = pointToScreen(d.points[0])
                    if (!sp1) return null
                    screenPoints[0] = sp1
                }
                const vx = screenPoints[0].x
                const vy = screenPoints[0].y
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <line x1={vx} y1={0} x2={vx} y2="100%" stroke="transparent" strokeWidth={20} />
                        <line x1={vx} y1={0} x2={vx} y2="100%" {...style} />
                        {isActive && <Handle cx={vx} cy={vy} idx={0} />}
                    </g>
                )
            }

            case 'zone':
            case 'measure': {
                if (screenPoints.length < 2) return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const bx = Math.min(screenPoints[0].x, screenPoints[1].x)
                const by = Math.min(screenPoints[0].y, screenPoints[1].y)
                const bw = Math.abs(screenPoints[0].x - screenPoints[1].x)
                const bh = Math.abs(screenPoints[0].y - screenPoints[1].y)
                const pctChange = pointsToRender.length >= 2
                    ? ((pointsToRender[1].price - pointsToRender[0].price) / pointsToRender[0].price * 100).toFixed(2)
                    : '0.00'
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <rect x={bx} y={by} width={bw} height={bh} fill={style.stroke} fillOpacity={0.12} stroke={style.stroke} strokeWidth={1} strokeDasharray={style.strokeDasharray} />
                        {d.type === 'measure' && bw > 40 && bh > 16 && (
                            <text x={bx + bw / 2} y={by + bh / 2 + 4} textAnchor="middle" fill="white" fontSize={12} fontFamily="monospace" pointerEvents="none">
                                {Number(pctChange) >= 0 ? '+' : ''}{pctChange}%
                            </text>
                        )}
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'channel': {
                if (screenPoints.length < 2) return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const [cp1, cp2] = screenPoints
                // Third point mirrors cp2 offset
                const cp3 = screenPoints[2]
                const priceOffset = screenPoints.length >= 3 && pointsToRender.length >= 3
                    ? (pointsToRender[2].price - pointsToRender[1].price)
                    : 0
                const yOffset = cp3 ? cp3.y - cp2.y : (priceToScreenY(pointsToRender[0].price + priceOffset) ?? cp1.y) - cp1.y

                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <line x1={cp1.x} y1={cp1.y} x2={cp2.x} y2={cp2.y} stroke="transparent" strokeWidth={20} />
                        <line x1={cp1.x} y1={cp1.y} x2={cp2.x} y2={cp2.y} {...style} />
                        <line x1={cp1.x} y1={cp1.y + yOffset} x2={cp2.x} y2={cp2.y + yOffset} {...style} strokeDasharray="6,3" />
                        <polygon
                            points={`${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${cp2.x},${cp2.y + yOffset} ${cp1.x},${cp1.y + yOffset}`}
                            fill={style.stroke} fillOpacity={0.07} stroke="none"
                        />
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'fibonacci': {
                if (screenPoints.length < 2) return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
                const fibColors = ['#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#F44336']
                const pHigh = pointsToRender[0].price
                const pLow = pointsToRender[1].price
                const range = pHigh - pLow
                const xLeft = Math.min(screenPoints[0].x, screenPoints[1].x)
                const xRight = Math.max(screenPoints[0].x, screenPoints[1].x)
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        {fibLevels.map((lvl, i) => {
                            const price = pLow + range * (1 - lvl)
                            const yy = priceToScreenY(price)
                            if (yy === null) return null
                            return (
                                <g key={lvl}>
                                    <line x1={xLeft} y1={yy} x2={xRight} y2={yy} stroke={fibColors[i]} strokeWidth={1} strokeOpacity={0.8} />
                                    <text x={xRight + 4} y={yy + 4} fill={fibColors[i]} fontSize={10} fontFamily="monospace">{lvl}</text>
                                </g>
                            )
                        })}
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'text': {
                const tyPos = priceToScreenY(d.points[0].price)
                const txPos = pointToScreen(d.points[0])
                if (tyPos === null || !txPos) return null
                return (
                    <g key={d.id || 'preview'} {...commonHandlers}>
                        <text
                            x={txPos.x} y={tyPos}
                            fill={d.color || '#FFFFFF'}
                            fontSize={d.lineWidth || 14}
                            fontFamily="Inter, monospace"
                            fontWeight="600"
                            pointerEvents={isPreview ? 'none' : 'auto'}
                            style={{ userSelect: 'none' }}
                        >{d.text || ''}</text>
                        {isActive && <Handle cx={txPos.x} cy={tyPos} idx={0} />}
                    </g>
                )
            }

            default:
                return null
        }
    }

    // ─── Floating TradingView-Style Toolbar ───────────────────────────────────
    // Recalculate toolbar position on every render when something is selected
    const selectedDrawing = selectedDrawingId ? drawings.find(d => d.id === selectedDrawingId) : null

    useEffect(() => {
        if (!selectedDrawing) { setToolbarPos(null); return }
        const sp = pointToScreen(selectedDrawing.points[0])
        if (sp) setToolbarPos({ x: sp.x, y: sp.y })
    })

    const renderFloatingToolbar = () => {
        if (!selectedDrawing || !toolbarPos) return null

        const tx = Math.max(4, Math.min(toolbarPos.x - 80, (overlayRef.current?.clientWidth ?? 800) - 200))
        const ty = Math.max(4, toolbarPos.y - 48)

        return (
            <div
                className="absolute flex items-center gap-0.5 bg-[#1E222D] border border-[#363A45] rounded-md px-1 py-1 shadow-2xl z-50"
                style={{ left: tx, top: ty }}
                onMouseDown={e => e.stopPropagation()}
            >
                {/* Settings */}
                <button
                    onClick={() => onEditDrawing && onEditDrawing(selectedDrawing)}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors"
                    title="Налаштування"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#363A45] mx-0.5" />

                {/* Lock/Unlock */}
                <button
                    onClick={() => {
                        if (onDrawingsChange) {
                            onDrawingsChange(drawings.map(d => d.id === selectedDrawing.id ? { ...d, locked: !d.locked } : d))
                        }
                    }}
                    className={`p-1.5 hover:bg-white/10 rounded transition-colors ${selectedDrawing.locked ? 'text-yellow-400' : 'text-gray-300 hover:text-white'}`}
                    title={selectedDrawing.locked ? 'Розблокувати' : 'Заблокувати'}
                >
                    {selectedDrawing.locked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                </button>

                {/* Duplicate */}
                <button
                    onClick={() => {
                        const copy: Drawing = { ...selectedDrawing, id: crypto.randomUUID(), points: selectedDrawing.points.map(p => ({ ...p, price: p.price * 1.001 })) }
                        onDrawingsChange?.([...drawings, copy])
                    }}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors"
                    title="Дублювати"
                >
                    <Copy className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#363A45] mx-0.5" />

                {/* Delete */}
                <button
                    onClick={() => {
                        if (!selectedDrawing.locked) {
                            onDrawingsChange?.(drawings.filter(d => d.id !== selectedDrawingId))
                            setSelectedDrawingId(null)
                        }
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                    title="Видалити (Del)"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    // Re-render on scroll/zoom
    const [, setTick] = useState(0)
    useEffect(() => {
        if (!chart) return
        const fn = () => setTick(t => t + 1)
        chart.timeScale().subscribeVisibleTimeRangeChange(fn)
        return () => chart.timeScale().unsubscribeVisibleTimeRangeChange(fn)
    }, [chart])

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" ref={overlayRef}>
            <svg className="w-full h-full pointer-events-none">
                {drawings.map(d => renderDrawing(d))}
                {currentDrawing && renderDrawing(currentDrawing as Drawing, true)}
                {renderReplayCursor()}
            </svg>
            {renderFloatingToolbar()}
        </div>
    )
}
