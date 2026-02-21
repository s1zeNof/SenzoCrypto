import { useEffect, useState, useRef, useCallback } from 'react'
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
    series: ISeriesApi<'Candlestick'> | null
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

// ─── Hit-testing helpers ──────────────────────────────────────────────────────
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1, dy = y2 - y1
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(px - x1, py - y1)
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
    return Math.hypot(px - x1 - t * dx, py - y1 - t * dy)
}

function distPt(px: number, py: number, x: number, y: number): number {
    return Math.hypot(px - x, py - y)
}

// ─── Component ────────────────────────────────────────────────────────────────
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
    data = [],
}: DrawingOverlayProps) {

    // ── State (drives rendering) ───────────────────────────────────────────────
    const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing> | null>(null)
    const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null)
    const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null)
    const [mousePos, setMousePos] = useState<Point | null>(null)
    const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null)
    const [isShiftPressed, setIsShiftPressed] = useState(false)
    const [isCtrlPressed, setIsCtrlPressed] = useState(false)
    const [, setTick] = useState(0) // force re-render on scroll/zoom

    const overlayRef = useRef<HTMLDivElement>(null)

    // ── Refs: always-current values for stable event handlers ─────────────────
    // Keeping mutable refs avoids stale closures in chart subscriptions,
    // which means we only need to subscribe ONCE (not on every state change).
    const S = useRef({
        activeTool, currentDrawing, selectedDrawingId, hoveredDrawingId,
        isReplaySelectionMode, isMagnetEnabled, isShiftPressed, isCtrlPressed,
        drawings, mousePos, data, interval, chart,
    })
    useEffect(() => {
        S.current = {
            activeTool, currentDrawing, selectedDrawingId, hoveredDrawingId,
            isReplaySelectionMode, isMagnetEnabled, isShiftPressed, isCtrlPressed,
            drawings, mousePos, data, interval, chart,
        }
    })

    // Drag-specific refs (don't need to trigger renders during drag)
    const isMouseDownRef   = useRef(false)
    const isDraggingRef    = useRef(false)
    const dragStartRef     = useRef<Point | null>(null)
    const dragPointIdxRef  = useRef<number | null>(null)
    const dragInitRef      = useRef(false) // prevents double-start

    // ── Helpers ────────────────────────────────────────────────────────────────
    const getIntervalSeconds = (iv: string) => {
        const num = parseInt(iv) || 1
        if (iv.endsWith('m')) return num * 60
        if (iv.endsWith('h')) return num * 3600
        if (iv.endsWith('d')) return num * 86400
        if (iv.endsWith('w')) return num * 604800
        return 60
    }

    const priceToScreenY = useCallback((price: number) => {
        return series?.priceToCoordinate(price) ?? null
    }, [series])

    const pointToScreen = useCallback((p: Point): { x: number; y: number } | null => {
        if (!chart || !series) return null
        const timeScale = chart.timeScale()
        let x = timeScale.timeToCoordinate(p.time)
        const y = series.priceToCoordinate(p.price)
        if (x === null && S.current.data.length > 0) {
            const index = S.current.data.findIndex(d => d.time === p.time)
            if (index !== -1) {
                x = timeScale.logicalToCoordinate(index as any)
            } else {
                const last = S.current.data[S.current.data.length - 1]
                if (last) {
                    const diff = Math.round(((p.time as number) - (last.time as number)) / getIntervalSeconds(S.current.interval))
                    x = timeScale.logicalToCoordinate((S.current.data.length - 1 + diff) as any)
                }
            }
        }
        if (x === null || y === null) return null
        return { x, y }
    }, [chart, series])

    const getPointFromEvent = useCallback((param: MouseEventParams): Point | null => {
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
                const last = S.current.data[S.current.data.length - 1]
                if (logical !== null && last) {
                    const lastCoord = ts.timeToCoordinate(last.time)
                    if (lastCoord !== null) {
                        const lastLogical = ts.coordinateToLogical(lastCoord)
                        if (lastLogical !== null) {
                            time = ((last.time as number) + Math.round(logical - lastLogical) * getIntervalSeconds(S.current.interval)) as Time
                        }
                    }
                }
            }
        }
        if (!time) return null
        return { time, price }
    }, [chart, series])

    const getMagnetPoint = useCallback((point: Point): Point => {
        if (!S.current.isMagnetEnabled || S.current.isCtrlPressed || !series || !chart) return point
        try {
            const sp = pointToScreen(point)
            if (!sp) return point
            const li = chart.timeScale().coordinateToLogical(sp.x)
            if (li === null) return point
            const cd = series.dataByIndex(Math.round(li)) as any
            if (!cd?.open) return point
            const ohlc = [cd.open, cd.high, cd.low, cd.close]
            const closest = ohlc.reduce((p: number, c: number) => Math.abs(c - point.price) < Math.abs(p - point.price) ? c : p)
            if (Math.abs(closest - point.price) < point.price * 0.01) return { time: cd.time, price: closest }
        } catch { }
        return point
    }, [chart, series, pointToScreen])

    const getAnglePoint = useCallback((start: Point, cur: Point): Point => {
        if (!S.current.isShiftPressed) return cur
        const ss = pointToScreen(start)
        const cs = pointToScreen(cur)
        if (!ss || !cs) return cur
        const dx = Math.abs(cs.x - ss.x), dy = Math.abs(cs.y - ss.y)
        return dx > dy ? { ...cur, price: start.price } : { ...cur, time: start.time }
    }, [pointToScreen])

    // ── Proximity detection: which drawing is the mouse near? ─────────────────
    // Returns id of closest drawing within HIT pixels, or null.
    // Called from handleMouseMove (chart's crosshair subscription) because SVG
    // pointer-events can't reliably fire through the pointer-events-none overlay.
    const detectHover = useCallback((mx: number, my: number, drws: Drawing[]): string | null => {
        const HIT = 10
        let foundId: string | null = null
        let minDist = HIT

        for (const d of drws) {
            if (!d.points?.length) continue
            const spts = d.points.map(p => pointToScreen(p)).filter(Boolean) as { x: number; y: number }[]
            let dist = Infinity

            switch (d.type) {
                case 'horizontal': {
                    const yy = spts[0]?.y ?? priceToScreenY(d.points[0].price) ?? -9999
                    dist = Math.abs(my - yy)
                    break
                }
                case 'vertical': {
                    dist = spts[0] ? Math.abs(mx - spts[0].x) : Infinity
                    break
                }
                case 'text': {
                    if (spts[0]) dist = distPt(mx, my, spts[0].x, spts[0].y)
                    break
                }
                case 'zone':
                case 'measure': {
                    if (spts.length >= 2) {
                        const rx = Math.min(spts[0].x, spts[1].x)
                        const ry = Math.min(spts[0].y, spts[1].y)
                        const rw = Math.abs(spts[0].x - spts[1].x)
                        const rh = Math.abs(spts[0].y - spts[1].y)
                        if (mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh) dist = 0
                        else dist = Math.min(
                            distToSegment(mx, my, rx, ry, rx + rw, ry),
                            distToSegment(mx, my, rx + rw, ry, rx + rw, ry + rh),
                            distToSegment(mx, my, rx, ry + rh, rx + rw, ry + rh),
                            distToSegment(mx, my, rx, ry, rx, ry + rh),
                        )
                    }
                    break
                }
                case 'fibonacci': {
                    if (spts.length >= 2) {
                        const range = d.points[0].price - d.points[1].price
                        const xL = Math.min(spts[0].x, spts[1].x), xR = Math.max(spts[0].x, spts[1].x)
                        for (const lvl of [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]) {
                            const yy = priceToScreenY(d.points[1].price + range * (1 - lvl))
                            if (yy !== null) dist = Math.min(dist, distToSegment(mx, my, xL, yy, xR, yy))
                        }
                    }
                    break
                }
                case 'channel': {
                    if (spts.length >= 2) {
                        dist = distToSegment(mx, my, spts[0].x, spts[0].y, spts[1].x, spts[1].y)
                        if (spts.length >= 3) {
                            const yOff = spts[2].y - spts[1].y
                            dist = Math.min(dist, distToSegment(mx, my, spts[0].x, spts[0].y + yOff, spts[1].x, spts[1].y + yOff))
                        }
                    }
                    break
                }
                case 'ray': {
                    if (spts.length >= 2 && chart) {
                        const [x1, y1] = [spts[0].x, spts[0].y]
                        const [x2, y2] = [spts[1].x, spts[1].y]
                        const dx = x2 - x1, dy = y2 - y1
                        const w = chart.timeScale().width()
                        const extX = dx > 0 ? w + 200 : -200
                        const extY = y1 + (dx !== 0 ? (dy / dx) * (extX - x1) : (dy > 0 ? 10000 : -10000))
                        dist = distToSegment(mx, my, x1, y1, extX, extY)
                    }
                    break
                }
                case 'extended': {
                    if (spts.length >= 2 && chart) {
                        const [x1, y1] = [spts[0].x, spts[0].y]
                        const [x2, y2] = [spts[1].x, spts[1].y]
                        const dx = x2 - x1, dy = y2 - y1
                        if (dx !== 0) {
                            const slope = dy / dx
                            const w = chart.timeScale().width()
                            dist = distToSegment(mx, my, -200, y1 + slope * (-200 - x1), w + 200, y1 + slope * (w + 200 - x1))
                        } else {
                            dist = Math.abs(mx - x1)
                        }
                    }
                    break
                }
                default: {
                    // line, arrow
                    if (spts.length >= 2) dist = distToSegment(mx, my, spts[0].x, spts[0].y, spts[1].x, spts[1].y)
                    else if (spts.length === 1) dist = distPt(mx, my, spts[0].x, spts[0].y)
                }
            }

            if (dist < minDist) { minDist = dist; foundId = d.id }
        }
        return foundId
    }, [chart, pointToScreen, priceToScreenY])

    // ── Mouse button tracking (enables drag detection) ────────────────────────
    useEffect(() => {
        const onDown = () => {
            isMouseDownRef.current = true
            dragInitRef.current = false
        }
        const onUp = () => {
            isMouseDownRef.current = false
            dragInitRef.current = false
            if (isDraggingRef.current) {
                // Re-enable chart scroll after drag ends
                S.current.chart?.applyOptions({ handleScroll: { pressedMouseMove: true } })
            }
            isDraggingRef.current = false
            dragStartRef.current = null
            dragPointIdxRef.current = null
        }
        window.addEventListener('mousedown', onDown)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousedown', onDown)
            window.removeEventListener('mouseup', onUp)
        }
    }, [])

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        const dn = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true)
            if (e.key === 'Control') setIsCtrlPressed(true)
            if (e.key === 'Escape') { setSelectedDrawingId(null); setCurrentDrawing(null) }
            if ((e.key === 'Delete' || e.key === 'Backspace') && S.current.selectedDrawingId) {
                const sel = S.current.drawings.find(d => d.id === S.current.selectedDrawingId)
                if (sel && !sel.locked) {
                    onDrawingsChange?.(S.current.drawings.filter(d => d.id !== S.current.selectedDrawingId))
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
    }, [onDrawingsChange])

    // ── Chart event handlers (stable, read from S.current) ────────────────────
    const handleMouseMove = useCallback((param: MouseEventParams) => {
        const { activeTool, drawings, selectedDrawingId } = S.current
        const point = getPointFromEvent(param)
        if (!point) { setMousePos(null); return }
        setMousePos(point)

        const mx = param.point?.x ?? -9999
        const my = param.point?.y ?? -9999

        // ── 1. Handle dragging a control point ──
        if (isDraggingRef.current && dragPointIdxRef.current !== null && selectedDrawingId && onDrawingsChange) {
            onDrawingsChange(drawings.map(d => {
                if (d.id !== selectedDrawingId) return d
                const np = [...d.points]
                np[dragPointIdxRef.current!] = point
                return { ...d, points: np }
            }))
            return
        }

        // ── 2. Handle dragging whole drawing ──
        if (isDraggingRef.current && dragStartRef.current && selectedDrawingId && onDrawingsChange && chart) {
            const prevPoint = dragStartRef.current
            const priceDelta = point.price - prevPoint.price
            const ps = pointToScreen(prevPoint)
            const cs = pointToScreen(point)
            let timeDelta = 0
            if (ps && cs) {
                const sl = chart.timeScale().coordinateToLogical(ps.x)
                const cl = chart.timeScale().coordinateToLogical(cs.x)
                if (sl !== null && cl !== null) timeDelta = Math.round(cl - sl)
            }
            dragStartRef.current = point
            onDrawingsChange(drawings.map(d => {
                if (d.id !== selectedDrawingId) return d
                return {
                    ...d, points: d.points.map(p => {
                        const sp = pointToScreen(p)
                        if (!sp) return { ...p, price: p.price + priceDelta }
                        const pl = chart!.timeScale().coordinateToLogical(sp.x)
                        if (pl === null) return { ...p, price: p.price + priceDelta }
                        const nc = chart!.timeScale().logicalToCoordinate((pl + timeDelta) as any)
                        if (nc !== null) {
                            const nt = chart!.timeScale().coordinateToTime(nc)
                            if (nt) return { time: nt, price: p.price + priceDelta }
                        }
                        return { ...p, price: p.price + priceDelta }
                    })
                }
            }))
            return
        }

        // ── 3. Proximity detection → update hoveredDrawingId ──
        if (activeTool === 'cursor') {
            const foundId = detectHover(mx, my, drawings)
            if (foundId !== S.current.hoveredDrawingId) setHoveredDrawingId(foundId)

            // ── 4. Start drag if mouse is held down over selected drawing ──
            if (isMouseDownRef.current && !dragInitRef.current && foundId && foundId === selectedDrawingId) {
                dragInitRef.current = true
                const selDrawing = drawings.find(d => d.id === foundId)
                if (selDrawing && !selDrawing.locked && param.point) {
                    // Check if near a handle point (endpoint of drawing)
                    let nearHandle = -1
                    for (let i = 0; i < selDrawing.points.length; i++) {
                        const sp = pointToScreen(selDrawing.points[i])
                        if (sp && distPt(mx, my, sp.x, sp.y) < 12) { nearHandle = i; break }
                    }
                    if (nearHandle !== -1) {
                        dragPointIdxRef.current = nearHandle
                    } else {
                        dragStartRef.current = point
                    }
                    isDraggingRef.current = true
                    // Prevent chart from panning while a drawing is being dragged
                    chart?.applyOptions({ handleScroll: { pressedMouseMove: false } })
                }
            }
        }
    }, [chart, getPointFromEvent, pointToScreen, detectHover, onDrawingsChange])

    const handleClick = useCallback((param: MouseEventParams) => {
        if (S.current.isReplaySelectionMode) return

        // Ignore clicks that were actually drag releases
        if (isDraggingRef.current) return

        const rawPoint = getPointFromEvent(param)
        if (!rawPoint) return
        const point = getMagnetPoint(rawPoint)
        const { activeTool, currentDrawing, hoveredDrawingId, drawings } = S.current

        // ── Drawing mode ──
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
                if (['horizontal', 'vertical'].includes(activeTool)) {
                    const nd: Drawing = { id: crypto.randomUUID(), type: activeTool, points: [point], color: '#2962FF', lineWidth: 2, lineStyle: 'solid' }
                    onDrawingsChange?.([...drawings, nd])
                    onToolComplete()
                    return
                }
                setCurrentDrawing({ id: crypto.randomUUID(), type: activeTool, points: [point], color: '#2962FF', lineWidth: 2, lineStyle: 'solid' })
            } else {
                const pts = currentDrawing.points || []
                let finalPoint = getMagnetPoint(rawPoint)
                if (!['zone', 'measure', 'channel'].includes(activeTool)) {
                    finalPoint = getAnglePoint(pts[0], finalPoint)
                }
                const newPts = [...pts, finalPoint]

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

        // ── Cursor mode: select/deselect ──
        const clicked = detectHover(param.point?.x ?? -9999, param.point?.y ?? -9999, drawings)
        if (clicked) {
            setSelectedDrawingId(clicked)
        } else if (!isDraggingRef.current) {
            setSelectedDrawingId(null)
        }
    }, [getPointFromEvent, getMagnetPoint, getAnglePoint, detectHover, onDrawingsChange, onToolComplete])

    const handleDoubleClick = useCallback((param: MouseEventParams) => {
        const { drawings } = S.current
        const clicked = detectHover(param.point?.x ?? -9999, param.point?.y ?? -9999, drawings)
        if (clicked && onEditDrawing) {
            const d = drawings.find(x => x.id === clicked)
            if (d) onEditDrawing(d)
        }
    }, [detectHover, onEditDrawing])

    // ── Subscribe to chart events (ONCE per chart instance) ──────────────────
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
    }, [chart, handleClick, handleMouseMove, handleDoubleClick])

    // Re-render on chart scroll/zoom so drawings follow the price/time scale
    useEffect(() => {
        if (!chart) return
        const fn = () => setTick(t => t + 1)
        chart.timeScale().subscribeVisibleTimeRangeChange(fn)
        return () => chart.timeScale().unsubscribeVisibleTimeRangeChange(fn)
    }, [chart])

    // ── Toolbar position ──────────────────────────────────────────────────────
    const selectedDrawing = selectedDrawingId ? drawings.find(d => d.id === selectedDrawingId) : null
    useEffect(() => {
        if (!selectedDrawing) { setToolbarPos(null); return }
        const sp = pointToScreen(selectedDrawing.points[0])
        if (sp) setToolbarPos({ x: sp.x, y: sp.y })
    })

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
            let pp = getMagnetPoint(mousePos)
            if (!['zone', 'measure', 'channel'].includes(d.type!)) {
                pp = getAnglePoint(d.points[0], pp)
            }
            pointsToRender = [...d.points, pp]
        }

        const screenPoints = pointsToRender.map(pointToScreen).filter(Boolean) as { x: number; y: number }[]
        const isSelected = !isPreview && d.id === selectedDrawingId
        const isHovered  = !isPreview && d.id === hoveredDrawingId
        const isActive   = isSelected || isHovered
        const locked     = (d as Drawing).locked

        const style = {
            stroke: d.color || '#2962FF',
            strokeWidth: (d.lineWidth || 2) as number,
            strokeDasharray: d.lineStyle === 'dashed' ? '8,4' : d.lineStyle === 'dotted' ? '2,3' : undefined,
        }

        // Visual indicator: glow on hover, brighter on select
        const glowFilter = isSelected ? `drop-shadow(0 0 4px ${d.color || '#2962FF'})` : isHovered ? `drop-shadow(0 0 2px ${d.color || '#2962FF'})` : undefined

        const Handle = ({ cx, cy, idx }: { cx: number; cy: number; idx: number }) => (
            <circle
                cx={cx} cy={cy} r={5}
                fill="white" stroke={d.color || '#2962FF'} strokeWidth={2}
                className={locked ? 'cursor-not-allowed' : 'cursor-move'}
            />
        )

        switch (d.type) {
            case 'line':
            case 'arrow': {
                if (screenPoints.length < 2)
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const [p1, p2] = screenPoints
                const arrowId = `arrow-${d.id}`
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        {d.type === 'arrow' && (
                            <defs>
                                <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                                    <path d="M0,0 L0,6 L8,3 z" fill={d.color || '#2962FF'} />
                                </marker>
                            </defs>
                        )}
                        {/* Fat invisible line for easier hit detection (handled via detectHover) */}
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={20} />
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...style} markerEnd={d.type === 'arrow' ? `url(#${arrowId})` : undefined} />
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'ray': {
                if (screenPoints.length < 2)
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                let [x1, y1] = [screenPoints[0].x, screenPoints[0].y]
                let [x2, y2] = [screenPoints[1].x, screenPoints[1].y]
                if (chart) {
                    const dx = x2 - x1; const dy = y2 - y1; const w = chart.timeScale().width()
                    if (dx !== 0) { const slope = dy / dx; x2 = dx > 0 ? w + 200 : -200; y2 = y1 + slope * (x2 - x1) }
                    else y2 = dy > 0 ? 10000 : -10000
                }
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        <line x1={screenPoints[0].x} y1={screenPoints[0].y} x2={x2} y2={y2} stroke="transparent" strokeWidth={20} />
                        <line x1={screenPoints[0].x} y1={screenPoints[0].y} x2={x2} y2={y2} {...style} />
                        {isActive && <Handle cx={screenPoints[0].x} cy={screenPoints[0].y} idx={0} />}
                        {isActive && screenPoints[1] && <Handle cx={screenPoints[1].x} cy={screenPoints[1].y} idx={1} />}
                    </g>
                )
            }

            case 'extended': {
                if (screenPoints.length < 2)
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                let [x1, y1] = [screenPoints[0].x, screenPoints[0].y]
                let [x2, y2] = [screenPoints[1].x, screenPoints[1].y]
                if (chart) {
                    const dx = x2 - x1; const dy = y2 - y1; const w = chart.timeScale().width()
                    if (dx !== 0) {
                        const slope = dy / dx
                        x1 = -200; y1 = screenPoints[0].y + slope * (-200 - screenPoints[0].x)
                        x2 = w + 200; y2 = screenPoints[0].y + slope * (w + 200 - screenPoints[0].x)
                    }
                }
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
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
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        <line x1={0} y1={yPos} x2="100%" y2={yPos} stroke="transparent" strokeWidth={20} />
                        <line x1={0} y1={yPos} x2="100%" y2={yPos} {...style} />
                        <text x={4} y={yPos - 4} fill={d.color || '#2962FF'} fontSize={10} fontFamily="monospace">{d.label || ''}</text>
                        {isActive && anchorX && <Handle cx={anchorX.x} cy={yPos} idx={0} />}
                    </g>
                )
            }

            case 'vertical': {
                const vsp = screenPoints[0] || pointToScreen(d.points[0])
                if (!vsp) return null
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        <line x1={vsp.x} y1={0} x2={vsp.x} y2="100%" stroke="transparent" strokeWidth={20} />
                        <line x1={vsp.x} y1={0} x2={vsp.x} y2="100%" {...style} />
                        {isActive && <Handle cx={vsp.x} cy={vsp.y} idx={0} />}
                    </g>
                )
            }

            case 'zone':
            case 'measure': {
                if (screenPoints.length < 2)
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const bx = Math.min(screenPoints[0].x, screenPoints[1].x)
                const by = Math.min(screenPoints[0].y, screenPoints[1].y)
                const bw = Math.abs(screenPoints[0].x - screenPoints[1].x)
                const bh = Math.abs(screenPoints[0].y - screenPoints[1].y)
                const pctChange = pointsToRender.length >= 2
                    ? ((pointsToRender[1].price - pointsToRender[0].price) / pointsToRender[0].price * 100).toFixed(2)
                    : '0.00'
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        <rect x={bx} y={by} width={bw} height={bh} fill={style.stroke} fillOpacity={isSelected ? 0.18 : 0.1} stroke={style.stroke} strokeWidth={1} strokeDasharray={style.strokeDasharray} />
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
                if (screenPoints.length < 2)
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const [cp1, cp2] = screenPoints
                const cp3 = screenPoints[2]
                const priceOffset = cp3 && pointsToRender.length >= 3 ? (pointsToRender[2].price - pointsToRender[1].price) : 0
                const yOffset = cp3 ? cp3.y - cp2.y : (priceToScreenY(pointsToRender[0].price + priceOffset) ?? cp1.y) - cp1.y
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        <line x1={cp1.x} y1={cp1.y} x2={cp2.x} y2={cp2.y} stroke="transparent" strokeWidth={20} />
                        <line x1={cp1.x} y1={cp1.y} x2={cp2.x} y2={cp2.y} {...style} />
                        <line x1={cp1.x} y1={cp1.y + yOffset} x2={cp2.x} y2={cp2.y + yOffset} {...style} strokeDasharray="6,3" />
                        <polygon
                            points={`${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${cp2.x},${cp2.y + yOffset} ${cp1.x},${cp1.y + yOffset}`}
                            fill={style.stroke} fillOpacity={0.07} stroke="none" />
                        {isActive && screenPoints.map((p, i) => <Handle key={i} cx={p.x} cy={p.y} idx={i} />)}
                    </g>
                )
            }

            case 'fibonacci': {
                if (screenPoints.length < 2)
                    return screenPoints[0] ? <circle key={d.id} cx={screenPoints[0].x} cy={screenPoints[0].y} r={4} fill="#2962FF" /> : null
                const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
                const fibColors = ['#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#F44336']
                const pHigh = pointsToRender[0].price
                const pLow  = pointsToRender[1].price
                const range = pHigh - pLow
                const xLeft  = Math.min(screenPoints[0].x, screenPoints[1].x)
                const xRight = Math.max(screenPoints[0].x, screenPoints[1].x)
                return (
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
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
                    <g key={d.id || 'preview'} filter={glowFilter} className="pointer-events-none">
                        {isActive && (
                            <rect x={txPos.x - 2} y={tyPos - (d.lineWidth || 14)} width={(d.text?.length || 1) * ((d.lineWidth || 14) * 0.6) + 4} height={(d.lineWidth || 14) + 4}
                                fill="transparent" stroke={d.color || '#FFFFFF'} strokeWidth={0.5} strokeDasharray="3,2" rx={2} />
                        )}
                        <text x={txPos.x} y={tyPos} fill={d.color || '#FFFFFF'} fontSize={d.lineWidth || 14} fontFamily="Inter, monospace" fontWeight="600" style={{ userSelect: 'none' }}>
                            {d.text || ''}
                        </text>
                        {isActive && <Handle cx={txPos.x} cy={tyPos} idx={0} />}
                    </g>
                )
            }

            default:
                return null
        }
    }

    // ─── Floating Toolbar (HTML, not SVG → events work normally) ─────────────
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
                <button onClick={() => onEditDrawing?.(selectedDrawing)} title="Налаштування"
                    className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors">
                    <Settings className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#363A45] mx-0.5" />

                <button onClick={() => {
                    onDrawingsChange?.(drawings.map(d => d.id === selectedDrawing.id ? { ...d, locked: !d.locked } : d))
                }}
                    title={selectedDrawing.locked ? 'Розблокувати' : 'Заблокувати'}
                    className={`p-1.5 hover:bg-white/10 rounded transition-colors ${selectedDrawing.locked ? 'text-yellow-400' : 'text-gray-300 hover:text-white'}`}>
                    {selectedDrawing.locked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                </button>

                <button onClick={() => {
                    const copy: Drawing = { ...selectedDrawing, id: crypto.randomUUID(), points: selectedDrawing.points.map(p => ({ ...p, price: p.price * 1.001 })) }
                    onDrawingsChange?.([...drawings, copy])
                }}
                    title="Дублювати"
                    className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#363A45] mx-0.5" />

                <button onClick={() => {
                    if (!selectedDrawing.locked) {
                        onDrawingsChange?.(drawings.filter(d => d.id !== selectedDrawingId))
                        setSelectedDrawingId(null)
                    }
                }}
                    title="Видалити (Del)"
                    className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" ref={overlayRef}>
            <svg className="w-full h-full pointer-events-none">
                {drawings.map(d => renderDrawing(d))}
                {currentDrawing && renderDrawing(currentDrawing as Drawing, true)}
                {renderReplayCursor()}
            </svg>
            {/* Floating toolbar is HTML, so pointer-events work normally */}
            {renderFloatingToolbar()}
        </div>
    )
}
