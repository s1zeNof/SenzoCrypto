import { useState, useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'

interface DrawingSettingsModalProps {
    drawing: any
    onSave: (updatedDrawing: any) => void
    onDelete: (id: string) => void
    onClose: () => void
    /** Called on every field change so the chart updates in real-time */
    onPreview?: (drawing: any) => void
}

const TOOL_LABELS: Record<string, string> = {
    line: 'Trend Line',
    ray: 'Ray',
    extended: 'Extended Line',
    horizontal: 'Horizontal Line',
    vertical: 'Vertical Line',
    arrow: 'Arrow',
    zone: 'Rectangle / Zone',
    channel: 'Parallel Channel',
    fibonacci: 'Fibonacci',
    measure: 'Price Range',
    text: 'Text',
}

export default function DrawingSettingsModal({ drawing, onSave, onDelete, onClose, onPreview }: DrawingSettingsModalProps) {
    const [color, setColor] = useState(drawing.color || '#2962FF')
    const [lineWidth, setLineWidth] = useState(drawing.lineWidth || 2)
    const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>(drawing.lineStyle || 'solid')
    const [text, setText] = useState(drawing.text || '')
    const [label, setLabel] = useState(drawing.label || '')
    const [points, setPoints] = useState(drawing.points || [])

    // Sync state when a new drawing is passed (e.g. user switches selection)
    useEffect(() => {
        setColor(drawing.color || '#2962FF')
        setLineWidth(drawing.lineWidth || 2)
        setLineStyle(drawing.lineStyle || 'solid')
        setText(drawing.text || '')
        setLabel(drawing.label || '')
        setPoints(drawing.points || [])
    }, [drawing.id]) // only re-sync when a DIFFERENT drawing is opened

    // ── Live preview ──────────────────────────────────────────────────────────
    // Skip first render (state already matches current drawing) and call
    // onPreview on every subsequent change so the chart updates in real-time.
    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return }
        onPreview?.({ ...drawing, color, lineWidth, lineStyle, text, label, points })
    }, [color, lineWidth, lineStyle, text, label, points]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = () => {
        onSave({ ...drawing, color, lineWidth, lineStyle, text, label, points })
        onClose()
    }

    const updatePointPrice = (index: number, value: string) => {
        const np = [...points]
        np[index] = { ...np[index], price: parseFloat(value) }
        setPoints(np)
    }

    const isText = drawing.type === 'text'
    const isHorizontal = drawing.type === 'horizontal'
    const typeName = TOOL_LABELS[drawing.type] || drawing.type

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in">
            <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl shadow-2xl w-[380px] overflow-hidden text-[#D9D9D9] animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#2A2E39]">
                    <h3 className="font-semibold text-white text-sm">{typeName}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 space-y-4">

                    {/* Text content (for text tool) */}
                    {isText && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-1.5">Текст</label>
                            <input
                                type="text"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                className="w-full bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-3 py-2 text-sm text-white outline-none"
                                placeholder="Введіть текст..."
                            />
                        </div>
                    )}

                    {/* Label for horizontal lines */}
                    {isHorizontal && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-1.5">Підпис лінії</label>
                            <input
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                className="w-full bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-3 py-2 text-sm text-white outline-none"
                                placeholder="Напр. Support / Resistance..."
                            />
                        </div>
                    )}

                    {/* Style */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Стиль</label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Color */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Колір</label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={e => setColor(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-8 h-8 rounded border border-[#363A45] cursor-pointer" style={{ backgroundColor: color }} />
                                    </div>
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        className="flex-1 min-w-0 bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-2 py-1.5 text-xs text-white outline-none font-mono"
                                    />
                                </div>
                            </div>

                            {/* Width */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    {isText ? 'Розмір' : 'Товщина'}
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="range"
                                        min={isText ? 8 : 1}
                                        max={isText ? 48 : 8}
                                        value={lineWidth}
                                        onChange={e => setLineWidth(Number(e.target.value))}
                                        className="flex-1 accent-[#2962FF] h-1"
                                    />
                                    <span className="text-xs text-white w-5 text-right">{lineWidth}</span>
                                </div>
                            </div>
                        </div>

                        {/* Line style (not for text) */}
                        {!isText && (
                            <div className="mt-3">
                                <label className="text-xs text-gray-500 mb-1.5 block">Тип лінії</label>
                                <div className="flex gap-2">
                                    {(['solid', 'dashed', 'dotted'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setLineStyle(s)}
                                            className={`flex-1 py-1.5 text-xs border rounded transition-colors ${lineStyle === s ? 'border-[#2962FF] text-[#2962FF] bg-[#2962FF]/10' : 'border-[#363A45] text-gray-400 hover:bg-white/5'}`}
                                        >
                                            {s === 'solid' ? '———' : s === 'dashed' ? '- - -' : '· · ·'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coordinates (price only) */}
                    {points.length > 0 && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Координати</label>
                            <div className="space-y-2">
                                {points.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-14 flex-shrink-0">Точка {i + 1}</span>
                                        <input
                                            type="number"
                                            value={p.price}
                                            step="0.01"
                                            onChange={e => updatePointPrice(i, e.target.value)}
                                            className="flex-1 bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-2 py-1.5 text-xs text-white outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[#2A2E39] flex justify-between items-center">
                    <button
                        onClick={() => { onDelete(drawing.id); onClose() }}
                        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Видалити
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-400 hover:text-white border border-[#363A45] rounded hover:bg-white/5 transition-colors">
                            Скасувати
                        </button>
                        <button onClick={handleSave} className="px-5 py-1.5 text-xs bg-[#2962FF] hover:bg-[#2962FF]/90 text-white rounded font-semibold transition-colors">
                            Зберегти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
