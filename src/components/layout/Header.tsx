// src/components/layout/Header.tsx
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useUI } from "@/store/ui"
import { Menu, X } from 'lucide-react'

export function Header() {
  const { toggleSidebar } = useUI()
  const { user } = useAuth()
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 items-center gap-4 px-4 md:px-6">
        {user && (
          <button onClick={toggleSidebar} className="md:hidden rounded-md p-1.5 hover:bg-muted">
            <Menu size={20} />
          </button>
        )}

        <div className="hidden md:flex items-center gap-2">
          {/* Desktop Logo is in the Sidebar now */}
        </div>

        {/* Mobile Logo */}
        <Link to="/" className="font-semibold tracking-wide flex items-center gap-2 md:hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Senzo</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => nav("/profile")}
                className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-border hover:ring-primary/50 transition"
                title="Профіль"
              >
                {user.photoURL
                  ? <img src={user.photoURL} alt="User avatar" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-sm font-bold bg-muted">{(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}</div>}
              </button>
              <button onClick={() => signOut(auth)} className="hidden md:block rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted/60">
                Вийти
              </button>
            </div>
          ) : (
            <button onClick={() => nav("/auth")} className="rounded-md border border-border bg-muted/60 px-3 py-1.5 text-sm hover:bg-muted">
              Увійти
            </button>
          )}
        </div>
      </div>
    </header>
  )
}