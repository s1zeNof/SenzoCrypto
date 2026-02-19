import { ChevronUp, ChevronDown, X, Settings } from 'lucide-react'

interface BottomPanelProps {
    isOpen: boolean
    onToggle: () => void
    activeIndicators: string[]
    onRemoveIndicator: (id: string) => void
    onEditIndicator: (id: string) => void
}

export default function BottomPanel({
    isOpen,
    onToggle,
    activeIndicators,
    onRemoveIndicator,
    onEditIndicator
}: BottomPanelProps) {

    return (
        <div className={`border-t border-border bg-surface flex flex-col transition-all duration-300 ${isOpen ? 'h-64' : 'h-8'}`}>
            {/* Header / Tabs */}
            <div
                className="flex items-center h-8 bg-surface border-b border-border select-none px-2 cursor-pointer hover:bg-white/5"
                onClick={onToggle}
            >
                <div className="mr-4 text-gray-200 flex items-center gap-1 font-bold">
                    <span className="text-xs uppercase">Активні Індикатори ({activeIndicators.length})</span>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>

                {/* Visual Fake Tabs */}
                <div className="flex gap-4 text-xs text-gray-500 font-medium ml-4">
                    <span className="hover:text-gray-300">Stock Screener</span>
                    <span className="hover:text-gray-300">Pine Editor</span>
                    <span className="hover:text-gray-300">Strategy Tester</span>
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="flex-1 overflow-auto p-4 bg-[#1e222d]">
                    <div className="grid grid-cols-1 gap-2">
                        {activeIndicators.length === 0 && (
                            <div className="text-gray-500 text-sm italic flex items-center justify-center h-full">
                                Немає активних індикаторів. Додайте їх через верхнє меню або подвійний клік на графіку.
                            </div>
                        )}

                        {activeIndicators.map(id => (
                            <div key={id} className="flex items-center justify-between p-3 bg-surface border border-border rounded hover:border-primary/50 group transition-colors">
                                <div
                                    className="flex items-center gap-3 cursor-pointer select-none"
                                    onDoubleClick={() => onEditIndicator(id)}
                                >
                                    <span className="text-sm font-bold text-blue-400 uppercase">{id} Indicator</span>
                                    <span className="text-[10px] text-gray-500 bg-black/20 px-1.5 py-0.5 rounded">Double-click to edit</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEditIndicator(id)}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                        title="Settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemoveIndicator(id)}
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                        title="Remove"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
