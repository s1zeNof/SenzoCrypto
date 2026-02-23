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
    line:       'Trend Line',
    ray:        'Ray',
    extended:   'Extended Line',
    horizontal: 'Horizontal Line',
    vertical:   'Vertical Line',
    arrow:      'Arrow',
    zone:       'Rectangle / Zone',
    channel:    'Parallel Channel',
    fibonacci:  'Fibonacci',
    measure:    'Price Range',
    text:       'Text',
    long:       'Довга позиція',
    short:      'Коротка позиція',
}

// ─── Tiny color-picker swatch ──────────────────────────────────────────────────
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative w-7 h-7 flex-shrink-0">
            <input type="color" value={value} onChange={e => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="w-7 h-7 rounded border border-[#363A45] cursor-pointer"
                style={{ backgroundColor: value }} />
        </div>
    )
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
    return (
        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider pt-3 pb-1 border-t border-[#2A2E39] mt-1">
            {title}
        </div>
    )
}

// ─── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-xs text-gray-400 flex-shrink-0 w-36">{label}</span>
            <div className="flex items-center gap-1.5 flex-1 justify-end">{children}</div>
        </div>
    )
}

// ─── Number input ──────────────────────────────────────────────────────────────
function NumInput({ value, onChange, step = 0.01, min, className = '' }:
    { value: string; onChange: (v: string) => void; step?: number; min?: number; className?: string }) {
    return (
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
            step={step} min={min}
            className={`bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-2 py-1 text-xs text-white outline-none w-24 text-right ${className}`} />
    )
}

export default function DrawingSettingsModal({ drawing, onSave, onDelete, onClose, onPreview }: DrawingSettingsModalProps) {
    // ─── Common fields ─────────────────────────────────────────────────────────
    const [color,     setColor]     = useState(drawing.color || '#2962FF')
    const [lineWidth, setLineWidth] = useState(drawing.lineWidth || 2)
    const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>(drawing.lineStyle || 'solid')
    const [text,      setText]      = useState(drawing.text  || '')
    const [label,     setLabel]     = useState(drawing.label || '')
    const [points,    setPoints]    = useState(drawing.points || [])

    // ─── Position tool — Аргументи ─────────────────────────────────────────────
    const [stopLoss,    setStopLoss]    = useState<string>((drawing.stopLoss   ?? '').toString())
    const [takeProfit,  setTakeProfit]  = useState<string>((drawing.takeProfit ?? '').toString())
    const [quantity,    setQuantity]    = useState<string>((drawing.quantity   ?? 1).toString())
    const [accountSize, setAccountSize] = useState<string>((drawing.accountSize ?? 1000).toString())
    const [risk,        setRisk]        = useState<string>((drawing.risk       ?? 2).toString())
    const [leverage,    setLeverage]    = useState<string>((drawing.leverage   ?? 1).toString())

    // ─── Position tool — Стиль ──────────────────────────────────────────────────
    const [stopColor,        setStopColor]        = useState(drawing.stopColor        || '#EF5350')
    const [targetColor,      setTargetColor]      = useState(drawing.targetColor      || '#26A69A')
    const [textSize,         setTextSize]         = useState<number>(drawing.textSize ?? 10)
    const [showPriceLabels,  setShowPriceLabels]  = useState<boolean>(drawing.showPriceLabels  !== false)
    const [alwaysShowValues, setAlwaysShowValues] = useState<boolean>(drawing.alwaysShowValues === true)
    const [abbreviated,      setAbbreviated]      = useState<boolean>(drawing.abbreviated      === true)

    // ─── Tab state ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'args' | 'style' | 'visibility'>('args')

    // Sync when a different drawing is opened
    useEffect(() => {
        setColor(drawing.color || '#2962FF')
        setLineWidth(drawing.lineWidth || 2)
        setLineStyle(drawing.lineStyle || 'solid')
        setText(drawing.text  || '')
        setLabel(drawing.label || '')
        setPoints(drawing.points || [])
        setStopLoss((drawing.stopLoss   ?? '').toString())
        setTakeProfit((drawing.takeProfit ?? '').toString())
        setQuantity((drawing.quantity   ?? 1).toString())
        setAccountSize((drawing.accountSize ?? 1000).toString())
        setRisk((drawing.risk       ?? 2).toString())
        setLeverage((drawing.leverage   ?? 1).toString())
        setStopColor(drawing.stopColor        || '#EF5350')
        setTargetColor(drawing.targetColor      || '#26A69A')
        setTextSize(drawing.textSize ?? 10)
        setShowPriceLabels(drawing.showPriceLabels  !== false)
        setAlwaysShowValues(drawing.alwaysShowValues === true)
        setAbbreviated(drawing.abbreviated      === true)
    }, [drawing.id])

    const isPosition = drawing.type === 'long' || drawing.type === 'short'
    const isText       = drawing.type === 'text'
    const isHorizontal = drawing.type === 'horizontal'
    const typeName     = TOOL_LABELS[drawing.type] || drawing.type

    // ── Derived position values ───────────────────────────────────────────────
    const entryPrice = points[0]?.price ?? 0
    const slVal      = parseFloat(stopLoss)   || 0
    const tpVal      = parseFloat(takeProfit) || 0
    const qty        = parseFloat(quantity)   || 1
    const acct       = parseFloat(accountSize)|| 0
    const riskVal    = parseFloat(risk)       || 0
    const tpPrice    = tpVal
    const slTicks    = entryPrice > 0 ? Math.abs(entryPrice - slVal).toFixed(2) : '—'
    const tpTicks    = entryPrice > 0 ? Math.abs(tpPrice - entryPrice).toFixed(2) : '—'
    const riskReward = (slVal && tpVal && entryPrice)
        ? (Math.abs(tpVal - entryPrice) / Math.abs(entryPrice - slVal)).toFixed(2) : '—'

    // ── Live preview ──────────────────────────────────────────────────────────
    const isFirstRender = useRef(true)
    const buildPreview = () => ({
        ...drawing, color, lineWidth, lineStyle, text, label, points,
        ...(isPosition && {
            stopLoss:        parseFloat(stopLoss)   || undefined,
            takeProfit:      parseFloat(takeProfit) || undefined,
            quantity:        qty,
            accountSize:     acct,
            risk:            riskVal,
            leverage:        parseFloat(leverage) || 1,
            stopColor, targetColor, textSize,
            showPriceLabels, alwaysShowValues, abbreviated,
        }),
    })

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return }
        onPreview?.(buildPreview())
    }, [color, lineWidth, lineStyle, text, label, points, stopLoss, takeProfit,
        quantity, accountSize, risk, leverage, stopColor, targetColor, textSize,
        showPriceLabels, alwaysShowValues, abbreviated]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = () => { onSave(buildPreview()); onClose() }

    const updatePointPrice = (index: number, value: string) => {
        const np = [...points]
        np[index] = { ...np[index], price: parseFloat(value) }
        setPoints(np)
    }

    // ── Position settings with tabs ───────────────────────────────────────────
    if (isPosition) {
        const TABS = [
            { id: 'args',       label: 'Аргументи' },
            { id: 'style',      label: 'Стиль'     },
            { id: 'visibility', label: 'Видимість' },
        ] as const

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in">
                <div className="bg-[#1E222D] border border-[#2A2E39] rounded-xl shadow-2xl w-[360px] overflow-hidden text-[#D9D9D9] animate-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex justify-between items-center px-4 pt-3 pb-0 border-b border-[#2A2E39]">
                        <h3 className="font-semibold text-white text-sm pb-3">{typeName}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors pb-3">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tab bar */}
                    <div className="flex border-b border-[#2A2E39]">
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`flex-1 text-xs py-2 font-medium transition-colors border-b-2 ${
                                    activeTab === t.id
                                        ? 'text-white border-[#2962FF]'
                                        : 'text-gray-500 border-transparent hover:text-gray-300'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="px-4 py-3 space-y-0.5 max-h-[420px] overflow-y-auto custom-scrollbar">

                        {/* ── АРГУМЕНТИ ── */}
                        {activeTab === 'args' && (
                            <>
                                <FieldRow label="Розмір рахунку">
                                    <NumInput value={accountSize} onChange={setAccountSize} step={100} min={0} />
                                    <span className="text-xs text-gray-500">USDT</span>
                                </FieldRow>
                                <FieldRow label="Розмір лота">
                                    <NumInput value={quantity} onChange={setQuantity} step={0.01} min={0} />
                                </FieldRow>
                                <FieldRow label="Ризик">
                                    <NumInput value={risk} onChange={setRisk} step={0.1} min={0} />
                                    <span className="text-xs text-gray-500">%</span>
                                </FieldRow>
                                <FieldRow label="Ціна відкриття">
                                    <NumInput value={entryPrice.toString()} onChange={v => updatePointPrice(0, v)} step={0.01} />
                                </FieldRow>
                                <FieldRow label="Кредитне плечо">
                                    <NumInput value={leverage} onChange={setLeverage} step={1} min={1} />
                                    <span className="text-xs text-gray-500">x</span>
                                </FieldRow>

                                <SectionHeader title="Рівень прибутку" />
                                <FieldRow label="В тиках">
                                    <span className="text-xs font-mono text-green-400">{tpTicks}</span>
                                </FieldRow>
                                <FieldRow label="Ціна">
                                    <NumInput value={takeProfit} onChange={setTakeProfit} step={0.01}
                                        className="border-green-500/30 focus:border-green-400" />
                                </FieldRow>

                                <SectionHeader title="Стоп-рівень" />
                                <FieldRow label="В тиках">
                                    <span className="text-xs font-mono text-red-400">{slTicks}</span>
                                </FieldRow>
                                <FieldRow label="Ціна">
                                    <NumInput value={stopLoss} onChange={setStopLoss} step={0.01}
                                        className="border-red-500/30 focus:border-red-400" />
                                </FieldRow>

                                {/* R:R summary */}
                                {riskReward !== '—' && (
                                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#2A2E39]">
                                        <span className="text-xs text-gray-500">Risk / Reward</span>
                                        <span className="text-xs font-mono font-bold text-white">1 : {riskReward}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── СТИЛЬ ── */}
                        {activeTab === 'style' && (
                            <>
                                <FieldRow label="Лінії (вхід)">
                                    <ColorInput value={color} onChange={setColor} />
                                    <div className="flex gap-1">
                                        {(['solid', 'dashed', 'dotted'] as const).map(s => (
                                            <button key={s} onClick={() => setLineStyle(s)}
                                                className={`px-1.5 py-0.5 text-[10px] border rounded transition-colors ${
                                                    lineStyle === s ? 'border-[#2962FF] text-[#2962FF]' : 'border-[#363A45] text-gray-500'}`}>
                                                {s === 'solid' ? '—' : s === 'dashed' ? '- -' : '···'}
                                            </button>
                                        ))}
                                    </div>
                                </FieldRow>
                                <FieldRow label="Колір стоп-рівня">
                                    <ColorInput value={stopColor} onChange={setStopColor} />
                                </FieldRow>
                                <FieldRow label="Колір цілі">
                                    <ColorInput value={targetColor} onChange={setTargetColor} />
                                </FieldRow>
                                <FieldRow label="Розмір тексту">
                                    <input type="range" min={8} max={18} value={textSize}
                                        onChange={e => setTextSize(Number(e.target.value))}
                                        className="w-20 accent-[#2962FF] h-1" />
                                    <span className="text-xs text-white w-4">{textSize}</span>
                                </FieldRow>

                                <SectionHeader title="Інформація" />
                                <FieldRow label="Мітки цін">
                                    <input type="checkbox" checked={showPriceLabels}
                                        onChange={e => setShowPriceLabels(e.target.checked)}
                                        className="accent-[#2962FF] w-4 h-4" />
                                </FieldRow>
                                <FieldRow label="Скорочені значення">
                                    <input type="checkbox" checked={abbreviated}
                                        onChange={e => setAbbreviated(e.target.checked)}
                                        className="accent-[#2962FF] w-4 h-4" />
                                </FieldRow>
                                <FieldRow label="Завжди відображати">
                                    <input type="checkbox" checked={alwaysShowValues}
                                        onChange={e => setAlwaysShowValues(e.target.checked)}
                                        className="accent-[#2962FF] w-4 h-4" />
                                </FieldRow>
                            </>
                        )}

                        {/* ── ВИДИМІСТЬ ── */}
                        {activeTab === 'visibility' && (
                            <div className="py-4 text-center text-xs text-gray-500">
                                Видимість буде доступна у наступному оновленні
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-[#2A2E39] flex justify-between items-center">
                        <button onClick={() => { onDelete(drawing.id); onClose() }}
                            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            Видалити
                        </button>
                        <div className="flex gap-2">
                            <button onClick={onClose}
                                className="px-4 py-1.5 text-xs text-gray-400 hover:text-white border border-[#363A45] rounded hover:bg-white/5 transition-colors">
                                Скасувати
                            </button>
                            <button onClick={handleSave}
                                className="px-5 py-1.5 text-xs bg-[#2962FF] hover:bg-[#2962FF]/90 text-white rounded font-semibold transition-colors">
                                Зберегти
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Non-position tools (existing UI) ─────────────────────────────────────
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
                    {/* Text content */}
                    {isText && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-1.5">Текст</label>
                            <input type="text" value={text} onChange={e => setText(e.target.value)}
                                className="w-full bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-3 py-2 text-sm text-white outline-none"
                                placeholder="Введіть текст..." />
                        </div>
                    )}

                    {/* Label for horizontal lines */}
                    {isHorizontal && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-1.5">Підпис лінії</label>
                            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
                                className="w-full bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-3 py-2 text-sm text-white outline-none"
                                placeholder="Напр. Support / Resistance..." />
                        </div>
                    )}

                    {/* Style */}
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Стиль</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Колір</label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        <input type="color" value={color} onChange={e => setColor(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="w-8 h-8 rounded border border-[#363A45] cursor-pointer" style={{ backgroundColor: color }} />
                                    </div>
                                    <input type="text" value={color} onChange={e => setColor(e.target.value)}
                                        className="flex-1 min-w-0 bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-2 py-1.5 text-xs text-white outline-none font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">{isText ? 'Розмір' : 'Товщина'}</label>
                                <div className="flex gap-2 items-center">
                                    <input type="range" min={isText ? 8 : 1} max={isText ? 48 : 8} value={lineWidth}
                                        onChange={e => setLineWidth(Number(e.target.value))}
                                        className="flex-1 accent-[#2962FF] h-1" />
                                    <span className="text-xs text-white w-5 text-right">{lineWidth}</span>
                                </div>
                            </div>
                        </div>
                        {!isText && (
                            <div className="mt-3">
                                <label className="text-xs text-gray-500 mb-1.5 block">Тип лінії</label>
                                <div className="flex gap-2">
                                    {(['solid', 'dashed', 'dotted'] as const).map(s => (
                                        <button key={s} onClick={() => setLineStyle(s)}
                                            className={`flex-1 py-1.5 text-xs border rounded transition-colors ${
                                                lineStyle === s ? 'border-[#2962FF] text-[#2962FF] bg-[#2962FF]/10' : 'border-[#363A45] text-gray-400 hover:bg-white/5'}`}>
                                            {s === 'solid' ? '———' : s === 'dashed' ? '- - -' : '· · ·'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coordinates */}
                    {points.length > 0 && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Координати</label>
                            <div className="space-y-2">
                                {points.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-14 flex-shrink-0">Точка {i + 1}</span>
                                        <input type="number" value={p.price} step="0.01"
                                            onChange={e => updatePointPrice(i, e.target.value)}
                                            className="flex-1 bg-[#2A2E39] border border-transparent focus:border-[#2962FF] rounded px-2 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[#2A2E39] flex justify-between items-center">
                    <button onClick={() => { onDelete(drawing.id); onClose() }}
                        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                        Видалити
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose}
                            className="px-4 py-1.5 text-xs text-gray-400 hover:text-white border border-[#363A45] rounded hover:bg-white/5 transition-colors">
                            Скасувати
                        </button>
                        <button onClick={handleSave}
                            className="px-5 py-1.5 text-xs bg-[#2962FF] hover:bg-[#2962FF]/90 text-white rounded font-semibold transition-colors">
                            Зберегти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
