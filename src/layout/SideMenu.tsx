import { NavLink } from 'react-router-dom'
import { Pill, User, Heart, Shield, LogOut } from 'lucide-react'

interface Props {
  isAdmin: boolean
  email: string
  onSignOut: () => void
}

const baseLink =
  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition'

export default function SideMenu({ isAdmin, email, onSignOut }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${baseLink} ${isActive
      ? 'bg-brand/10 text-brand border border-brand/20'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'}`

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 px-4 py-6 border-r border-white/[0.06] bg-surface/30">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Pill size={18} className="text-brand" />
        </div>
        <h1 className="text-base font-bold text-white tracking-tight">My Supplements</h1>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/" end className={linkClass}>
          <Pill size={16} /> Supplements
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <User size={16} /> Profile
        </NavLink>
        <NavLink to="/support" className={linkClass}>
          <Heart size={16} /> Support Us
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={linkClass}>
            <Shield size={16} /> Admin
          </NavLink>
        )}
      </nav>

      <div className="border-t border-white/[0.06] pt-4 mt-4">
        <p className="text-xs text-slate-500 truncate px-2 mb-2">{email}</p>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-xs text-rose-400/70 hover:text-rose-400 transition px-2">
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
