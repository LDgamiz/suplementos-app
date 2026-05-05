// Lightweight wrapper over the free-exercise-db dataset with
// Spanish → English fuzzy name matching and alternative suggestions.
//
// The dataset (~1MB JSON) is dynamically imported so it only ships
// in the chunk that loads ExerciseInfo, not the main bundle.

export interface Exercise {
  id: string
  name: string
  force: string | null
  level: 'beginner' | 'intermediate' | 'expert'
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

const IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises'

export function imageUrl(imagePath: string): string {
  return `${IMAGE_BASE}/${imagePath}`
}

let cache: Exercise[] | null = null

export async function loadExercises(): Promise<Exercise[]> {
  if (cache) return cache
  const mod = await import('./exercises.json')
  cache = mod.default as unknown as Exercise[]
  return cache
}

// ---------- Name matching ---------------------------------------------------

const STOP_WORDS = new Set([
  'con', 'de', 'la', 'el', 'en', 'a', 'por', 'y', 'al', 'del', 'los', 'las',
  'with', 'the', 'of', 'a', 'an', 'on', 'in', 'and',
])

// Spanish → English keywords commonly used in lifting.
// One ES token can map to multiple candidate EN tokens; a match on any one counts.
const GLOSSARY: Record<string, string[]> = {
  remo: ['row'],
  sentadilla: ['squat'],
  sentadillas: ['squat'],
  peso: ['weight', 'deadlift'],
  muerto: ['deadlift'],
  banca: ['bench'],
  press: ['press'],
  militar: ['military', 'overhead', 'shoulder'],
  mancuerna: ['dumbbell'],
  mancuernas: ['dumbbell'],
  barra: ['barbell', 'bar'],
  polea: ['cable', 'pulley'],
  pesa: ['kettlebell'],
  rusa: ['kettlebell'],
  jalon: ['pulldown', 'pull'],
  jalones: ['pulldown', 'pull'],
  dominada: ['pull-up', 'pullup', 'chin-up'],
  dominadas: ['pull-up', 'pullup', 'chin-up'],
  fondos: ['dip', 'dips'],
  fondo: ['dip'],
  flexion: ['push-up', 'pushup'],
  flexiones: ['push-up', 'pushup'],
  elevacion: ['raise'],
  elevaciones: ['raise'],
  lateral: ['lateral', 'side'],
  laterales: ['lateral', 'side'],
  frontal: ['front'],
  frontales: ['front'],
  inclinado: ['incline', 'inclined'],
  inclinada: ['incline', 'inclined'],
  declinado: ['decline', 'declined'],
  declinada: ['decline', 'declined'],
  extension: ['extension'],
  extensiones: ['extension'],
  curl: ['curl'],
  biceps: ['bicep', 'biceps', 'curl'],
  triceps: ['tricep', 'triceps'],
  pierna: ['leg'],
  piernas: ['legs', 'leg'],
  gemelos: ['calf', 'calves'],
  pecho: ['chest', 'pectoral'],
  espalda: ['back'],
  hombro: ['shoulder'],
  hombros: ['shoulder', 'shoulders'],
  abdominales: ['abdominal', 'abs', 'crunch'],
  abdominal: ['abdominal', 'abs', 'crunch'],
  abdomen: ['abdominal', 'abs', 'crunch'],
  zancada: ['lunge'],
  zancadas: ['lunge'],
  prensa: ['leg-press', 'press'],
  gluteo: ['glute'],
  gluteos: ['glute', 'glutes'],
  aductor: ['adductor'],
  aductores: ['adductor'],
  abductor: ['abductor'],
  abductores: ['abductor'],
  isquiotibiales: ['hamstring', 'hamstrings'],
  cuadriceps: ['quadriceps', 'quads'],
  agarre: ['grip'],
  estricto: ['strict'],
  pausa: ['pause'],
  cerrado: ['close', 'narrow'],
  cerrada: ['close', 'narrow'],
  abierto: ['wide', 'open'],
  abierta: ['wide', 'open'],
  arnold: ['arnold'],
  goblet: ['goblet'],
  bulgaro: ['bulgarian'],
  bulgara: ['bulgarian'],
  bulgaras: ['bulgarian'],
  hip: ['hip'],
  thrust: ['thrust'],
  rumano: ['romanian'],
  rumana: ['romanian'],
  sumo: ['sumo'],
  patada: ['kickback', 'donkey'],
  patadas: ['kickback', 'donkey'],
  martillo: ['hammer'],
  // Equipment
  maquina: ['machine'],
  cable: ['cable'],
  smith: ['smith'],
}

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[_/]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(s: string): string[] {
  return normalize(s).split(' ').filter(t => t && !STOP_WORDS.has(t))
}

function expand(tokens: string[]): string[][] {
  return tokens.map(t => GLOSSARY[t] ?? [t])
}

function score(exerciseName: string, expandedTokens: string[][]): number {
  const norm = normalize(exerciseName)
  let matched = 0
  for (const candidates of expandedTokens) {
    if (candidates.some(c => norm.includes(c))) matched++
  }
  return matched / expandedTokens.length
}

export async function findExercise(name: string): Promise<Exercise | null> {
  const tokens = tokenize(name)
  if (tokens.length === 0) return null
  const all = await loadExercises()
  const expanded = expand(tokens)

  let best: { ex: Exercise; score: number } | null = null
  for (const ex of all) {
    const s = score(ex.name, expanded)
    if (s > 0 && (!best || s > best.score)) best = { ex, score: s }
  }
  // Need at least half the tokens to consider it a hit.
  return best && best.score >= 0.5 ? best.ex : null
}

export async function findAlternatives(ex: Exercise, n = 3): Promise<Exercise[]> {
  const all = await loadExercises()
  const muscles = new Set(ex.primaryMuscles)
  const candidates = all.filter(e =>
    e.id !== ex.id &&
    e.primaryMuscles.some(m => muscles.has(m))
  )
  // Prefer different equipment and same level for variety + accessibility.
  candidates.sort((a, b) => {
    const aDiff = a.equipment !== ex.equipment ? 1 : 0
    const bDiff = b.equipment !== ex.equipment ? 1 : 0
    if (aDiff !== bDiff) return bDiff - aDiff
    const aLvl = a.level === ex.level ? 1 : 0
    const bLvl = b.level === ex.level ? 1 : 0
    return bLvl - aLvl
  })
  return candidates.slice(0, n)
}
