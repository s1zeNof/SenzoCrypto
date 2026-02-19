import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, Palette } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface ProjectIconPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (icon: string, color: string) => void
    currentIcon?: string
    currentColor?: string
}

const PRESET_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
]

// Popular emojis for projects
const PRESET_EMOJIS = [
    '🚀', '💎', '⭐', '🔥', '💰', '📈', '🎯', '⚡', '🌟', '💪',
    '🏆', '🎉', '✨', '🔮', '🎨', '🌈', '🦄', '👑', '🎁', '🌙',
    '☀️', '⚙️', '🔧', '🛠️', '📊', '💻', '🌐', '🔗', '⛓️', '🎮'
]

// Curated list of popular Lucide icons
const POPULAR_ICONS = [
    'Rocket', 'Target', 'TrendingUp', 'Zap', 'Award', 'Star', 'Heart',
    'Crown', 'Flame', 'Gem', 'Shield', 'Sparkles', 'Trophy', 'Medal',
    'Coins', 'DollarSign', 'Bitcoin', 'Wallet', 'CreditCard', 'PiggyBank',
    'BarChart', 'LineChart', 'PieChart', 'Activity', 'Globe', 'Code',
    'Cpu', 'Database', 'Server', 'Cloud', 'Lock', 'Key', 'Link', 'Layers'
]

export default function ProjectIconPicker({
    isOpen,
    onClose,
    onSelect,
    currentIcon = '🚀',
    currentColor = '#3B82F6'
}: ProjectIconPickerProps) {
    const [activeTab, setActiveTab] = useState<'emoji' | 'icon'>('emoji')
    const [selectedIcon, setSelectedIcon] = useState(currentIcon)
    const [selectedColor, setSelectedColor] = useState(currentColor)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredIcons = POPULAR_ICONS.filter(name =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = () => {
        onSelect(selectedIcon, selectedColor)
        onClose()
    }

    const renderIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName]
        return IconComponent ? <IconComponent className="w-6 h-6" /> : null
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border rounded-2xl p-6 z-50 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-xl font-bold">Вибрати іконку</Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 p-1 bg-surface-hover rounded-lg">
                        <button
                            onClick={() => setActiveTab('emoji')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'emoji' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Емоджі
                        </button>
                        <button
                            onClick={() => setActiveTab('icon')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'icon' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Іконки
                        </button>
                    </div>

                    {activeTab === 'icon' && (
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Пошук іконки..."
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                    )}

                    {/* Icon/Emoji Grid */}
                    <div className="h-64 overflow-y-auto mb-4 border border-border rounded-lg p-2">
                        <div className="grid grid-cols-6 gap-2">
                            {activeTab === 'emoji' ? (
                                PRESET_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => setSelectedIcon(emoji)}
                                        className={`aspect-square flex items-center justify-center text-2xl rounded-lg hover:bg-surface-hover transition-colors ${selectedIcon === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))
                            ) : (
                                filteredIcons.map((iconName) => (
                                    <button
                                        key={iconName}
                                        onClick={() => setSelectedIcon(iconName)}
                                        style={{ color: selectedColor }}
                                        className={`aspect-square flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors ${selectedIcon === iconName ? 'bg-primary/20 ring-2 ring-primary' : ''
                                            }`}
                                    >
                                        {renderIcon(iconName)}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Color Picker (only for icons) */}
                    {activeTab === 'icon' && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Palette className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">Колір</span>
                            </div>
                            <div className="grid grid-cols-9 gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        style={{ backgroundColor: color }}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-2xl"
                                style={activeTab === 'icon' ? { color: selectedColor } : {}}
                            >
                                {activeTab === 'emoji' ? selectedIcon : renderIcon(selectedIcon)}
                            </div>
                            <div>
                                <div className="text-sm font-medium">Попередній перегляд</div>
                                <div className="text-xs text-gray-500">{selectedIcon}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleSelect}
                            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
                        >
                            Вибрати
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
