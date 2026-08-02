import { NavLink } from 'react-router-dom'
import { Pill, User, Dumbbell, Shield, Apple } from 'lucide-react'

interface Props {
  isAdmin: boolean
}

export default function BottomNav({ isAdmin }: Props) {
  // Five tabs (six with Admin) share the bar, so labels are tightened and
  // clipped rather than allowed to wrap.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 min-w-0 flex flex-col items-center justify-center gap-[3px] px-0.5 py-2.5 text-[10px] font-medium transition ${
      isActive ? 'text-brand' : 'text-slate-400'
    }`

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex bg-surface/95 backdrop-blur border-t border-white/[0.06]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}>
      <NavLink to="/" end className={linkClass}>
        <Pill size={17} />
        <span className="max-w-full truncate">Supps</span>
      </NavLink>
      <NavLink to="/diet" className={linkClass}>
        <Apple size={17} />
        <span className="max-w-full truncate">Diet</span>
      </NavLink>
      <NavLink to="/training" className={linkClass}>
        <Dumbbell size={17} />
        <span className="max-w-full truncate">Train</span>
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <User size={17} />
        <span className="max-w-full truncate">Profile</span>
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={linkClass}>
          <Shield size={17} />
          <span className="max-w-full truncate">Admin</span>
        </NavLink>
      )}
    </nav>
  )
}
