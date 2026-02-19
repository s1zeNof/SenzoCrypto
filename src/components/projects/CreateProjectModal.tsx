import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Target, Plus, Loader2 } from 'lucide-react'
import { ProjectService } from '@/services/ProjectService'
import { useAuth } from '@/contexts/AuthContext'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onProjectCreated: () => void
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetAmount: '',
        startAmount: '0',
        currency: 'USD',
        tags: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            await ProjectService.createProject({
                userId: user.id,
                title: formData.title,
                description: formData.description,
                startAmount: Number(formData.startAmount),
                targetAmount: Number(formData.targetAmount),
                currentAmount: Number(formData.startAmount),
                currency: formData.currency,
                status: 'active',
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
            })
            onProjectCreated()
            onClose()
            setFormData({
                title: '',
                description: '',
                targetAmount: '',
                startAmount: '0',
                currency: 'USD',
                tags: ''
            })
        } catch (error) {
            console.error('Failed to create project:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-border rounded-2xl p-6 z-50 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            <Target className="w-6 h-6 text-primary" />
                            Новий проект
                        </Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Назва проекту</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Напр: Челендж 0-1000$"
                                className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Опис</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Опишіть вашу мету..."
                                className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors h-24 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Початкова сума</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.startAmount}
                                    onChange={e => setFormData({ ...formData, startAmount: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Цільова сума</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.targetAmount}
                                    onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Валюта</label>
                                <select
                                    value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="USD">USD</option>
                                    <option value="USDT">USDT</option>
                                    <option value="BTC">BTC</option>
                                    <option value="ETH">ETH</option>
                                    <option value="UAH">UAH</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Теги (через кому)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="trading, challenge, scalping"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Створення...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Створити проект
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
