import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePerfil } from '../hooks/usePerfil'
import Auth from '../Auth'
import SideMenu from './SideMenu'
import BottomNav from './BottomNav'

export default function AppLayout() {
  const { session, signOut } = useAuth()
  const { perfil } = usePerfil(session)

  if (!session) return <Auth />

  const isAdmin = perfil?.role === 'admin'

  return (
    <div className="min-h-screen flex">
      <SideMenu isAdmin={isAdmin} email={session.user.email!} onSignOut={signOut} />

      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-surface/30 sticky top-0 z-20 backdrop-blur">
          <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-xs text-rose-400/70 hover:text-rose-400 transition">
            <LogOut size={11} />
            Sign out
          </button>
        </header>

        <div
          className="max-w-2xl mx-auto px-4 pt-6 md:pb-12"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
          <Outlet context={{ session, perfil, isAdmin }} />
        </div>
      </main>

      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}
