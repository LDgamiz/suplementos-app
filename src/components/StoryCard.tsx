import { forwardRef } from 'react'

export interface StoryCardProps {
  fullName: string | null
  username: string
  avatarUrl: string | null
  bio: string | null
  racha: number
  tomados: number
  total: number
  pct: number
  suplementos: Array<{ name: string; dosis: string; tomado: boolean }>
}

const BG = '#0A0E1A'
const SURFACE = '#0F172A'
const SURFACE_2 = '#1E293B'
const BRAND = '#00C896'
const AMBER = '#F59E0B'
const TEXT = '#E2E8F0'
const MUTED = '#64748B'
const BORDER = 'rgba(255,255,255,0.08)'

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(function StoryCard(
  { fullName, username, avatarUrl, bio, racha, tomados, total, pct, suplementos },
  ref
) {
  const initials = (fullName ?? username).slice(0, 2).toUpperCase()
  const items = suplementos.slice(0, 8)

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1920,
        background: `radial-gradient(ellipse at top, #0d1f1a 0%, ${BG} 60%)`,
        color: TEXT,
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 80,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(0,200,150,0.12)',
          border: `2px solid ${BRAND}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: BRAND, fontSize: 36, lineHeight: 1 }}>💊</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>
            StackForge
          </span>
          <span style={{ fontSize: 18, color: BRAND, marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
            Supplement Tracker
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${BORDER}` }}
          />
        ) : (
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(0,200,150,0.12)',
            border: `4px solid ${BRAND}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: BRAND, fontSize: 64, fontWeight: 700,
          }}>
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.05, letterSpacing: -1 }}>
            {fullName || username}
          </div>
          <div style={{ fontSize: 40, color: BRAND, marginTop: 8 }}>@{username}</div>
        </div>
      </div>

      {bio && (
        <p style={{ fontSize: 32, color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>{bio}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Streak</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 56 }}>🔥</span>
            <span style={{ fontSize: 80, fontWeight: 800, color: AMBER, lineHeight: 1 }}>{racha}</span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Today</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
            {tomados}<span style={{ color: MUTED, fontWeight: 400, fontSize: 40 }}>/{total}</span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Done</div>
          <div style={{ fontSize: 80, fontWeight: 800, color: BRAND, lineHeight: 1 }}>{pct}%</div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 40, flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
          Today's stack
        </div>
        {items.length === 0 ? (
          <p style={{ color: MUTED, fontSize: 32, margin: 0 }}>No public supplements today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 24,
                  padding: '20px 28px',
                  background: SURFACE_2,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 18,
                }}>
                <span style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: s.tomado ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${s.tomado ? BRAND + '66' : 'rgba(255,255,255,0.10)'}`,
                  color: s.tomado ? BRAND : MUTED,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700,
                }}>
                  {s.tomado ? '✓' : ''}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, lineHeight: 1.1 }}>{s.name}</div>
                  <div style={{ fontSize: 24, color: MUTED, marginTop: 4 }}>{s.dosis}</div>
                </div>
              </div>
            ))}
            {suplementos.length > items.length && (
              <p style={{ color: MUTED, fontSize: 24, margin: '8px 0 0', textAlign: 'center' }}>
                + {suplementos.length - items.length} more
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', color: MUTED, fontSize: 28 }}>
        See full stack at <span style={{ color: BRAND }}>/perfil/{username}</span>
      </div>
    </div>
  )
})

const cardStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 28,
}

const statCardStyle: React.CSSProperties = {
  ...cardStyle,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 22,
  color: MUTED,
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontWeight: 600,
}
