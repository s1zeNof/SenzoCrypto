import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUI, SidebarMode } from '@/store/ui'
import {
    Sun, Moon, Monitor,
    PanelLeft, PanelLeftOpen, PanelLeftClose,
    User, Palette, Layout, Bell, Shield,
    Check, Camera, Save, Loader2, AlertCircle, CheckCircle2, AtSign
} from 'lucide-react'

type Tab = 'appearance' | 'profile' | 'sidebar' | 'notifications' | 'privacy'

const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'appearance',    label: 'Зовнішній вигляд', icon: Palette },
    { id: 'sidebar',       label: 'Навігація',        icon: Layout },
    { id: 'profile',       label: 'Профіль',           icon: User },
    { id: 'notifications', label: 'Сповіщення',        icon: Bell },
    { id: 'privacy',       label: 'Приватність',       icon: Shield },
]

export default function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('appearance')
    const { user, userData, updateProfile } = useAuth()
    const { theme, setTheme, sidebarMode, setSidebarMode } = useUI()

    // Profile edit state
    const [firstName, setFirstName] = useState(userData?.firstName || '')
    const [lastName, setLastName] = useState(userData?.lastName || '')
    const [username, setUsername] = useState(userData?.username || '')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userData?.photoURL || null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [saveError, setSaveError] = useState('')
    const avatarInputRef = useRef<HTMLInputElement>(null)

    // Sync form when userData loads (first render)
    const [synced, setSynced] = useState(false)
    if (!synced && userData) {
        setFirstName(userData.firstName || '')
        setLastName(userData.lastName || '')
        setUsername(userData.username || '')
        setAvatarPreview(userData.photoURL || null)
        setSynced(true)
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) { setSaveError('Фото має бути менше 2 МБ'); setSaveStatus('error'); return }
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
        reader.readAsDataURL(file)
        setSaveStatus('idle')
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setSaveStatus('idle')
        setSaveError('')

        // Validate username — only letters, numbers, underscores
        const usernameClean = username.trim().replace(/^@/, '')
        if (usernameClean && !/^[a-zA-Z0-9_]{3,20}$/.test(usernameClean)) {
            setSaveError('Username: 3–20 символів, лише a-z, 0-9, _')
            setSaveStatus('error')
            return
        }

        setIsSaving(true)

        // If avatar changed, convert to data URL (base64) for Firestore
        // For production you'd upload to Firebase Storage first
        let photoURL: string | null | undefined = undefined
        if (avatarFile) {
            photoURL = avatarPreview // base64 data URL
        }

        const result = await updateProfile({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: usernameClean || undefined,
            ...(photoURL !== undefined ? { photoURL } : {}),
        })

        setIsSaving(false)
        if (result.success) {
            setSaveStatus('success')
            setAvatarFile(null)
            setTimeout(() => setSaveStatus('idle'), 3000)
        } else {
            setSaveError(result.error || 'Помилка збереження')
            setSaveStatus('error')
        }
    }

    const hasChanges =
        firstName.trim() !== (userData?.firstName || '') ||
        lastName.trim() !== (userData?.lastName || '') ||
        username.replace(/^@/, '').trim() !== (userData?.username || '') ||
        avatarFile !== null

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold mb-1">Налаштування</h1>
                <p className="text-foreground-muted text-sm">Керуй зовнішнім виглядом та поведінкою платформи</p>
            </div>

            <div className="flex gap-6">
                {/* Left tab list */}
                <aside className="w-52 flex-shrink-0">
                    <nav className="flex flex-col gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ' +
                                    (activeTab === tab.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-foreground-muted hover:bg-surface-hover hover:text-white')
                                }
                            >
                                <tab.icon className="w-4 h-4 flex-shrink-0" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Right panel */}
                <div className="flex-1 min-w-0">

                    {/* ── APPEARANCE ── */}
                    {activeTab === 'appearance' && (
                        <SectionCard title="Тема оформлення" desc="Вибери між темним та світлим інтерфейсом">
                            <div className="grid grid-cols-3 gap-3">
                                <ThemeOption
                                    label="Темна"
                                    icon={<Moon className="w-5 h-5" />}
                                    active={theme === 'dark'}
                                    previewClass="bg-[#0A0D14]"
                                    onClick={() => setTheme('dark')}
                                />
                                <ThemeOption
                                    label="Світла"
                                    icon={<Sun className="w-5 h-5" />}
                                    active={theme === 'light'}
                                    previewClass="bg-white border border-gray-200"
                                    onClick={() => setTheme('light')}
                                />
                                <ThemeOption
                                    label="Системна"
                                    icon={<Monitor className="w-5 h-5" />}
                                    active={false}
                                    previewClass="bg-gradient-to-br from-[#0A0D14] to-white"
                                    onClick={() => {
                                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                                        setTheme(prefersDark ? 'dark' : 'light')
                                    }}
                                    badge="Авто"
                                />
                            </div>
                        </SectionCard>
                    )}

                    {/* ── SIDEBAR ── */}
                    {activeTab === 'sidebar' && (
                        <SectionCard title="Режим навігації" desc="Вибери як відображати бічне меню">
                            <div className="grid grid-cols-3 gap-3">
                                <SidebarModeOption
                                    mode="icons"
                                    label="Лише іконки"
                                    desc="Мінімальний вигляд, підказка при наведенні"
                                    icon={<PanelLeft className="w-6 h-6" />}
                                    active={sidebarMode === 'icons'}
                                    onClick={() => setSidebarMode('icons')}
                                />
                                <SidebarModeOption
                                    mode="hover"
                                    label="Розгортання"
                                    desc="Виповзає при наведенні миші"
                                    icon={<PanelLeftOpen className="w-6 h-6" />}
                                    active={sidebarMode === 'hover'}
                                    onClick={() => setSidebarMode('hover')}
                                />
                                <SidebarModeOption
                                    mode="expanded"
                                    label="Завжди відкритий"
                                    desc="Постійно видно іконки та назви"
                                    icon={<PanelLeftClose className="w-6 h-6" />}
                                    active={sidebarMode === 'expanded'}
                                    onClick={() => setSidebarMode('expanded')}
                                />
                            </div>

                            {/* Live preview */}
                            <div className="mt-4 p-3 bg-black/20 rounded-xl border border-border">
                                <p className="text-xs text-foreground-muted mb-2">Попередній перегляд:</p>
                                <div className="flex gap-2 items-start">
                                    <div className={'bg-surface border border-border rounded-lg flex flex-col gap-1 p-1 transition-all duration-200 ' + (sidebarMode === 'expanded' ? 'w-28' : 'w-8')}>
                                        {['Дашборд', 'Торгівля', 'Портфель'].map((l, i) => (
                                            <div key={i} className={'flex items-center gap-1 px-1 py-0.5 rounded ' + (i === 0 ? 'bg-primary/60' : 'bg-white/5')}>
                                                <div className="w-2.5 h-2.5 rounded-sm bg-white/30 flex-shrink-0" />
                                                {sidebarMode === 'expanded' && (
                                                    <span className="text-[8px] text-white/60 truncate">{l}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 bg-white/5 rounded-lg h-14" />
                                </div>
                                {sidebarMode === 'hover' && (
                                    <p className="text-[10px] text-foreground-subtle mt-2">Наведи мишу на меню — воно розшириться</p>
                                )}
                            </div>
                        </SectionCard>
                    )}

                    {/* ── PROFILE ── */}
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <SectionCard title="Фото профілю" desc="JPG або PNG, максимум 2 МБ">
                                <div className="flex items-center gap-5">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
                                            <div className="w-full h-full rounded-full bg-surface overflow-hidden">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                                                        {(userData?.displayName || user?.email || 'U')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Camera button */}
                                        <button
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
                                            title="Змінити фото"
                                        >
                                            <Camera className="w-3.5 h-3.5 text-white" />
                                        </button>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{userData?.displayName || '—'}</p>
                                        <p className="text-xs text-foreground-muted">{user?.email}</p>
                                        <button
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="text-xs text-primary hover:underline mt-1"
                                        >
                                            Завантажити нове фото
                                        </button>
                                        {avatarFile && (
                                            <p className="text-xs text-green-400">✓ Нове фото вибрано</p>
                                        )}
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard title="Особисті дані" desc="Ім'я та прізвище відображаються на твоєму профілі">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-foreground-muted block mb-1.5 font-medium">Ім'я</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={e => { setFirstName(e.target.value); setSaveStatus('idle') }}
                                                placeholder="Олексій"
                                                className="w-full bg-surface-elevated border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-foreground-subtle"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-foreground-muted block mb-1.5 font-medium">Прізвище</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={e => { setLastName(e.target.value); setSaveStatus('idle') }}
                                                placeholder="Коваленко"
                                                className="w-full bg-surface-elevated border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-foreground-subtle"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-foreground-muted block mb-1.5 font-medium">Username</label>
                                        <div className="relative">
                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-subtle pointer-events-none" />
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => { setUsername(e.target.value.replace(/^@/, '')); setSaveStatus('idle') }}
                                                placeholder="myusername"
                                                maxLength={20}
                                                className="w-full bg-surface-elevated border border-border focus:border-primary rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none transition-colors placeholder-foreground-subtle font-mono"
                                            />
                                        </div>
                                        <p className="text-[11px] text-foreground-subtle mt-1">3–20 символів: a-z, 0-9, _ (без пробілів)</p>
                                    </div>

                                    <div className="pt-1">
                                        <label className="text-xs text-foreground-muted block mb-1.5 font-medium">Email</label>
                                        <input
                                            type="text"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full bg-black/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground-subtle outline-none cursor-not-allowed"
                                        />
                                        <p className="text-[11px] text-foreground-subtle mt-1">Email не можна змінити</p>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Save bar */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    {saveStatus === 'error' && (
                                        <div className="flex items-center gap-1.5 text-red-400 text-xs">
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            {saveError}
                                        </div>
                                    )}
                                    {saveStatus === 'success' && (
                                        <div className="flex items-center gap-1.5 text-green-400 text-xs">
                                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            Профіль успішно збережено!
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving || !hasChanges}
                                    className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                                >
                                    {isSaving ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Збереження...</>
                                    ) : (
                                        <><Save className="w-3.5 h-3.5" /> Зберегти зміни</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    {activeTab === 'notifications' && (
                        <SectionCard title="Сповіщення" desc="Буде доступно незабаром">
                            <div className="py-8 flex flex-col items-center text-center gap-2">
                                <Bell className="w-10 h-10 text-foreground-subtle" />
                                <p className="text-foreground-muted text-sm">Налаштування сповіщень будуть додані в наступному оновленні</p>
                            </div>
                        </SectionCard>
                    )}

                    {/* ── PRIVACY ── */}
                    {activeTab === 'privacy' && (
                        <SectionCard title="Приватність" desc="Буде доступно незабаром">
                            <div className="py-8 flex flex-col items-center text-center gap-2">
                                <Shield className="w-10 h-10 text-foreground-subtle" />
                                <p className="text-foreground-muted text-sm">Налаштування приватності будуть додані в наступному оновленні</p>
                            </div>
                        </SectionCard>
                    )}

                </div>
            </div>
        </div>
    )
}

// ── Helpers ───────────────────────────────────────────────────────────

function SectionCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
        <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-base mb-0.5">{title}</h2>
            <p className="text-xs text-foreground-muted mb-4">{desc}</p>
            {children}
        </div>
    )
}

function ThemeOption({ label, icon, active, previewClass, onClick, badge }: {
    label: string; icon: React.ReactNode; active: boolean
    previewClass: string; onClick: () => void; badge?: string
}) {
    return (
        <button
            onClick={onClick}
            className={'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ' +
                (active ? 'border-primary bg-primary/10' : 'border-border hover:border-border-hover bg-surface-elevated hover:bg-surface-hover')}
        >
            {active && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                </div>
            )}
            <div className={'w-full h-10 rounded-lg ' + previewClass} />
            <div className={active ? 'text-primary' : 'text-foreground-muted'}>{icon}</div>
            <span className={'text-xs font-medium ' + (active ? 'text-white' : 'text-foreground-muted')}>{label}</span>
            {badge && <span className="text-[10px] text-foreground-subtle">{badge}</span>}
        </button>
    )
}

function SidebarModeOption({ mode, label, desc, icon, active, onClick }: {
    mode: SidebarMode; label: string; desc: string
    icon: React.ReactNode; active: boolean; onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={'relative flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all text-left ' +
                (active ? 'border-primary bg-primary/10' : 'border-border hover:border-border-hover bg-surface-elevated hover:bg-surface-hover')}
        >
            {active && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                </div>
            )}
            <div className={active ? 'text-primary' : 'text-foreground-muted'}>{icon}</div>
            <div>
                <p className={'text-xs font-semibold ' + (active ? 'text-white' : 'text-foreground-muted')}>{label}</p>
                <p className="text-[10px] text-foreground-subtle mt-0.5 leading-tight">{desc}</p>
            </div>
        </button>
    )
}
