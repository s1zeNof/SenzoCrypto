import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, Upload, Loader2, X } from 'lucide-react'
import { EmojiStickerService, type EmojiPack, type Emoji } from '../services/EmojiStickerService'

export default function EmojiPacksManager() {
    const [packs, setPacks] = useState<EmojiPack[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPack, setEditingPack] = useState<EmojiPack | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchPacks()
    }, [])

    const fetchPacks = async () => {
        try {
            const data = await EmojiStickerService.getAllEmojiPacks()
            setPacks(data)
        } catch (error) {
            console.error('Failed to fetch emoji packs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (packId: string, isActive: boolean) => {
        try {
            await EmojiStickerService.updateEmojiPack(packId, { isActive: !isActive })
            fetchPacks()
        } catch (error) {
            console.error('Failed to toggle pack:', error)
        }
    }

    const handleDelete = async (packId: string) => {
        if (!window.confirm('Видалити цей пак емоджі?')) return
        try {
            await EmojiStickerService.deleteEmojiPack(packId)
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
                    <h1 className="text-3xl font-bold">Паки Емоджі</h1>
                    <p className="text-gray-400 mt-1">Управління кастомними емоджі для користувачів</p>
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

                        {/* Emoji Preview */}
                        <div className="grid grid-cols-8 gap-1 mb-4">
                            {pack.emojis.slice(0, 16).map(emoji => (
                                <div
                                    key={emoji.id}
                                    className="aspect-square rounded bg-gray-50 flex items-center justify-center"
                                >
                                    <img
                                        src={emoji.url}
                                        alt={emoji.name}
                                        className="w-6 h-6"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{pack.emojis.length} емоджі</span>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Немає паків емоджі</h3>
                    <p className="text-gray-500 mb-4">Створіть перший пак для користувачів</p>
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
                <EmojiPackModal
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

// Modal Component
function EmojiPackModal({
    pack,
    onClose,
    onSave
}: {
    pack: EmojiPack | null
    onClose: () => void
    onSave: () => void
}) {
    const [formData, setFormData] = useState({
        name: pack?.name || '',
        description: pack?.description || '',
        isActive: pack?.isActive ?? true
    })
    const [emojis, setEmojis] = useState<Emoji[]>(pack?.emojis || [])
    const [uploading, setUploading] = useState(false)

    const handleAddEmoji = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        setUploading(true)
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const emojiId = Date.now() + '_' + i
                const url = await EmojiStickerService.uploadEmojiImage(file, emojiId)

                setEmojis(prev => [...prev, {
                    id: emojiId.toString(),
                    name: file.name.split('.')[0],
                    url,
                    keywords: []
                }])
            }
        } catch (error) {
            console.error('Failed to upload emoji:', error)
            alert('Помилка завантаження емоджі')
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name) {
            alert('Введіть назву паку')
            return
        }

        try {
            if (pack?.id) {
                await EmojiStickerService.updateEmojiPack(pack.id, {
                    ...formData,
                    emojis
                })
            } else {
                await EmojiStickerService.createEmojiPack({
                    ...formData,
                    emojis
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
                        {pack ? 'Редагувати пак' : 'Новий пак емоджі'}
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
                            placeholder="Наприклад: Crypto Emojis"
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

                    {/* Emojis Grid */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Емоджі ({emojis.length})
                        </label>

                        {emojis.length > 0 && (
                            <div className="grid grid-cols-8 gap-2 mb-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl">
                                {emojis.map(emoji => (
                                    <div key={emoji.id} className="relative group">
                                        <div className="aspect-square bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600 hover:border-blue-500 transition-colors">
                                            <img
                                                src={emoji.url}
                                                alt={emoji.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setEmojis(emojis.filter(e => e.id !== emoji.id))}
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
                                    {uploading ? 'Завантаження...' : 'Додати емоджі'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    PNG або WebP, до 1MB
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/png,image/webp"
                                multiple
                                onChange={handleAddEmoji}
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
