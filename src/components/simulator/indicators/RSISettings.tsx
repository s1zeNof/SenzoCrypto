import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'

interface RSISettingsProps {
    settings: any // Using specific type would be better but for flexibility with new fields we use valid object structure
    onSave: (settings: any) => void
    onDelete: () => void
    onClose: () => void
}

export default function RSISettings({ settings, onSave, onDelete, onClose }: RSISettingsProps) {
    const [activeTab, setActiveTab] = useState<'arguments' | 'style'>('arguments')

    // Local state for all fields
    const [localSettings, setLocalSettings] = useState({
        // Arguments
        period: settings.period || 14,
        source: settings.source || 'close',
        showDeviation: settings.showDeviation || false,
        smoothingType: settings.smoothingType || 'sma',
        smoothingPeriod: settings.smoothingPeriod || 14,
        stdDev: settings.stdDev || 2,

        // Style
        color: settings.color || '#9C27B0', // RSI Main Line
        lineWidth: settings.lineWidth || 2,

        showMa: settings.showMa || true,
        maColor: settings.maColor || '#FFEB3B',
        maLineWidth: settings.maLineWidth || 1,

        showUpperBand: settings.showUpperBand ?? true, // Strict check for boolean
        upperBandValue: settings.upperBandValue || 70,
        upperBandColor: settings.upperBandColor || '#787B86',

        showMiddleBand: settings.showMiddleBand ?? true,
        middleBandValue: settings.middleBandValue || 50,
        middleBandColor: settings.middleBandColor || '#787B86',

        showLowerBand: settings.showLowerBand ?? true,
        lowerBandValue: settings.lowerBandValue || 30,
        lowerBandColor: settings.lowerBandColor || '#787B86',

        showBackground: settings.showBackground ?? true,
        backgroundColor: settings.backgroundColor || '#7E57C2', // Opacity handled via hex or separate alpha

        // Legacy compatibility
        overbought: settings.overbought || 70, // Synced with upperBandValue
        oversold: settings.oversold || 30, // Synced with lowerBandValue
    })

    const handleChange = (key: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            [key]: value,
            // Sync legacy fields
            ...(key === 'upperBandValue' ? { overbought: value } : {}),
            ...(key === 'lowerBandValue' ? { oversold: value } : {})
        }))
    }

    const handleSave = () => {
        onSave(localSettings)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1E222D] border border-[#2A2E39] rounded-lg shadow-2xl w-[400px] overflow-hidden text-[#D9D9D9]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[#2A2E39]">
                    <h3 className="font-semibold text-white">RSI</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#2A2E39]">
                    <button
                        onClick={() => setActiveTab('arguments')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'arguments' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Аргументи
                        {activeTab === 'arguments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('style')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'style' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Стиль
                        {activeTab === 'style' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    <button className="flex-1 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Видимість
                    </button>
                </div>

                {/* Content */}
                <div className="h-[400px] overflow-y-auto custom-scrollbar p-6 space-y-6">

                    {activeTab === 'arguments' && (
                        <>
                            {/* RSI Settings */}
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Налаштування RSI</div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm">Довжина RSI</label>
                                        <input
                                            type="number"
                                            value={localSettings.period}
                                            onChange={(e) => handleChange('period', Number(e.target.value))}
                                            className="w-24 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm">Дані</label>
                                        <select
                                            value={localSettings.source}
                                            onChange={(e) => handleChange('source', e.target.value)}
                                            className="w-24 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="close">Close</option>
                                            <option value="open">Open</option>
                                            <option value="high">High</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Smoothing */}
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Згладжування</div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm">Тип</label>
                                        <select
                                            value={localSettings.smoothingType}
                                            onChange={(e) => handleChange('smoothingType', e.target.value)}
                                            className="w-24 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="sma">SMA</option>
                                            <option value="ema">EMA</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm">Довжина</label>
                                        <input
                                            type="number"
                                            value={localSettings.smoothingPeriod}
                                            onChange={(e) => handleChange('smoothingPeriod', Number(e.target.value))}
                                            className="w-24 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'style' && (
                        <div className="space-y-4">
                            {/* RSI Line */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={true} readOnly
                                    className="accent-primary w-4 h-4 rounded-sm border-gray-600 bg-[#2A2E39]"
                                />
                                <span className="flex-1 text-sm">RSI</span>
                                <ColorPicker value={localSettings.color} onChange={c => handleChange('color', c)} />
                            </div>

                            {/* RSI MA */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={localSettings.showMa}
                                    onChange={e => handleChange('showMa', e.target.checked)}
                                    className="accent-primary w-4 h-4 rounded-sm border-gray-600 bg-[#2A2E39]"
                                />
                                <span className="flex-1 text-sm">RSI-based MA</span>
                                <ColorPicker value={localSettings.maColor} onChange={c => handleChange('maColor', c)} />
                            </div>

                            {/* Upper Band */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={localSettings.showUpperBand}
                                    onChange={e => handleChange('showUpperBand', e.target.checked)}
                                    className="accent-primary w-4 h-4 rounded-sm border-gray-600 bg-[#2A2E39]"
                                />
                                <span className="flex-1 text-sm">RSI Upper Band</span>
                                <ColorPicker value={localSettings.upperBandColor} onChange={c => handleChange('upperBandColor', c)} />
                                <input
                                    type="number"
                                    value={localSettings.upperBandValue}
                                    onChange={e => handleChange('upperBandValue', Number(e.target.value))}
                                    className="w-16 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white text-xs outline-none"
                                />
                            </div>

                            {/* Middle Band */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={localSettings.showMiddleBand}
                                    onChange={e => handleChange('showMiddleBand', e.target.checked)}
                                    className="accent-primary w-4 h-4 rounded-sm border-gray-600 bg-[#2A2E39]"
                                />
                                <span className="flex-1 text-sm">RSI Middle Band</span>
                                <ColorPicker value={localSettings.middleBandColor} onChange={c => handleChange('middleBandColor', c)} />
                                <input
                                    type="number"
                                    value={localSettings.middleBandValue}
                                    onChange={e => handleChange('middleBandValue', Number(e.target.value))}
                                    className="w-16 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white text-xs outline-none"
                                />
                            </div>

                            {/* Lower Band */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={localSettings.showLowerBand}
                                    onChange={e => handleChange('showLowerBand', e.target.checked)}
                                    className="accent-primary w-4 h-4 rounded-sm border-gray-600 bg-[#2A2E39]"
                                />
                                <span className="flex-1 text-sm">RSI Lower Band</span>
                                <ColorPicker value={localSettings.lowerBandColor} onChange={c => handleChange('lowerBandColor', c)} />
                                <input
                                    type="number"
                                    value={localSettings.lowerBandValue}
                                    onChange={e => handleChange('lowerBandValue', Number(e.target.value))}
                                    className="w-16 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white text-xs outline-none"
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[#2A2E39] bg-[#1E222D]">
                    <div className="relative group">
                        <div className="flex items-center gap-2 cursor-pointer border border-[#2A2E39] rounded px-3 py-1.5 text-sm">
                            <span>За замовчуванням</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 rounded border border-[#2A2E39] text-white hover:bg-[#2A2E39] transition-colors text-sm"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-1.5 rounded bg-primary text-white font-medium hover:bg-primary/90 transition-colors text-sm"
                        >
                            Ok
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ColorPicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    return (
        <div className="relative w-8 h-8 rounded border border-gray-600 overflow-hidden cursor-pointer">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 cursor-pointer"
            />
        </div>
    )
}
