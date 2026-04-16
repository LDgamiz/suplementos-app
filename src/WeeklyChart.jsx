// src/WeeklyChart.jsx
import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  BarController
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, BarController, ChartDataLabels)

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const getColor = (pct) => {
  if (pct === null) return '#E5E4DF'
  if (pct >= 80) return '#3B6D11'
  if (pct >= 50) return '#BA7517'
  return '#A32D2D'
}

export default function WeeklyChart({ refreshKey }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [promedio, setPromedio] = useState(null)

  useEffect(() => {
    fetchWeeklyData()
  }, [refreshKey])

  async function fetchWeeklyData() {
    const { data: { user } } = await supabase.auth.getUser()

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]

    const { data: logs, error } = await supabase
      .from('suplementos')
      .select('fecha, tomado')
      .eq('user_id', user.id)
      .gte('fecha', fromDate)

    if (error) { console.error(error); return }

    // Agrupar por fecha
    const grouped = {}
    logs.forEach(log => {
      const day = log.fecha
      if (!grouped[day]) grouped[day] = { taken: 0, total: 0 }
      grouped[day].total++
      if (log.tomado) grouped[day].taken++
    })

    // Construir los 7 días
    const labels = []
    const taken = []
    const totals = []
    const pcts = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const g = grouped[key]

      labels.push(DAYS[d.getDay()])
      taken.push(g?.taken ?? 0)
      totals.push(g?.total ?? 0)
      pcts.push(g && g.total > 0 ? Math.round((g.taken / g.total) * 100) : null)
    }

    // Promedio solo de días con datos
    const diasConDatos = pcts.filter(p => p !== null)
    const avg = diasConDatos.length > 0
      ? Math.round(diasConDatos.reduce((a, b) => a + b, 0) / diasConDatos.length)
      : null
    setPromedio(avg)

    renderChart(labels, taken, totals, pcts)
    setLoading(false)
  }

  function renderChart(labels, taken, totals, pcts) {
    // Destruir chart anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const tickColor = '#888780'
    const bgBar = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Fondo',
            data: totals.map(t => t > 0 ? t : 1),
            backgroundColor: bgBar,
            borderRadius: 6,
            borderSkipped: false,
            datalabels: { display: false }
          },
          {
            label: 'Tomados',
            data: taken,
            backgroundColor: pcts.map(getColor),
            borderRadius: 6,
            borderSkipped: false,
            datalabels: {
              display: (ctx) => pcts[ctx.dataIndex] !== null,
              anchor: 'end',
              align: 'end',
              offset: 2,
              color: tickColor,
              font: { size: 11, weight: '500' },
              formatter: (_, ctx) => pcts[ctx.dataIndex] + '%'
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
            ticks: { color: tickColor, font: { size: 12 }, autoSkip: false }
          },
          y: { display: false }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => items.length ? labels[items[0].dataIndex] : '',
              label: (item) => {
                if (item.datasetIndex === 0) return null
                const i = item.dataIndex
                if (totals[i] === 0) return 'Sin registros'
                return `${taken[i]} de ${totals[i]} tomados (${pcts[i]}%)`
              }
            },
            filter: (item) => item.datasetIndex === 1
          }
        }
      }
    })
  }

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mt-8 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-700">Consistencia semanal</h2>
          <p className="text-xs text-gray-400">Últimos 7 días</p>
        </div>
        {promedio !== null && (
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-800">{promedio}%</p>
            <p className="text-xs text-gray-400">promedio</p>
          </div>
        )}
      </div>

      {loading
        ? <p className="text-center text-gray-400 py-10 text-sm">Cargando...</p>
        : <div style={{ position: 'relative', height: '180px' }}>
            <canvas ref={canvasRef} />
          </div>
      }

      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {[
          { color: '#3B6D11', label: '≥80%' },
          { color: '#BA7517', label: '50–79%' },
          { color: '#A32D2D', label: '<50%' },
          { color: '#E5E4DF', label: 'Sin datos' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}