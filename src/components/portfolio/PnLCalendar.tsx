import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns'
import { uk } from 'date-fns/locale'
import type { Trade } from '@/services/firebase'
import TradeListModal from './TradeListModal'

interface PnLCalendarProps {
    trades: Trade[]
    onTradesChanged?: () => void
}

export default function PnLCalendar({ trades, onTradesChanged }: PnLCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const dailyPnL = useMemo(() => {
        const pnlMap: Record<string, number> = {}
        trades.forEach(trade => {
            // Handle Firestore Timestamp or Date object
            const date = trade.date.toDate ? trade.date.toDate() : new Date(trade.date)
            const dateStr = format(date, 'yyyy-MM-dd')
            pnlMap[dateStr] = (pnlMap[dateStr] || 0) + trade.pnl
        })
        return pnlMap
    }, [trades])

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Calculate empty cells for start of month (Monday start)
    const startDay = getDay(monthStart)
    const emptyDays = startDay === 0 ? 6 : startDay - 1

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    const totalPnL = useMemo(() => {
        return Object.values(dailyPnL).reduce((acc, val) => acc + val, 0)
    }, [dailyPnL])

    const handleDayClick = (day: Date) => {
        setSelectedDate(day)
        setIsModalOpen(true)
    }

    const getTradesForDate = (date: Date) => {
        return trades.filter(trade => {
            const tradeDate = trade.date.toDate ? trade.date.toDate() : new Date(trade.date)
            return isSameDay(tradeDate, date)
        })
    }

    return (
        <>
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Календар PnL</h3>
                    <div className="flex items-center gap-4">
                        <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-success' : 'text-red-500'}`}>
                            Всього: ${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-medium min-w-[100px] text-center capitalize">
                                {format(currentDate, 'LLLL yyyy', { locale: uk })}
                            </span>
                            <button onClick={nextMonth} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(day => (
                        <div key={day} className="text-center text-xs text-gray-400 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: emptyDays }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {daysInMonth.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const pnl = dailyPnL[dateStr]
                        const hasPnL = pnl !== undefined

                        return (
                            <div
                                key={dateStr}
                                onClick={() => handleDayClick(day)}
                                className={`aspect-square rounded-lg border border-border p-1 flex flex-col items-center justify-center transition-all relative group cursor-pointer ${hasPnL
                                    ? pnl > 0
                                        ? 'bg-success/10 border-success/30 hover:bg-success/20'
                                        : pnl < 0
                                            ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                                            : 'bg-surface hover:bg-surface-hover'
                                    : 'bg-surface/30 hover:bg-surface/50'
                                    }`}
                            >
                                <span className={`text-xs mb-1 ${isSameDay(day, new Date()) ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                    {format(day, 'd')}
                                </span>
                                {hasPnL && (
                                    <span className={`text-[10px] font-bold ${pnl > 0 ? 'text-success' : 'text-red-500'}`}>
                                        {pnl > 0 ? '+' : ''}{Math.round(pnl)}
                                    </span>
                                )}

                                {/* Tooltip */}
                                {hasPnL && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs whitespace-nowrap hidden group-hover:block z-10 pointer-events-none">
                                        ${pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {selectedDate && (
                <TradeListModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    date={selectedDate}
                    trades={getTradesForDate(selectedDate)}
                    onTradeDeleted={() => {
                        if (onTradesChanged) onTradesChanged()
                    }}
                />
            )}
        </>
    )
}
