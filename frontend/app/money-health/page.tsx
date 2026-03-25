'use client'
import { useState } from 'react'
import { api, MoneyHealthInputs, MoneyHealthResponse } from '@/services/api'
import ScoreResults from '@/components/ui/ScoreResults'

const STEPS = ['Income & Expenses', 'Savings & Insurance', 'Loans & Investments']

const DEFAULT: MoneyHealthInputs = {
  income_inr_monthly: 0,
  expenses_inr_monthly: 0,
  savings_inr: 0,
  insurance_inr: 0,
  loans_inr_monthly: 0,
  investments_inr: 0,
}

function fmt(n: number) {
  if (!n) return ''
  return n.toLocaleString('en-IN')
}

function parseInr(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0
}

interface FieldProps {
  label: string
  hint: string
  field: keyof MoneyHealthInputs
  form: MoneyHealthInputs
  setForm: (f: MoneyHealthInputs) => void
}
function Field({ label, hint, field, form, setForm }: FieldProps) {
  return (
    <div>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '0.9rem' }}>₹</span>
        <input
          type="number"
          min={0}
          step={1000}
          placeholder="0"
          value={form[field] || ''}
          onChange={e => setForm({ ...form, [field]: parseFloat(e.target.value) || 0 })}
          style={{ paddingLeft: '1.75rem' }}
        />
      </div>
      <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.25rem' }}>{hint}</div>
    </div>
  )
}

export default function MoneyHealthPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<MoneyHealthInputs>(DEFAULT)
  const [result, setResult] = useState<MoneyHealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await api.moneyHealth(form)
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button className="btn-ghost" onClick={() => setResult(null)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            ← Recalculate
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>❤️ Your Money Health Score</h1>
        </div>
        <ScoreResults result={result} />
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>❤️ Money Health Score</h1>
      <p style={{ color: '#94a3b8', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        Answer 6 simple questions to get your personalised financial fitness score.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: i <= step ? '#22c55e' : '#334155',
              transition: 'background 0.3s',
            }} />
            <div style={{ fontSize: '0.68rem', color: i === step ? '#22c55e' : '#475569', marginTop: '0.3rem', fontWeight: i === step ? 600 : 400 }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {step === 0 && (
          <>
            <Field label="Monthly take-home income" hint="Your in-hand salary / business income after tax" field="income_inr_monthly" form={form} setForm={setForm} />
            <Field label="Monthly expenses" hint="All spending: rent, food, utilities, subscriptions, etc." field="expenses_inr_monthly" form={form} setForm={setForm} />
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Emergency fund (liquid savings)" hint="Money in savings account / liquid funds you can access in 24hrs" field="savings_inr" form={form} setForm={setForm} />
            <Field label="Total life insurance cover" hint="Sum assured across all term / life insurance policies" field="insurance_inr" form={form} setForm={setForm} />
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Total monthly loan EMIs" hint="Home loan + car loan + personal loan EMIs combined" field="loans_inr_monthly" form={form} setForm={setForm} />
            <Field label="Current invested corpus" hint="Total value of mutual funds, stocks, FDs, PPF, NPS, gold, etc." field="investments_inr" form={form} setForm={setForm} />
          </>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', fontSize: '0.82rem', color: '#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          {step > 0 ? (
            <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
          ) : <div />}

          {step < 2 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? '⏳ Calculating…' : '🚀 Get My Score'}
            </button>
          )}
        </div>
      </div>

      {/* What we calculate */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {['Emergency Fund', 'Insurance', 'Diversification', 'Debt', 'Tax Efficiency', 'Retirement'].map(c => (
          <div key={c} style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '0.5rem 0.6rem', fontSize: '0.75rem', color: '#86efac', textAlign: 'center' }}>
            {c}
          </div>
        ))}
      </div>
    </div>
  )
}
