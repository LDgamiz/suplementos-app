import { Link, useParams } from 'react-router-dom'
import { Pill, Flame, Check, UserX } from 'lucide-react'
import { usePublicProfile } from '../hooks/usePublicProfile'
import { useRachaForUser } from '../hooks/useRacha'
import WeeklyChart from '../WeeklyChart'

export default function PerfilPublico() {
  const { username } = useParams<{ username: string }>()
  const { perfil, suplementosHoy, loading, notFound } = usePublicProfile(username)
  const { racha } = useRachaForUser(perfil?.user_id ?? null, true)

  const tomados = suplementosHoy.filter(s => s.tomado).length
  const total = suplementosHoy.length
  const pct = total > 0 ? Math.round((tomados / total) * 100) : 0

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.06] bg-surface/30 backdrop-blur sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition">
            <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Pill size={14} className="text-brand" />
            </div>
            <span className="text-sm font-semibold">DailyStack</span>
          </Link>
          <Link to="/" className="text-xs text-brand/80 hover:text-brand transition">Sign in</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-12">
        {loading && <p className="text-center text-slate-500 py-20 text-sm">Loading…</p>}

        {!loading && notFound && (
          <div className="bg-surface border border-white/[0.08] rounded-2xl p-10 text-center mt-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-400/10 border border-rose-400/20 mb-4">
              <UserX size={26} className="text-rose-400" />
            </div>
            <h1 className="text-lg font-semibold text-slate-200 mb-1">Profile not found</h1>
            <p className="text-sm text-slate-500 mb-5">No user with that username exists.</p>
            <Link to="/" className="inline-block px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold text-sm transition">
              Go home
            </Link>
          </div>
        )}

        {!loading && perfil && (
          <>
            <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 mb-4 flex items-center gap-4">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} alt={perfil.username} className="w-20 h-20 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xl font-bold">
                  {(perfil.full_name ?? perfil.username).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white tracking-tight truncate">
                  {perfil.full_name || perfil.username}
                </h1>
                <p className="text-sm text-brand/80">@{perfil.username}</p>
                {perfil.bio && (
                  <p className="text-sm text-slate-400 mt-2 leading-snug">{perfil.bio}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Streak</p>
                <div className="flex items-center gap-1.5">
                  <Flame size={18} className="text-amber-400" />
                  <span className="text-2xl font-bold text-amber-400">{racha}</span>
                </div>
              </div>
              <div className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Today</p>
                <span className="text-2xl font-bold text-white">
                  {tomados}<span className="text-slate-600 text-base font-normal">/{total}</span>
                </span>
              </div>
              <div className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Done</p>
                <span className="text-2xl font-bold text-brand">{pct}%</span>
              </div>
            </div>

            <WeeklyChart refreshKey={0} userId={perfil.user_id} publicOnly />

            <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 mt-4">
              <h2 className="text-base font-semibold text-slate-200 mb-4">Today's public stack</h2>
              {suplementosHoy.length === 0 ? (
                <p className="text-sm text-slate-500">No public supplements today.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {suplementosHoy.map(s => (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-white/[0.06]">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center border ${s.tomado ? 'bg-brand/15 border-brand/40 text-brand' : 'bg-white/[0.03] border-white/10 text-slate-600'}`}>
                        {s.tomado && <Check size={15} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{s.suplementos_cat?.name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{s.dosis}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-center text-xs text-slate-600 mt-8">
              Powered by <Link to="/" className="text-brand/80 hover:text-brand transition">DailyStack: Supplement Tracker</Link>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
