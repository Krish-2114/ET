'use client'

import { useMemo, useState } from 'react'
import { api, PortfolioAnalysisResponse } from '@/services/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts'

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div
      className="card"
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub}</div>
      ) : null}
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: '0.8rem' }}>{title}</div>
      <div style={{ width: '100%', height: 320 }}>{children}</div>
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: Record<string, unknown> }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.22)',
        borderRadius: 10,
        padding: '0.75rem',
        fontSize: '0.82rem',
        color: '#e2e8f0',
      }}
    >
      {label ? <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{label}</div> : null}
      {payload.map((entry, index) => (
        <div key={index} style={{ marginBottom: '0.2rem' }}>
          {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</strong>
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#fb7185', '#c084fc', '#f97316']

export default function PortfolioPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<PortfolioAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!file) {
      setError('Please select a CSV file first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await api.analyzePortfolio(file)
      setResult(res)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong while analyzing the portfolio.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fundAllocationData = useMemo(() => {
    if (!result) return []
    return result.holdings.map((holding) => ({
      name: holding.scheme_name,
      value: Number(holding.current_value.toFixed(2)),
      weight: Number(holding.weight_percent.toFixed(2)),
    }))
  }, [result])

  const categoryAllocationData = useMemo(() => {
    if (!result) return []
    return Object.entries(result.concentration.category_weights).map(([category, weight]) => ({
      category,
      weight: Number(weight.toFixed(2)),
    }))
  }, [result])

  const expenseRatioData = useMemo(() => {
    if (!result) return []
    return result.holdings.map((holding) => ({
      name: holding.scheme_name,
      expense_ratio: Number(holding.expense_ratio.toFixed(2)),
    }))
  }, [result])

  const investedVsCurrentData = useMemo(() => {
    if (!result) return []
    return result.holdings.map((holding) => ({
      name: holding.scheme_name,
      invested: Number(holding.invested_amount.toFixed(2)),
      current: Number(holding.current_value.toFixed(2)),
    }))
  }, [result])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          📊 Portfolio X-Ray
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
          Upload a mock CAMS-style CSV to analyse holdings, XIRR, concentration, overlap, and expense drag.
        </p>
      </div>

      {!result && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 720 }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Select portfolio CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem' }}>
              Use the sample file you created in <code>backend/sample_data/mock_cams_portfolio.csv</code>
            </div>
          </div>

          {file && (
            <div
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.18)',
                borderRadius: 8,
                padding: '0.75rem',
                fontSize: '0.85rem',
                color: '#bbf7d0',
              }}
            >
              Selected file: <strong>{file.name}</strong>
            </div>
          )}

          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8,
                padding: '0.75rem',
                fontSize: '0.85rem',
                color: '#fca5a5',
                whiteSpace: 'pre-wrap',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? '⏳ Analyzing…' : '🚀 Analyze Portfolio'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{result.investor_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Analysis date: {result.as_of_date}
              </div>
            </div>

            <button
              className="btn-ghost"
              onClick={() => {
                setResult(null)
                setError('')
              }}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            >
              ← Analyze another file
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.9rem',
            }}
          >
            <StatCard
              label="Total Invested"
              value={formatINR(result.summary.total_invested)}
            />
            <StatCard
              label="Current Value"
              value={formatINR(result.summary.current_value)}
            />
            <StatCard
              label="Absolute Gain"
              value={formatINR(result.summary.absolute_gain)}
              sub={`${result.summary.absolute_gain_percent.toFixed(2)}%`}
            />
            <StatCard
              label="XIRR"
              value={
                result.summary.xirr !== null
                  ? `${result.summary.xirr.toFixed(2)}%`
                  : 'N/A'
              }
            />
            <StatCard
              label="Weighted Expense Ratio"
              value={`${result.summary.weighted_expense_ratio.toFixed(2)}%`}
            />
            <StatCard
              label="Annual Expense Drag"
              value={formatINR(result.summary.annual_expense_drag_inr)}
            />
          </div>

          {result.warnings.length > 0 && (
            <div
              className="card"
              style={{
                border: '1px solid rgba(245,158,11,0.35)',
                background: 'rgba(245,158,11,0.07)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.6rem' }}>⚠️ Warnings</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#fcd34d' }}>
                {result.warnings.map((warning, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            <ChartCard title="🥧 Allocation by Fund">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundAllocationData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label={({ name, percent }) =>
                      `${name.length > 16 ? `${name.slice(0, 16)}…` : name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {fundAllocationData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatINR(value), 'Current Value']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="📚 Category Allocation">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryAllocationData} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis
                    dataKey="category"
                    angle={-20}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="weight" name="Weight %" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="💸 Expense Ratio by Fund">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseRatioData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis type="number" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="expense_ratio" name="Expense Ratio %" radius={[0, 8, 8, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="📈 Invested vs Current Value">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investedVsCurrentData} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis
                    dataKey="name"
                    angle={-20}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatINR(value), 'Amount']}
                  />
                  <Legend />
                  <Bar dataKey="invested" name="Invested" radius={[8, 8, 0, 0]} fill="#818cf8" />
                  <Bar dataKey="current" name="Current Value" radius={[8, 8, 0, 0]} fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.8rem' }}>🎯 Concentration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.9rem' }}>
                <div>Top fund weight: <strong>{result.concentration.top_fund_weight.toFixed(2)}%</strong></div>
                <div>Top AMC weight: <strong>{result.concentration.top_amc_weight.toFixed(2)}%</strong></div>
                <div>Top category weight: <strong>{result.concentration.top_category_weight.toFixed(2)}%</strong></div>
                <div>
                  Risk level:{' '}
                  <strong style={{ textTransform: 'capitalize' }}>
                    {result.concentration.risk_level}
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: '0.9rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.45rem' }}>
                  Category allocation
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {Object.entries(result.concentration.category_weights).map(([category, weight]) => (
                    <div
                      key={category}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(148,163,184,0.12)',
                        paddingBottom: '0.3rem',
                      }}
                    >
                      <span>{category}</span>
                      <strong>{weight.toFixed(2)}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.8rem' }}>🔁 Overlap</div>
              <div style={{ marginBottom: '0.8rem', fontSize: '0.9rem' }}>
                Portfolio overlap score:{' '}
                <strong>{result.overlap.portfolio_overlap_score.toFixed(2)}%</strong>
              </div>

              {result.overlap.pairs.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  No overlap pairs available from the current mock dataset.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {result.overlap.pairs.map((pair, idx) => (
                    <div
                      key={`${pair.fund_a}-${pair.fund_b}-${idx}`}
                      style={{
                        border: '1px solid rgba(148,163,184,0.16)',
                        borderRadius: 8,
                        padding: '0.7rem',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {pair.fund_a}
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {pair.fund_b}
                      </div>
                      <div style={{ color: '#94a3b8' }}>
                        Overlap: <strong style={{ color: '#e2e8f0' }}>{pair.overlap_percent.toFixed(2)}%</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '0.8rem' }}>📦 Holdings</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Scheme</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>AMC</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Category</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Units</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Invested</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Current Value</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Gain/Loss</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Weight</th>
                    <th style={{ padding: '0.7rem 0.5rem' }}>Expense Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {result.holdings.map((holding) => (
                    <tr
                      key={`${holding.scheme_name}-${holding.folio_no}-${holding.isin}`}
                      style={{ borderBottom: '1px solid rgba(148,163,184,0.10)' }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem' }}>{holding.scheme_name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{holding.amc}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{holding.category}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{holding.units_held.toFixed(4)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatINR(holding.invested_amount)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatINR(holding.current_value)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{formatINR(holding.gain_loss)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{holding.weight_percent.toFixed(2)}%</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{holding.expense_ratio.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🧠 Key Insights</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {result.insights.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🛠 Rebalance Suggestions</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {result.rebalance_suggestions.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}