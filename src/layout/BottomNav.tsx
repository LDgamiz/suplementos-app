import { NavLink } from 'react-router-dom'
import { Pill, User, Heart, Shield } from 'lucide-react'

interface Props {
  isAdmin: boolean
}

export default function BottomNav({ isAdmin }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition ${
      isActive ? 'text-brand' : 'text-slate-400'
    }`

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex bg-surface/95 backdrop-blur border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={linkClass}>
        <Pill size={18} />
        Supps
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <User size={18} />
        Profile
      </NavLink>
      <NavLink to="/support" className={linkClass}>
        <Heart size={18} />
        Support
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={linkClass}>
          <Shield size={18} />
          Admin
        </NavLink>
      )}
    </nav>
  )
}
