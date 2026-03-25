'use client'
import { MoneyHealthResponse } from '@/services/api'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  emergency_fund:        { label: 'Emergency Fund',    icon: '🛟', color: '#3b82f6' },
  insurance:             { label: 'Insurance',          icon: '🛡️', color: '#8b5cf6' },
  diversification:       { label: 'Diversification',   icon: '📊', color: '#22c55e' },
  debt:                  { label: 'Debt Management',   icon: '💳', color: '#f97316' },
  tax_efficiency:        { label: 'Tax Efficiency',    icon: '🧮', color: '#eab308' },
  retirement_readiness:  { label: 'Retirement Ready',  icon: '🎯', color: '#ec4899' },
}

function getGrade(score: number) {
  if (score >= 80) return { grade: 'A', label: 'Excellent', color: '#22c55e' }
  if (score >= 65) return { grade: 'B', label: 'Good',      color: '#86efac' }
  if (score >= 50) return { grade: 'C', label: 'Fair',      color: '#eab308' }
  if (score >= 35) return { grade: 'D', label: 'Weak',      color: '#f97316' }
  return                   { grade: 'F', label: 'Critical',  color: '#ef4444' }
}

function ScoreRing({ score }: { score: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const { grade, label, color } = getGrade(score)
  const dash = (score / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#334155" strokeWidth={12} />
        <circle
          cx={70} cy={70} r={r}
          fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="score-ring"
        />
        <text x={70} y={65} textAnchor="middle" fill="#f1f5f9" fontSize={28} fontWeight={700}>{Math.round(score)}</text>
        <text x={70} y={84} textAnchor="middle" fill={color} fontSize={12} fontWeight={600}>{grade} — {label}</text>
      </svg>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Overall Money Health Score</div>
    </div>
  )
}

export default function ScoreResults({ result }: { result: MoneyHealthResponse }) {
  const radarData = Object.entries(result.categories).map(([key, val]) => ({
    category: CATEGORY_META[key]?.label ?? key,
    score: Math.round(val.score),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top row: Ring + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem' }}>
          <ScoreRing score={result.overall_score} />
        </div>

        <div className="card">
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>Score Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: '0.8rem' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category cards */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Category Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(result.categories).map(([key, val]) => {
            const meta = CATEGORY_META[key] ?? { label: key, icon: '📌', color: '#94a3b8' }
            const { label: grade, color: gradeColor } = getGrade(val.score)
            return (
              <div key={key} className="card" style={{ borderLeft: `3px solid ${meta.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.88rem' }}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: gradeColor, fontSize: '0.95rem' }}>{Math.round(val.score)}</span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>/100</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, background: '#334155', borderRadius: 3, marginBottom: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ width: `${val.score}%`, height: '100%', background: meta.color, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>

                <div style={{ fontSize: '0.77rem', color: '#94a3b8', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  <strong style={{ color: '#cbd5e1' }}>Why:</strong> {val.why}
                </div>
                <div style={{ fontSize: '0.77rem', color: '#86efac', lineHeight: 1.4 }}>
                  <strong>💡</strong> {val.improvement}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top suggestions */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>🚀 Top 3 Actions for You</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {result.improvement_suggestions.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.75rem', background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#22c55e',
                color: '#000', fontWeight: 700, fontSize: '0.72rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{i + 1}</div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.4 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions */}
      <details style={{ cursor: 'pointer' }}>
        <summary style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, padding: '0.5rem 0' }}>
          📋 Assumptions & Methodology
        </summary>
        <div className="card" style={{ marginTop: '0.5rem' }}>
          {Object.entries(result.assumptions).map(([k, v]) => (
            <div key={k} style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem', lineHeight: 1.4 }}>
              <strong style={{ color: '#94a3b8' }}>{k.replace(/_/g, ' ')}:</strong> {v}
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
