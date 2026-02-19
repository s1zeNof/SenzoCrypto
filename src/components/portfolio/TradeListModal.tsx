import { X, Trash2, Calendar, Maximize2 } from 'lucide-react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import type { Trade } from '@/services/firebase'
import { deleteTrade } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'

interface TradeListModalProps {
    isOpen: boolean
    onClose: () => void
    date: Date
    trades: Trade[]
    onTradeDeleted: () => void
}

export default function TradeListModal({ isOpen, onClose, date, trades, onTradeDeleted }: TradeListModalProps) {
    const { user } = useAuth()
    const navigate = useNavigate()

    const handleDelete = async (tradeId: string) => {
        if (!user || !tradeId) return
        if (window.confirm('Ви впевнені, що хочете видалити цю угоду?')) {
            try {
                await deleteTrade(user.id, tradeId)
                onTradeDeleted()
            } catch (error) {
                console.error('Failed to delete trade:', error)
            }
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border rounded-xl p-6 z-50 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {format(date, 'd MMMM yyyy', { locale: uk })}
                        </Dialog.Title>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate(`/app/portfolio/journal/${format(date, 'yyyy-MM-dd')}`)}
                                className="text-gray-400 hover:text-primary transition-colors"
                                title="Відкрити на всю сторінку"
                            >
                                <Maximize2 className="w-5 h-5" />
                            </button>
                            <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </Dialog.Close>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {trades.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                Немає угод за цей день
                            </div>
                        ) : (
                            trades.map(trade => (
                                <div key={trade.id} className="bg-background/50 rounded-lg p-4 border border-border flex items-center justify-between group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold ${trade.side === 'long' ? 'text-success' : 'text-red-500'} uppercase text-sm`}>
                                                {trade.side}
                                            </span>
                                            <span className="font-bold">{trade.pair}</span>
                                            <span className="text-xs text-gray-400 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                                {trade.exchange}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-red-500'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                                            </span>
                                            {trade.notes && (
                                                <span className="text-xs text-gray-400 truncate max-w-[150px]">
                                                    - {trade.notes}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => trade.id && handleDelete(trade.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Видалити угоду"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
