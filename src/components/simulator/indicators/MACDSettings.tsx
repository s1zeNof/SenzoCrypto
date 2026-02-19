import { useState } from 'react'
import { X } from 'lucide-react'

interface MACDSettingsProps {
    settings: any
    onSave: (settings: any) => void
    onClose: () => void
}

export default function MACDSettings({ settings, onSave, onClose }: MACDSettingsProps) {
    const [localSettings, setLocalSettings] = useState({
        fast: settings.fast || 12,
        slow: settings.slow || 26,
        signal: settings.signal || 9,
        colorFast: settings.colorFast || '#2962FF',
        colorSlow: settings.colorSlow || '#FF6D00',
        colorHistogram: settings.colorHistogram || '#26A69A' // we handle 4 colors in logic usually but simplified here
    })

    const handleSave = () => {
        onSave(localSettings)
        onClose()
    }

    const handleChange = (key: string, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1E222D] border border-[#2A2E39] rounded-lg shadow-2xl w-[350px] overflow-hidden text-[#D9D9D9]">
                <div className="flex justify-between items-center p-4 border-b border-[#2A2E39]">
                    <h3 className="font-semibold text-white">MACD</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm">Fast Length</label>
                            <input
                                type="number"
                                value={localSettings.fast}
                                onChange={(e) => handleChange('fast', Number(e.target.value))}
                                className="w-20 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm">Slow Length</label>
                            <input
                                type="number"
                                value={localSettings.slow}
                                onChange={(e) => handleChange('slow', Number(e.target.value))}
                                className="w-20 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm">Signal Smoothing</label>
                            <input
                                type="number"
                                value={localSettings.signal}
                                onChange={(e) => handleChange('signal', Number(e.target.value))}
                                className="w-20 bg-[#2A2E39] border border-transparent focus:border-primary rounded px-2 py-1 text-right text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-4 border-t border-[#2A2E39] gap-3">
                    <button onClick={onClose} className="px-4 py-1.5 rounded border border-[#2A2E39] text-sm hover:bg-[#2A2E39]">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-1.5 rounded bg-primary text-white text-sm hover:bg-primary/90">Ok</button>
                </div>
            </div>
        </div>
    )
}
