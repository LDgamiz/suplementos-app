import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import HintButton from './components/HintButton'

Chart.register(ChartDataLabels)

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RANGES: ReadonlyArray<7 | 15 | 30> = [7, 15, 30]

const getColor = (pct: number | null): string => {
  if (pct === null) return '#1E293B'
  if (pct >= 80) return '#00C896'
  if (pct >= 50) return '#F59E0B'
  return '#F87171'
}

interface Props {
  refreshKey: number
  userId?: string
  publicOnly?: boolean
}

interface Grouped {
  taken: number
  total: number
}

export default function WeeklyChart({ refreshKey, userId, publicOnly }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [promedio, setPromedio] = useState<number | null>(null)
  const [days, setDays] = useState<7 | 15 | 30>(7)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, userId, publicOnly, days])

  async function fetchData() {
    let uid = userId
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      uid = user.id
    }

    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - (days - 1))
    const fromDate = from.toISOString().split('T')[0]

    let query = supabase
      .from('suplementos')
      .select('fecha, tomado')
      .eq('user_id', uid)
      .gte('fecha', fromDate)
    if (publicOnly) query = query.eq('publico', true)
    const { data: logs, error } = await query

    if (error) { console.error(error); return }

    const grouped: Record<string, Grouped> = {}
    logs.forEach((log: { fecha: string; tomado: boolean }) => {
      const day = log.fecha
      if (!grouped[day]) grouped[day] = { taken: 0, total: 0 }
      grouped[day].total++
      if (log.tomado) grouped[day].taken++
    })

    const labels: string[] = []
    const taken: number[] = []
    const totals: number[] = []
    const pcts: (number | null)[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const g = grouped[key]

      labels.push(days === 7 ? DAYS[d.getDay()] : String(d.getDate()))
      taken.push(g?.taken ?? 0)
      totals.push(g?.total ?? 0)
      pcts.push(g && g.total > 0 ? Math.round((g.taken / g.total) * 100) : null)
    }

    const diasConDatos = pcts.filter((p): p is number => p !== null)
    const avg = diasConDatos.length > 0
      ? Math.round(diasConDatos.reduce((a, b) => a + b, 0) / diasConDatos.length)
      : null
    setPromedio(avg)
    setLoading(false)
    setTimeout(() => renderChart(labels, taken, totals, pcts), 50)
  }

  function renderChart(labels: string[], taken: number[], totals: number[], pcts: (number | null)[]) {
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const tickColor = '#475569'
    const bgBar = 'rgba(255,255,255,0.05)'
    const dense = labels.length > 7
    const showDataLabels = labels.length <= 15

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Background',
            data: totals.map(t => t > 0 ? t : 1),
            backgroundColor: bgBar,
            borderRadius: 6,
            borderSkipped: false,
            datalabels: { display: false }
          },
          {
            label: 'Taken',
            data: taken,
            backgroundColor: pcts.map(getColor),
            borderRadius: 6,
            borderSkipped: false,
            datalabels: {
              display: (ctx) => showDataLabels && pcts[ctx.dataIndex] !== null,
              anchor: 'end',
              align: 'end',
              offset: 2,
              color: tickColor,
              font: { size: 10, weight: 500 },
              formatter: (_: number, ctx: { dataIndex: number }) => pcts[ctx.dataIndex] + '%'
            }
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: tickColor,
              font: { size: dense ? 10 : 12 },
              autoSkip: dense,
              maxRotation: 0,
            }
          },
          y: { display: false }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            titleColor: '#E2E8F0',
            bodyColor: '#94A3B8',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            callbacks: {
              title: (items) => items.length ? labels[items[0].dataIndex] : '',
              label: (item) => {
                if (item.datasetIndex === 0) return ''
                const i = item.dataIndex
                if (totals[i] === 0) return 'No records'
                return `${taken[i]} of ${totals[i]} taken (${pcts[i]}%)`
              }
            },
            filter: (item) => item.datasetIndex === 1
          }
        }
      }
    })
  }

  useEffect(() => {
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [])

  return (
    <div className="bg-surface border border-white/[0.08] rounded-2xl p-5 mt-8 mb-6">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-1">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Consistency</h2>
            <p className="text-xs text-slate-500">Last {days} days</p>
          </div>
          <HintButton
            label="Consistency hint"
            text="Each bar is a day's completion percentage from the supplements you marked taken. Use the buttons to switch between 7, 15 and 30 days."
          />
        </div>
        {promedio !== null && (
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{promedio}%</p>
            <p className="text-xs text-slate-500">average</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3" role="group" aria-label="Range filter">
        {RANGES.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setDays(n)}
            aria-pressed={days === n}
            className={`px-3 py-1 text-xs rounded-lg border transition ${
              days === n
                ? 'bg-brand/10 border-brand/30 text-brand'
                : 'bg-surface-2 border-white/10 text-slate-400 hover:text-slate-200'
            }`}>
            {n}d
          </button>
        ))}
      </div>

      {loading
        ? <p className="text-center text-slate-600 py-10 text-sm">Loading...</p>
        : <div style={{ position: 'relative', height: '180px' }}>
            <canvas ref={canvasRef} />
          </div>
      }
      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {[
          { color: '#00C896', label: '≥80%' },
          { color: '#F59E0B', label: '50–79%' },
          { color: '#F87171', label: '<50%' },
          { color: '#1E293B', label: 'No data' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-slate-500">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
