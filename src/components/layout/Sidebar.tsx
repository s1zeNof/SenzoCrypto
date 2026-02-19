import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    LineChart,
    Wallet,
    GraduationCap,
    Settings,
    User,
    Gamepad2,
    Sprout,
    Scale,
    ArrowLeftRight,
    Target,
    Users,
    FlaskConical
} from 'lucide-react'
import { useUI } from '@/store/ui'

const navItems = [
    { path: '/app/dashboard',  icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/app/trading',    icon: ArrowLeftRight,  label: 'Торгівля' },
    { path: '/app/portfolio',  icon: Wallet,          label: 'Портфель' },
    { path: '/app/analytics',  icon: LineChart,       label: 'Аналітика' },
    { path: '/app/farming',    icon: Sprout,          label: 'Фармінг' },
    { path: '/app/arbitrage',  icon: Scale,           label: 'Арбітраж' },
    { path: '/app/academy',    icon: GraduationCap,   label: 'Академія' },
    { path: '/app/projects',   icon: Target,          label: 'Мої проекти' },
    { path: '/app/simulator',  icon: Gamepad2,        label: 'Симулятор' },
    { path: '/app/backtest',   icon: FlaskConical,    label: 'Бектест' },
    { path: '/app/community',  icon: Users,           label: 'Спільнота' },
    // Hidden for now — preserved for future use:
    // { path: '/app/docs',          icon: FileText, label: 'Документація' },
    // { path: '/app/compute-nodes', icon: Server,   label: 'Вузли' },
    // { path: '/app/sdk',           icon: Code,     label: 'SDK' },
]

const bottomItems = [
    { path: '/app/profile',  icon: User,     label: 'Профіль' },
    { path: '/app/settings', icon: Settings, label: 'Налаштування' },
]

export default function Sidebar() {
    const { sidebarMode } = useUI()
    const [isHovered, setIsHovered] = useState(false)

    // Determine whether labels are currently visible
    const showLabels = sidebarMode === 'expanded' || (sidebarMode === 'hover' && isHovered)

    // Width based on mode/state
    const sidebarWidth = showLabels ? 'w-52' : 'w-16'

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative whitespace-nowrap overflow-hidden ${
            isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-gray-400 hover:bg-surface-hover hover:text-white'
        }`

    const renderItem = (item: typeof navItems[0]) => (
        <NavLink key={item.path} to={item.path} className={linkClass}>
            <item.icon className="w-5 h-5 flex-shrink-0" />

            {/* Label — shown when expanded or hovered (hover mode) */}
            {showLabels && (
                <span className="text-sm font-medium truncate animate-in fade-in duration-150">
                    {item.label}
                </span>
            )}

            {/* Tooltip — only in 'icons' mode */}
            {sidebarMode === 'icons' && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-xl z-50">
                    {item.label}
                    {/* Small arrow */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-border" />
                </div>
            )}
        </NavLink>
    )

    return (
        <aside
            className={`fixed left-0 top-16 bottom-0 ${sidebarWidth} bg-surface border-r border-border z-40 flex flex-col py-3 transition-all duration-200 ease-in-out`}
            onMouseEnter={() => sidebarMode === 'hover' && setIsHovered(true)}
            onMouseLeave={() => sidebarMode === 'hover' && setIsHovered(false)}
        >
            <nav className="flex-1 w-full flex flex-col gap-1 px-2 overflow-y-auto overflow-x-hidden">
                {navItems.map(renderItem)}
            </nav>

            <div className="w-full flex flex-col gap-1 px-2 pt-2 border-t border-border mt-2">
                {bottomItems.map(renderItem)}
            </div>
        </aside>
    )
}
