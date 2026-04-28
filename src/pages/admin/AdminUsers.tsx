import { useEffect, useState } from 'react'
import { Trash2, Shield, ShieldOff } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useLayoutCtx } from '../../layout/context'

interface Row {
  id: string
  user_id: string
  username: string | null
  full_name: string | null
  role: 'user' | 'admin'
  created_at: string
}

export default function AdminUsers() {
  const { session } = useLayoutCtx()
  const [users, setUsers] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('perfiles')
      .select('id, user_id, username, full_name, role, created_at')
      .order('created_at', { ascending: false })
    setUsers((data as Row[]) ?? [])
    setLoading(false)
  }

  async function toggleRole(row: Row) {
    if (row.user_id === session.user.id) return
    setBusyId(row.id)
    const newRole = row.role === 'admin' ? 'user' : 'admin'
    const { error } = await supabase
      .from('perfiles')
      .update({ role: newRole })
      .eq('id', row.id)
    if (!error) setUsers(prev => prev.map(u => u.id === row.id ? { ...u, role: newRole } : u))
    setBusyId(null)
  }

  async function eliminar(row: Row) {
    if (row.user_id === session.user.id) return
    if (!confirm(`Delete profile @${row.username ?? row.user_id}? This only removes the perfil row.`)) return
    setBusyId(row.id)
    const { error } = await supabase.from('perfiles').delete().eq('id', row.id)
    if (!error) setUsers(prev => prev.filter(u => u.id !== row.id))
    setBusyId(null)
  }

  if (loading) return <p className="text-sm text-slate-400 text-center py-8">Loading users...</p>

  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/[0.06]">
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const self = u.user_id === session.user.id
              const isAdmin = u.role === 'admin'
              return (
                <tr key={u.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3 text-slate-200">
                    {u.username ? `@${u.username}` : <span className="text-slate-600">—</span>}
                    {self && <span className="ml-2 text-xs text-brand">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {u.full_name ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-brand/10 text-brand border border-brand/20'
                        : 'bg-slate-700/30 text-slate-400 border border-slate-700/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={self || busyId === u.id}
                        title={isAdmin ? 'Demote to user' : 'Promote to admin'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        {isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      <button
                        onClick={() => eliminar(u)}
                        disabled={self || busyId === u.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
