import { create } from "zustand"

// Sidebar display modes:
// 'icons'    — only icons (current default), tooltip on hover
// 'hover'    — icons normally, full sidebar slides out on hover
// 'expanded' — always expanded with labels visible
export type SidebarMode = 'icons' | 'hover' | 'expanded'

// Theme modes
export type ThemeMode = 'dark' | 'light'

type UIState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void

  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void

  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const SIDEBAR_KEY = "senzo-ui:sidebar"
const SIDEBAR_MODE_KEY = "senzo-ui:sidebar-mode"
const THEME_KEY = "senzo-ui:theme"

// Apply theme to <html> element
function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.add('light')
  } else {
    root.classList.remove('light')
  }
}

// Read initial theme from localStorage
function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

function getInitialSidebarMode(): SidebarMode {
  try {
    const stored = localStorage.getItem(SIDEBAR_MODE_KEY)
    if (stored === 'icons' || stored === 'hover' || stored === 'expanded') return stored
  } catch {}
  return 'icons'
}

export const useUI = create<UIState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => {
    const next = !get().sidebarOpen
    try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0") } catch {}
    set({ sidebarOpen: next })
  },
  setSidebar: (open) => {
    try { localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0") } catch {}
    set({ sidebarOpen: open })
  },

  sidebarMode: getInitialSidebarMode(),
  setSidebarMode: (mode) => {
    try { localStorage.setItem(SIDEBAR_MODE_KEY, mode) } catch {}
    set({ sidebarMode: mode })
  },

  theme: getInitialTheme(),
  setTheme: (theme) => {
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(THEME_KEY, next) } catch {}
    applyTheme(next)
    set({ theme: next })
  },
}))

// Hydrate all UI state from localStorage on app start
export function hydrateUIFromStorage() {
  try {
    const sidebarVal = localStorage.getItem(SIDEBAR_KEY)
    if (sidebarVal) useUI.getState().setSidebar(sidebarVal === "1")

    const theme = localStorage.getItem(THEME_KEY) as ThemeMode | null
    if (theme) {
      useUI.getState().setTheme(theme)
    }

    const mode = localStorage.getItem(SIDEBAR_MODE_KEY) as SidebarMode | null
    if (mode) useUI.getState().setSidebarMode(mode)
  } catch {}
}

// Keep old export name for backward compat
export const hydrateSidebarFromStorage = hydrateUIFromStorage
