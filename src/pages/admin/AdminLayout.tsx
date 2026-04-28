import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Shield, Users, Package } from 'lucide-react'
import { useLayoutCtx } from '../../layout/context'

export default function AdminLayout() {
  const ctx = useLayoutCtx()
  const { isAdmin, perfil } = ctx

  if (perfil === null) return null
  if (!isAdmin) return <Navigate to="/" replace />

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition border ${
      isActive
        ? 'bg-brand/10 text-brand border-brand/20'
        : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.04]'
    }`

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Admin</h1>
      </div>

      <div className="flex gap-2 mb-5 bg-surface border border-white/[0.08] rounded-2xl p-1.5">
        <NavLink to="users" className={tabClass}>
          <Users size={15} /> Users
        </NavLink>
        <NavLink to="catalog" className={tabClass}>
          <Package size={15} /> Catalog
        </NavLink>
      </div>

      <Outlet context={ctx} />
    </>
  )
}
