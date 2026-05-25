import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Zap, Play, Trash2, Plus, Search, Pencil, X, Check } from 'lucide-react'
import { SuplementoCat } from './hooks/useSuplementos'
import HintButton from './components/HintButton'
import ConfirmModal from './components/ConfirmModal'
import { Button, Card, fieldClassName } from './components/ui'
import { LIMITS, ValidationError, requireString, boundedNumber } from './lib/validation'

interface SupplementoRutina {
  id: number
  suplemento_id: string
  nombre: string
  dosis: string
}

interface NuevoCat {
  name: string
  category: string
  recommended_dose: string
  dose_unit: string
}

interface FilaUI extends Omit<SupplementoRutina, 'id'> {
  busqueda: string
  resultados: SuplementoCat[]
  abierto: boolean
  creandoNuevo: boolean
  nuevoCat: NuevoCat
}

interface Rutina {
  id: number
  nombre: string
  user_id: string
  rutina_suplementos: SupplementoRutina[]
}

interface Props {
  session: Session
  onAplicarRutina: (suplementos: { suplemento_id: string; dosis: string }[]) => void
}

const filaVacia = (): FilaUI => ({
  suplemento_id: '', nombre: '', dosis: '', busqueda: '', resultados: [], abierto: false,
  creandoNuevo: false, nuevoCat: { name: '', category: '', recommended_dose: '', dose_unit: '' }
})

export default function Rutinas({ session, onAplicarRutina }: Props) {
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [nombreRutina, setNombreRutina] = useState<string>('')
  const [filas, setFilas] = useState<FilaUI[]>([filaVacia()])
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  // Edit mode state (one routine editable at a time)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingNewItem, setEditingNewItem] = useState<FilaUI>(filaVacia())
  const [editError, setEditError] = useState<string | null>(null)
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Rutina | null>(null)

  useEffect(() => { cargarRutinas() }, [])

  const cargarRutinas = async () => {
    const { data: rutinasData, error } = await supabase
      .from('rutinas')
      .select('*')
      .eq('user_id', session.user.id)
    if (error) return

    const rutinasConSuplemento = await Promise.all(
      rutinasData.map(async (rutina) => {
        const { data: suplementos } = await supabase
          .from('rutina_suplementos')
          .select('*')
          .eq('rutina_id', rutina.id)
        return { ...rutina, rutina_suplementos: suplementos || [] }
      })
    )
    setRutinas(rutinasConSuplemento)
  }

  const actualizarBusqueda = (index: number, valor: string) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], busqueda: valor, suplemento_id: '', nombre: '', resultados: [], abierto: false }
      return nuevas
    })
    clearTimeout(timers.current[index])
    if (valor.length < 2) return
    timers.current[index] = setTimeout(async () => {
      const { data } = await supabase
        .from('suplementos_cat')
        .select('*')
        .ilike('name', `%${valor}%`)
        .limit(8)
      setFilas(prev => {
        const nuevas = [...prev]
        if (nuevas[index]?.busqueda !== valor) return prev
        nuevas[index] = { ...nuevas[index], resultados: data || [], abierto: true }
        return nuevas
      })
    }, 300)
  }

  const seleccionarCat = (index: number, cat: SuplementoCat) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = {
        ...nuevas[index],
        suplemento_id: cat.id,
        nombre: cat.name,
        dosis: `${cat.recommended_dose} ${cat.dose_unit}`,
        busqueda: cat.name,
        resultados: [],
        abierto: false,
        creandoNuevo: false,
      }
      return nuevas
    })
  }

  const iniciarCreacionEnFila = (index: number) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = {
        ...nuevas[index],
        abierto: false,
        creandoNuevo: true,
        nuevoCat: { name: nuevas[index].busqueda, category: '', recommended_dose: '', dose_unit: '' }
      }
      return nuevas
    })
  }

  const actualizarNuevoCat = (index: number, campo: keyof NuevoCat, valor: string) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], nuevoCat: { ...nuevas[index].nuevoCat, [campo]: valor } }
      return nuevas
    })
  }

  const crearEnCatalogoParaFila = async (index: number) => {
    const cat = filas[index].nuevoCat
    if (!cat.name || !cat.category || !cat.recommended_dose || !cat.dose_unit) return
    let cleanName: string, cleanCategory: string, cleanUnit: string, cleanDose: number
    try {
      cleanName = requireString(cat.name, LIMITS.supplementName.min, LIMITS.supplementName.max, 'Name')
      cleanCategory = requireString(cat.category, LIMITS.supplementCategory.min, LIMITS.supplementCategory.max, 'Category')
      cleanUnit = requireString(cat.dose_unit, LIMITS.doseUnit.min, LIMITS.doseUnit.max, 'Unit')
      cleanDose = boundedNumber(cat.recommended_dose, LIMITS.doseAmount.min, LIMITS.doseAmount.max, 'Dose amount')
    } catch (e) {
      console.warn(e instanceof ValidationError ? e.message : e)
      return
    }
    const { data, error } = await supabase
      .from('suplementos_cat')
      .insert([{
        name: cleanName,
        category: cleanCategory,
        recommended_dose: cleanDose,
        dose_unit: cleanUnit,
        status: 'pending',
        created_by: session.user.id,
      }])
      .select()
      .single()
    if (!error && data) seleccionarCat(index, data as SuplementoCat)
  }

  const actualizarDosis = (index: number, valor: string) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], dosis: valor }
      return nuevas
    })
  }

  const cerrarDropdown = (index: number) => {
    setFilas(prev => {
      const nuevas = [...prev]
      nuevas[index] = { ...nuevas[index], abierto: false }
      return nuevas
    })
  }

  const guardarRutina = async () => {
    let cleanName: string
    try {
      cleanName = requireString(nombreRutina, LIMITS.routineName.min, LIMITS.routineName.max, 'Routine name')
    } catch {
      return
    }
    const filasValidas = filas.filter(f => f.suplemento_id && f.dosis.trim().length > 0)
    let insertar: Array<{ rutina_id: number; suplemento_id: string; nombre: string; dosis: string }>
    try {
      insertar = filasValidas.map(f => ({
        rutina_id: 0,
        suplemento_id: f.suplemento_id,
        nombre: f.nombre,
        dosis: requireString(f.dosis, LIMITS.dosis.min, LIMITS.dosis.max, 'Dose'),
      }))
    } catch {
      return
    }

    const { data, error } = await supabase
      .from('rutinas')
      .insert([{ nombre: cleanName, user_id: session.user.id }])
      .select()
    if (error) return

    const rutinaId = data[0].id
    insertar.forEach(row => { row.rutina_id = rutinaId })

    await supabase.from('rutina_suplementos').insert(insertar)
    setNombreRutina('')
    setFilas([filaVacia()])
    cargarRutinas()
  }

  const eliminarRutina = async (id: number) => {
    await supabase.from('rutina_suplementos').delete().eq('rutina_id', id)
    await supabase.from('rutinas').delete().eq('id', id)
    setRutinas(prev => prev.filter(r => r.id !== id))
    if (editingId === id) cerrarEdicion()
  }

  // ---------- Edit mode -----------------------------------------------------

  const iniciarEdicion = (rutina: Rutina) => {
    setEditingId(rutina.id)
    setEditingName(rutina.nombre)
    setEditingNewItem(filaVacia())
    setEditError(null)
  }

  const cerrarEdicion = () => {
    setEditingId(null)
    setEditingName('')
    setEditingNewItem(filaVacia())
    setEditError(null)
  }

  const guardarNombreRutina = async (id: number) => {
    let cleanName: string
    try {
      cleanName = requireString(editingName, LIMITS.routineName.min, LIMITS.routineName.max, 'Routine name')
    } catch (e) {
      setEditError(e instanceof ValidationError ? e.message : 'Invalid name')
      return
    }
    setEditError(null)
    const { error } = await supabase.from('rutinas').update({ nombre: cleanName }).eq('id', id)
    if (error) { setEditError(error.message); return }
    setRutinas(prev => prev.map(r => r.id === id ? { ...r, nombre: cleanName } : r))
  }

  const actualizarDosisItem = async (rutinaId: number, itemId: number, dosis: string) => {
    // Optimistic local update so typing feels responsive.
    setRutinas(prev => prev.map(r => r.id !== rutinaId ? r : {
      ...r, rutina_suplementos: r.rutina_suplementos.map(s => s.id === itemId ? { ...s, dosis } : s)
    }))
    let cleanDosis: string
    try {
      cleanDosis = requireString(dosis, LIMITS.dosis.min, LIMITS.dosis.max, 'Dose')
    } catch {
      // Keep the local value while invalid; don't write to DB.
      return
    }
    await supabase.from('rutina_suplementos').update({ dosis: cleanDosis }).eq('id', itemId)
  }

  const quitarItem = async (rutinaId: number, itemId: number) => {
    setRutinas(prev => prev.map(r => r.id !== rutinaId ? r : {
      ...r, rutina_suplementos: r.rutina_suplementos.filter(s => s.id !== itemId)
    }))
    await supabase.from('rutina_suplementos').delete().eq('id', itemId)
  }

  const agregarItemARutina = async (rutinaId: number) => {
    if (!editingNewItem.suplemento_id) {
      setEditError('Pick a supplement first.')
      return
    }
    let cleanDosis: string
    try {
      cleanDosis = requireString(editingNewItem.dosis, LIMITS.dosis.min, LIMITS.dosis.max, 'Dose')
    } catch (e) {
      setEditError(e instanceof ValidationError ? e.message : 'Invalid dose')
      return
    }
    setEditError(null)
    const { data, error } = await supabase
      .from('rutina_suplementos')
      .insert([{
        rutina_id: rutinaId,
        suplemento_id: editingNewItem.suplemento_id,
        nombre: editingNewItem.nombre,
        dosis: cleanDosis,
      }])
      .select()
      .single()
    if (error || !data) { setEditError(error?.message ?? 'Could not add'); return }
    const newRow: SupplementoRutina = {
      id: data.id, suplemento_id: data.suplemento_id, nombre: data.nombre, dosis: data.dosis,
    }
    setRutinas(prev => prev.map(r => r.id !== rutinaId ? r : {
      ...r, rutina_suplementos: [...r.rutina_suplementos, newRow]
    }))
    setEditingNewItem(filaVacia())
  }

  // Search logic mirrored from actualizarBusqueda but scoped to editingNewItem.
  const actualizarBusquedaEdit = (valor: string) => {
    setEditingNewItem(prev => ({
      ...prev, busqueda: valor, suplemento_id: '', nombre: '', resultados: [], abierto: false,
    }))
    if (editTimer.current) clearTimeout(editTimer.current)
    if (valor.length < 2) return
    editTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('suplementos_cat')
        .select('*')
        .ilike('name', `%${valor}%`)
        .limit(8)
      setEditingNewItem(prev => prev.busqueda !== valor ? prev : {
        ...prev, resultados: (data || []) as SuplementoCat[], abierto: true,
      })
    }, 300)
  }

  const seleccionarCatEdit = (cat: SuplementoCat) => {
    setEditingNewItem(prev => ({
      ...prev,
      suplemento_id: cat.id,
      nombre: cat.name,
      dosis: `${cat.recommended_dose} ${cat.dose_unit}`,
      busqueda: cat.name,
      resultados: [],
      abierto: false,
      creandoNuevo: false,
    }))
  }

  const iniciarCreacionEdit = () => {
    setEditingNewItem(prev => ({
      ...prev, abierto: false, creandoNuevo: true,
      nuevoCat: { name: prev.busqueda, category: '', recommended_dose: '', dose_unit: '' }
    }))
  }

  const actualizarNuevoCatEdit = (campo: keyof NuevoCat, valor: string) => {
    setEditingNewItem(prev => ({ ...prev, nuevoCat: { ...prev.nuevoCat, [campo]: valor } }))
  }

  const crearEnCatalogoEdit = async () => {
    const cat = editingNewItem.nuevoCat
    if (!cat.name || !cat.category || !cat.recommended_dose || !cat.dose_unit) return
    let cleanName: string, cleanCategory: string, cleanUnit: string, cleanDose: number
    try {
      cleanName = requireString(cat.name, LIMITS.supplementName.min, LIMITS.supplementName.max, 'Name')
      cleanCategory = requireString(cat.category, LIMITS.supplementCategory.min, LIMITS.supplementCategory.max, 'Category')
      cleanUnit = requireString(cat.dose_unit, LIMITS.doseUnit.min, LIMITS.doseUnit.max, 'Unit')
      cleanDose = boundedNumber(cat.recommended_dose, LIMITS.doseAmount.min, LIMITS.doseAmount.max, 'Dose amount')
    } catch (e) {
      setEditError(e instanceof ValidationError ? e.message : 'Invalid')
      return
    }
    const { data, error } = await supabase
      .from('suplementos_cat')
      .insert([{
        name: cleanName, category: cleanCategory, recommended_dose: cleanDose,
        dose_unit: cleanUnit, status: 'pending', created_by: session.user.id,
      }])
      .select()
      .single()
    if (!error && data) seleccionarCatEdit(data as SuplementoCat)
  }

  const inputClass = fieldClassName('sm')
  const miniInput = inputClass
  const dosisClass = `${inputClass.replace('w-full', 'w-28 shrink-0')}`

  return (
    <Card padding="lg" className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Zap size={16} className="text-brand" />
          Routines
        </h2>
        <HintButton
          label="Routines hint"
          text="Save groups of supplements as a stack. Apply a routine to add all its items to today's list with one tap."
        />
      </div>

      {rutinas.length > 0 && (
        <div className="mb-6 space-y-2">
          {rutinas.map(rutina => editingId === rutina.id ? (
            <div key={rutina.id} className="p-4 bg-surface-2 border border-brand/30 rounded-xl">
              {/* Editable name + Done */}
              <div className="flex gap-2 mb-3">
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => editingName.trim() !== rutina.nombre && guardarNombreRutina(rutina.id)}
                  maxLength={LIMITS.routineName.max}
                  className={`${inputClass} flex-1 font-semibold`}
                />
                <button
                  onClick={cerrarEdicion}
                  aria-label="Done editing"
                  className="px-3 rounded-xl bg-surface border border-white/10 text-slate-300 hover:text-slate-100 hover:border-white/20 transition text-sm font-medium inline-flex items-center gap-1">
                  <Check size={14} />
                  Done
                </button>
              </div>

              {/* Current items */}
              {rutina.rutina_suplementos.length > 0 ? (
                <ul className="space-y-1.5 mb-3">
                  {rutina.rutina_suplementos.map(item => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-slate-200 truncate">{item.nombre}</span>
                      <input
                        value={item.dosis}
                        onChange={e => actualizarDosisItem(rutina.id, item.id, e.target.value)}
                        maxLength={LIMITS.dosis.max}
                        className={dosisClass}
                      />
                      <button
                        onClick={() => quitarItem(rutina.id, item.id)}
                        aria-label={`Remove ${item.nombre}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 mb-3">No supplements yet. Add one below.</p>
              )}

              {/* Add new item */}
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">Add supplement</p>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      placeholder="Search supplement"
                      value={editingNewItem.busqueda}
                      onChange={e => actualizarBusquedaEdit(e.target.value)}
                      onBlur={() => setTimeout(() => setEditingNewItem(prev => ({ ...prev, abierto: false })), 150)}
                      maxLength={LIMITS.supplementName.max}
                      className={`${inputClass} pl-8`}
                    />
                    {editingNewItem.abierto && (
                      <div className="absolute z-10 w-full mt-1 bg-surface border border-white/10 rounded-xl overflow-hidden shadow-xl">
                        {editingNewItem.resultados.length > 0 ? (
                          <ul>
                            {editingNewItem.resultados.map(cat => (
                              <li
                                key={cat.id}
                                onMouseDown={() => seleccionarCatEdit(cat)}
                                className="px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-white/[0.05] transition text-sm">
                                <span className="text-slate-200">{cat.name}</span>
                                <span className="text-xs text-slate-500 capitalize">{cat.category}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div
                            onMouseDown={iniciarCreacionEdit}
                            className="px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-white/[0.05] transition">
                            <Plus size={13} className="text-brand shrink-0" />
                            <span className="text-sm text-slate-300">
                              Add <span className="text-brand font-medium">"{editingNewItem.busqueda}"</span> to catalog
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    placeholder="Dose"
                    value={editingNewItem.dosis}
                    onChange={e => setEditingNewItem(prev => ({ ...prev, dosis: e.target.value }))}
                    maxLength={LIMITS.dosis.max}
                    className={dosisClass}
                  />
                  <Button
                    onClick={() => agregarItemARutina(rutina.id)}
                    size="sm"
                    disabled={!editingNewItem.suplemento_id || !editingNewItem.dosis.trim()}>
                    <Plus size={13} />
                    Add
                  </Button>
                </div>

                {editingNewItem.creandoNuevo && (
                  <div className="mb-2 p-3 bg-surface border border-brand/20 rounded-xl">
                    <p className="text-xs text-brand font-semibold uppercase tracking-wider mb-2">New catalog entry</p>
                    <input
                      placeholder="Name"
                      value={editingNewItem.nuevoCat.name}
                      onChange={e => actualizarNuevoCatEdit('name', e.target.value)}
                      maxLength={LIMITS.supplementName.max}
                      className={`${miniInput} mb-2`}
                    />
                    <input
                      placeholder="Category"
                      value={editingNewItem.nuevoCat.category}
                      onChange={e => actualizarNuevoCatEdit('category', e.target.value)}
                      maxLength={LIMITS.supplementCategory.max}
                      className={`${miniInput} mb-2`}
                    />
                    <div className="flex gap-2 mb-2">
                      <input
                        placeholder="Dose amount" type="number" step="any"
                        min={LIMITS.doseAmount.min} max={LIMITS.doseAmount.max}
                        value={editingNewItem.nuevoCat.recommended_dose}
                        onChange={e => actualizarNuevoCatEdit('recommended_dose', e.target.value)}
                        className={miniInput}
                      />
                      <input
                        placeholder="Unit"
                        value={editingNewItem.nuevoCat.dose_unit}
                        onChange={e => actualizarNuevoCatEdit('dose_unit', e.target.value)}
                        maxLength={LIMITS.doseUnit.max}
                        className={miniInput}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingNewItem(prev => ({ ...prev, creandoNuevo: false }))}
                        className="flex-1 py-2 text-xs rounded-xl bg-surface border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition">
                        Cancel
                      </button>
                      <button
                        onClick={crearEnCatalogoEdit}
                        className="flex-1 py-2 text-xs rounded-xl bg-brand hover:bg-brand-dark text-bg font-bold transition">
                        Add to catalog
                      </button>
                    </div>
                  </div>
                )}

                {editError && <p className="text-xs text-rose-400 mt-2">{editError}</p>}
              </div>
            </div>
          ) : (
            <div key={rutina.id} className="flex justify-between items-center p-3 bg-surface-2 border border-white/10 rounded-xl">
              <div className="min-w-0">
                <p className="font-semibold text-slate-200 truncate">{rutina.nombre}</p>
                <p className="text-xs text-slate-500">{rutina.rutina_suplementos.length} supplements</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={() => onAplicarRutina(rutina.rutina_suplementos.map(s => ({ suplemento_id: s.suplemento_id, dosis: s.dosis })))}
                  size="sm">
                  <Play size={13} />
                  Apply
                </Button>
                <button
                  onClick={() => iniciarEdicion(rutina)}
                  aria-label={`Edit ${rutina.nombre}`}
                  className="p-2 rounded-lg bg-surface border border-white/10 text-slate-400 hover:text-brand hover:border-brand/30 transition">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setPendingDelete(rutina)}
                  aria-label={`Delete ${rutina.nombre}`}
                  className="p-2 rounded-lg bg-surface border border-white/10 text-rose-400/50 hover:border-rose-400/30 hover:text-rose-400 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this routine?"
        body={pendingDelete ? `"${pendingDelete.nombre}" and all its supplements will be removed. This can't be undone.` : ''}
        confirmLabel="Delete"
        confirmTone="danger"
        onConfirm={() => {
          if (pendingDelete) {
            eliminarRutina(pendingDelete.id)
            setPendingDelete(null)
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">New routine</h3>
      <input
        placeholder="Routine name (e.g. Morning stack)"
        value={nombreRutina}
        onChange={e => setNombreRutina(e.target.value)}
        maxLength={LIMITS.routineName.max}
        className={`${inputClass} mb-4`}
      />

      {filas.map((fila, index) => (
        <div key={index}>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                placeholder="Search supplement"
                value={fila.busqueda}
                onChange={e => actualizarBusqueda(index, e.target.value)}
                onBlur={() => setTimeout(() => cerrarDropdown(index), 150)}
                maxLength={LIMITS.supplementName.max}
                className={`${inputClass} pl-8`}
              />
              {fila.abierto && (
                <div className="absolute z-10 w-full mt-1 bg-surface-2 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {fila.resultados.length > 0 ? (
                    <ul>
                      {fila.resultados.map(cat => (
                        <li
                          key={cat.id}
                          onMouseDown={() => seleccionarCat(index, cat)}
                          className="px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-white/[0.05] transition text-sm">
                          <span className="text-slate-200">{cat.name}</span>
                          <span className="text-xs text-slate-500 capitalize">{cat.category}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div
                      onMouseDown={() => iniciarCreacionEnFila(index)}
                      className="px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-white/[0.05] transition">
                      <Plus size={13} className="text-brand shrink-0" />
                      <span className="text-sm text-slate-300">
                        Add <span className="text-brand font-medium">"{fila.busqueda}"</span> to catalog
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              placeholder="Dose"
              value={fila.dosis}
              onChange={e => actualizarDosis(index, e.target.value)}
              maxLength={LIMITS.dosis.max}
              className={dosisClass}
            />
          </div>

          {fila.creandoNuevo && (
            <div className="mb-3 p-4 bg-surface-2 border border-brand/20 rounded-xl">
              <p className="text-xs text-brand font-semibold uppercase tracking-wider mb-3">New catalog entry</p>
              <input
                placeholder="Name"
                value={fila.nuevoCat.name}
                onChange={e => actualizarNuevoCat(index, 'name', e.target.value)}
                maxLength={LIMITS.supplementName.max}
                className={`${miniInput} mb-2`}
              />
              <input
                placeholder="Category (e.g. vitamin, mineral, protein)"
                value={fila.nuevoCat.category}
                onChange={e => actualizarNuevoCat(index, 'category', e.target.value)}
                maxLength={LIMITS.supplementCategory.max}
                className={`${miniInput} mb-2`}
              />
              <div className="flex gap-2 mb-3">
                <input
                  placeholder="Dose amount"
                  type="number"
                  min={LIMITS.doseAmount.min}
                  max={LIMITS.doseAmount.max}
                  step="any"
                  value={fila.nuevoCat.recommended_dose}
                  onChange={e => actualizarNuevoCat(index, 'recommended_dose', e.target.value)}
                  className={miniInput}
                />
                <input
                  placeholder="Unit (mg, mcg, g...)"
                  value={fila.nuevoCat.dose_unit}
                  onChange={e => actualizarNuevoCat(index, 'dose_unit', e.target.value)}
                  maxLength={LIMITS.doseUnit.max}
                  className={miniInput}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilas(prev => { const n = [...prev]; n[index] = { ...n[index], creandoNuevo: false }; return n })}
                  className="flex-1 py-2 text-xs rounded-xl bg-surface border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition">
                  Cancel
                </button>
                <button
                  onClick={() => crearEnCatalogoParaFila(index)}
                  className="flex-1 py-2 text-xs rounded-xl bg-brand hover:bg-brand-dark text-bg font-bold transition">
                  Add to catalog
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => setFilas(prev => [...prev, filaVacia()])}
        className="flex items-center gap-1.5 text-sm text-brand/70 hover:text-brand transition mb-4 mt-1">
        <Plus size={14} />
        Add supplement to routine
      </button>
      <Button onClick={guardarRutina} fullWidth>Save routine</Button>
    </Card>
  )
}
