import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, Upload, Loader2, X } from 'lucide-react'
import { EmojiStickerService, type StickerPack, type Sticker } from '../services/EmojiStickerService'

export default function StickerPacksManager() {
    const [packs, setPacks] = useState<StickerPack[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPack, setEditingPack] = useState<StickerPack | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchPacks()
    }, [])

    const fetchPacks = async () => {
        try {
            const data = await EmojiStickerService.getAllStickerPacks()
            setPacks(data)
        } catch (error) {
            console.error('Failed to fetch sticker packs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (packId: string, isActive: boolean) => {
        try {
            await EmojiStickerService.updateStickerPack(packId, { isActive: !isActive })
            fetchPacks()
        } catch (error) {
            console.error('Failed to toggle pack:', error)
        }
    }

    const handleDelete = async (packId: string) => {
        if (!window.confirm('Видалити цей пак стікерів?')) return
        try {
            await EmojiStickerService.deleteStickerPack(packId)
            fetchPacks()
        } catch (error) {
            console.error('Failed to delete pack:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Паки Стікерів</h1>
                    <p className="text-gray-400 mt-1">Управління анімованими стікерами (Lottie)</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Створити пак
                </button>
            </div>

            {/* Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map(pack => (
                    <div
                        key={pack.id}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{pack.name}</h3>
                                {pack.description && (
                                    <p className="text-sm text-gray-500 mt-1">{pack.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => pack.id && handleToggleActive(pack.id, pack.isActive)}
                                    className={`p-2 rounded-lg transition-colors ${pack.isActive
                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                    title={pack.isActive ? 'Активний' : 'Неактивний'}
                                >
                                    <ToggleLeft className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Sticker Preview Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {pack.stickers.slice(0, 8).map(sticker => (
                                <div
                                    key={sticker.id}
                                    className="aspect-square rounded bg-gray-50 flex items-center justify-center p-2"
                                >
                                    <StickerPreview data={sticker.lottieData} />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{pack.stickers.length} стікерів</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingPack(pack)}
                                    className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                                    title="Редагувати"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => pack.id && handleDelete(pack.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded text-red-600"
                                    title="Видалити"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {packs.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                        <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Немає паків стікерів</h3>
                    <p className="text-gray-500 mb-4">Створіть перший пак анімованих стікерів</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Створити пак
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingPack) && (
                <StickerPackModal
                    pack={editingPack}
                    onClose={() => {
                        setShowCreateModal(false)
                        setEditingPack(null)
                    }}
                    onSave={() => {
                        setShowCreateModal(false)
                        setEditingPack(null)
                        fetchPacks()
                    }}
                />
            )}
        </div>
    )
}

// Sticker Preview Component (simple placeholder — no lottie-react dependency)
function StickerPreview({ data }: { data: string | any }) {
    if (!data) return <div className="w-full h-full bg-gray-100 animate-pulse rounded" />
    return <div className="w-full h-full flex items-center justify-center text-2xl">🎞️</div>
}

// Modal Component
function StickerPackModal({
    pack,
    onClose,
    onSave
}: {
    pack: StickerPack | null
    onClose: () => void
    onSave: () => void
}) {
    const [formData, setFormData] = useState({
        name: pack?.name || '',
        description: pack?.description || '',
        isActive: pack?.isActive ?? true
    })
    const [stickers, setStickers] = useState<Sticker[]>(pack?.stickers || [])
    const [uploading, setUploading] = useState(false)

    const handleAddSticker = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        console.log('Files selected:', files)
        if (!files || files.length === 0) {
            console.log('No files selected')
            return
        }

        setUploading(true)
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                console.log('Processing file:', file.name, file.type, file.size)

                // Read and parse JSON
                const text = await file.text()
                const lottieData = JSON.parse(text)
                console.log('Lottie parsed successfully')

                const stickerId = Date.now() + '_' + i
                const newSticker: Sticker = {
                    id: stickerId.toString(),
                    name: file.name.split('.')[0],
                    lottieData: JSON.stringify(lottieData),  // Store as string
                    keywords: []
                }

                console.log('Adding sticker:', newSticker.name)
                setStickers(prev => [...prev, newSticker])
            }
            console.log('All stickers processed successfully')
        } catch (error) {
            console.error('Failed to process sticker:', error)
            alert(`Помилка обробки стікера: ${error}`)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleSave = async () => {
        if (!formData.name) {
            alert('Введіть назву паку')
            return
        }

        try {
            if (pack?.id) {
                await EmojiStickerService.updateStickerPack(pack.id, {
                    ...formData,
                    stickers
                })
            } else {
                await EmojiStickerService.createStickerPack({
                    ...formData,
                    stickers
                })
            }
            onSave()
        } catch (error) {
            console.error('Failed to save pack:', error)
            alert('Помилка збереження')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {pack ? 'Редагувати пак' : 'Новий пак стікерів'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6 mb-8">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Назва паку <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Наприклад: Animated Reactions"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Опис (опціонально)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                            placeholder="Короткий опис паку..."
                            rows={3}
                        />
                    </div>

                    {/* Active checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <label className="text-sm font-medium text-gray-300 cursor-pointer">
                            Активний (видимий користувачам)
                        </label>
                    </div>

                    {/* Stickers Grid */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Стікери ({stickers.length})
                        </label>

                        {stickers.length > 0 && (
                            <div className="grid grid-cols-4 gap-3 mb-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl">
                                {stickers.map(sticker => (
                                    <div key={sticker.id} className="relative group">
                                        <div className="aspect-square bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-colors p-2">
                                            <StickerPreview data={sticker.lottieData} />
                                        </div>
                                        <button
                                            onClick={() => setStickers(stickers.filter(s => s.id !== sticker.id))}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload button */}
                        <label className="cursor-pointer block">
                            <div className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-6 text-center transition-all hover:bg-blue-500/5">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-3">
                                    <Upload className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-300 mb-1">
                                    {uploading ? 'Завантаження...' : 'Додати стікери'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Lottie JSON файли
                                </p>
                                <p className="text-xs text-blue-400/60 mt-2">
                                    💡 Створіть в LottieFiles або After Effects
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="application/json,.json"
                                multiple
                                onChange={handleAddSticker}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-700/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/20"
                    >
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    )
}
