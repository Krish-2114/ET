const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ----- Types -----

export interface MoneyHealthInputs {
  income_inr_monthly: number
  expenses_inr_monthly: number
  savings_inr: number
  insurance_inr: number
  loans_inr_monthly: number
  investments_inr: number
}

export interface CategoryScore {
  score: number
  why: string
  improvement: string
}

export interface MoneyHealthResponse {
  overall_score: number
  categories: Record<string, CategoryScore>
  improvement_suggestions: string[]
  assumptions: Record<string, string>
}

// ----- API Calls -----

export const api = {
  health: () => get<{ status: string }>('/health'),
  moneyHealth: (inputs: MoneyHealthInputs) =>
    post<MoneyHealthResponse>('/money-health-score/score', inputs),
}
