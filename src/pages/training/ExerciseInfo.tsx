import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Dumbbell, Target, Activity } from 'lucide-react'
import { findExercise, findAlternatives, imageUrl, type Exercise } from '../../lib/exercises'

export default function ExerciseInfo() {
  const { name } = useParams<{ name: string }>()
  const decoded = decodeURIComponent(name ?? '')

  const [loading, setLoading] = useState(true)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [alternatives, setAlternatives] = useState<Exercise[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setExercise(null)
    setAlternatives([])
    ;(async () => {
      const ex = await findExercise(decoded)
      if (cancelled) return
      setExercise(ex)
      if (ex) {
        const alts = await findAlternatives(ex, 3)
        if (!cancelled) setAlternatives(alts)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [decoded])

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/training" aria-label="Back to Training" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-lg font-bold text-white tracking-tight truncate">{decoded}</h1>
      </div>

      {loading && <p className="text-sm text-slate-500 text-center py-10">Loading...</p>}

      {!loading && !exercise && <NotFound query={decoded} />}

      {!loading && exercise && (
        <>
          <ExerciseDetails ex={exercise} originalName={decoded} />
          {alternatives.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">
                If you can't do this, try
              </h2>
              <div className="space-y-2">
                {alternatives.map(alt => (
                  <Link
                    key={alt.id}
                    to={`/training/exercise/${encodeURIComponent(alt.name)}`}
                    className="block p-3 rounded-xl bg-surface border border-white/[0.08] hover:border-brand/30 transition">
                    <p className="text-sm font-semibold text-slate-100">{alt.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {alt.equipment ?? 'no equipment'} · {alt.level}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

// ---------- ExerciseDetails ------------------------------------------------

function ExerciseDetails({ ex, originalName }: { ex: Exercise; originalName: string }) {
  const matchedDifferently = ex.name.toLowerCase() !== originalName.toLowerCase()

  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-4">
      {matchedDifferently && (
        <p className="text-[11px] text-slate-500 mb-3">
          Showing closest match: <span className="text-slate-300 font-medium">{ex.name}</span>
        </p>
      )}

      {ex.images.length > 0 && (
        <AnimatedExercise images={ex.images} alt={ex.name} />
      )}

      <div className="flex flex-wrap gap-2 mt-4 mb-4">
        {ex.equipment && <Chip icon={<Dumbbell size={11} />} label={ex.equipment} />}
        {ex.primaryMuscles.map(m => (
          <Chip key={m} icon={<Target size={11} />} label={m} />
        ))}
        <Chip icon={<Activity size={11} />} label={ex.level} />
      </div>

      {ex.instructions.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">
            How to do it
          </h3>
          <ol className="space-y-2">
            {ex.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand/15 border border-brand/30 text-brand text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ---------- AnimatedExercise (alternates 2 images to fake a GIF) -----------

function AnimatedExercise({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setIdx(prev => (prev + 1) % images.length), 1200)
    return () => clearInterval(t)
  }, [images.length])

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-surface-2">
      {images.map((img, i) => (
        <img
          key={img}
          src={imageUrl(img)}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  )
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-2 border border-white/[0.06] text-[11px] text-slate-400 capitalize">
      {icon}
      {label}
    </span>
  )
}

// ---------- NotFound fallback ----------------------------------------------

function NotFound({ query }: { query: string }) {
  const youtube = `https://www.youtube.com/results?search_query=${encodeURIComponent('how to do ' + query)}`
  const google = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query + ' exercise')}`

  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-6 text-center">
      <p className="text-sm text-slate-300 mb-1">No info found for this exercise</p>
      <p className="text-xs text-slate-500 mb-5">
        The catalog couldn't match "<span className="text-slate-300">{query}</span>". Try a more standard name or search the web:
      </p>
      <div className="flex flex-col gap-2">
        <a
          href={youtube} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-bg font-bold text-sm transition">
          <ExternalLink size={14} />
          Search on YouTube
        </a>
        <a
          href={google} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-2 border border-white/10 text-slate-300 hover:text-slate-100 hover:border-white/20 transition text-sm font-medium">
          <ExternalLink size={14} />
          Search Google Images
        </a>
      </div>
    </div>
  )
}
