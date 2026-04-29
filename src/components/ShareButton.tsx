import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Share2, Lock } from 'lucide-react'
import { StoryCard, StoryCardProps } from './StoryCard'
import { generateStoryImage, shareImage } from '../lib/share'

interface Props extends Omit<StoryCardProps, 'username'> {
  username: string | null
}

export default function ShareButton(props: Props) {
  const { username } = props
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renderCard, setRenderCard] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  if (!username) {
    return (
      <Link
        to="/profile"
        className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3 flex flex-col justify-between hover:border-brand/30 transition group"
        title="Set a username first to share your stack">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Share</p>
        <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-300 transition">
          <Lock size={16} />
          <span className="text-xs font-semibold">Set username</span>
        </div>
      </Link>
    )
  }

  async function handleClick() {
    if (busy) return
    setError(null)
    setBusy(true)
    setRenderCard(true)
    try {
      // wait one tick so React mounts the card before we capture
      await new Promise(r => setTimeout(r, 50))
      if (!cardRef.current) throw new Error('Card not mounted')
      const blob = await generateStoryImage(cardRef.current)
      await shareImage(blob, {
        title: 'My Supplements',
        text: `Check out my supplement stack — @${username}`,
        filename: `my-supplements-${username}.png`,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not share')
    } finally {
      setBusy(false)
      setRenderCard(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label="Share as image"
        className="bg-surface border border-white/[0.08] rounded-2xl px-4 py-3 flex flex-col justify-between hover:border-brand/30 transition disabled:opacity-60">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Share</p>
        <div className="flex items-center gap-1.5">
          <Share2 size={16} className="text-brand" />
          <span className="text-sm font-semibold text-brand">{busy ? 'Generating…' : 'Story'}</span>
        </div>
      </button>
      {error && (
        <p role="alert" className="text-xs text-rose-400 mt-2 col-span-full">{error}</p>
      )}
      {renderCard && username && createPortal(
        <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none', opacity: 0 }} aria-hidden>
          <StoryCard ref={cardRef} {...props} username={username} />
        </div>,
        document.body
      )}
    </>
  )
}
