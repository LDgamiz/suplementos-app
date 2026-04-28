import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { supabase } from '../../supabaseClient'

interface Cat {
  id: string
  name: string
  category: string
  recommended_dose: number
  dose_unit: string
}

interface Form {
  name: string
  category: string
  recommended_dose: string
  dose_unit: string
}

const emptyForm: Form = { name: '', category: '', recommended_dose: '', dose_unit: '' }

const inputClass =
  'w-full px-3 py-2 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition text-sm'

export default function AdminCatalog() {
  const [items, setItems] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Form>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Form>(emptyForm)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('suplementos_cat')
      .select('*')
      .order('name')
    setItems((data as Cat[]) ?? [])
    setLoading(false)
  }

  async function crear() {
    if (!form.name || !form.category || !form.recommended_dose || !form.dose_unit) return
    setBusy(true)
    const { data, error } = await supabase
      .from('suplementos_cat')
      .insert([{
        name: form.name,
        category: form.category,
        recommended_dose: parseFloat(form.recommended_dose),
        dose_unit: form.dose_unit
      }])
      .select()
      .single()
    if (!error && data) {
      setItems(prev => [...prev, data as Cat].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(emptyForm)
    }
    setBusy(false)
  }

  function iniciarEdicion(c: Cat) {
    setEditId(c.id)
    setEditForm({
      name: c.name,
      category: c.category,
      recommended_dose: c.recommended_dose.toString(),
      dose_unit: c.dose_unit
    })
  }

  async function guardarEdicion() {
    if (!editId) return
    setBusy(true)
    const { error } = await supabase
      .from('suplementos_cat')
      .update({
        name: editForm.name,
        category: editForm.category,
        recommended_dose: parseFloat(editForm.recommended_dose),
        dose_unit: editForm.dose_unit
      })
      .eq('id', editId)
    if (!error) {
      setItems(prev => prev.map(c => c.id === editId ? {
        ...c,
        name: editForm.name,
        category: editForm.category,
        recommended_dose: parseFloat(editForm.recommended_dose),
        dose_unit: editForm.dose_unit
      } : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditId(null)
    }
    setBusy(false)
  }

  async function eliminar(c: Cat) {
    if (!confirm(`Delete "${c.name}" from catalog?`)) return
    const { error } = await supabase.from('suplementos_cat').delete().eq('id', c.id)
    if (!error) setItems(prev => prev.filter(x => x.id !== c.id))
  }

  const visibles = items.filter(c =>
    !filter || c.name.toLowerCase().includes(filter.toLowerCase()) || c.category.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <>
      {/* New entry */}
      <div className="bg-surface border border-white/[0.08] rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Plus size={14} className="text-brand" /> New catalog entry
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
          <input placeholder="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass} />
          <input placeholder="Dose" type="number" value={form.recommended_dose} onChange={e => setForm(p => ({ ...p, recommended_dose: e.target.value }))} className={inputClass} />
          <input placeholder="Unit (mg, mcg...)" value={form.dose_unit} onChange={e => setForm(p => ({ ...p, dose_unit: e.target.value }))} className={inputClass} />
        </div>
        <button
          onClick={crear}
          disabled={busy}
          className="w-full py-2 text-sm rounded-xl bg-brand hover:bg-brand-dark text-[#0A0E1A] font-bold transition disabled:opacity-50">
          Add to catalog
        </button>
      </div>

      {/* Filter */}
      <input
        placeholder="Filter by name or category..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full mb-3 px-4 py-2 rounded-xl bg-surface border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand/50 transition text-sm"
      />

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
      ) : (
        <div className="bg-surface border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Dose</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(c => editId === c.id ? (
                  <tr key={c.id} className="border-b border-white/[0.04] last:border-0 bg-brand/[0.04]">
                    <td className="px-4 py-2"><input className={inputClass} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} /></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <input type="number" className={inputClass} value={editForm.recommended_dose} onChange={e => setEditForm(p => ({ ...p, recommended_dose: e.target.value }))} />
                        <input className={inputClass} value={editForm.dose_unit} onChange={e => setEditForm(p => ({ ...p, dose_unit: e.target.value }))} />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={guardarEdicion} disabled={busy} className="p-1.5 rounded-lg text-brand hover:bg-brand/10 transition"><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.05] transition"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3 text-slate-200">{c.name}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{c.category}</td>
                    <td className="px-4 py-3 text-slate-300">{c.recommended_dose} {c.dose_unit}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => iniciarEdicion(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => eliminar(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
