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

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  return res.json()
}

// ----- Money Health Types -----

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

// ----- Portfolio Types -----

export interface PortfolioHolding {
  scheme_name: string
  amc: string
  category: string
  folio_no: string
  isin: string
  units_held: number
  invested_amount: number
  avg_cost: number
  current_nav: number
  current_value: number
  gain_loss: number
  weight_percent: number
  expense_ratio: number
}

export interface PortfolioSummary {
  total_invested: number
  current_value: number
  absolute_gain: number
  absolute_gain_percent: number
  xirr: number | null
  weighted_expense_ratio: number
  annual_expense_drag_inr: number
}

export interface ConcentrationAnalysis {
  top_fund_weight: number
  top_amc_weight: number
  top_category_weight: number
  category_weights: Record<string, number>
  risk_level: string
}

export interface OverlapPair {
  fund_a: string
  fund_b: string
  overlap_percent: number
}

export interface OverlapAnalysis {
  portfolio_overlap_score: number
  pairs: OverlapPair[]
}

export interface PortfolioAnalysisResponse {
  investor_name: string
  as_of_date: string
  summary: PortfolioSummary
  holdings: PortfolioHolding[]
  concentration: ConcentrationAnalysis
  overlap: OverlapAnalysis
  insights: string[]
  rebalance_suggestions: string[]
  warnings: string[]
}

// ----- API Calls -----

export const api = {
  health: () => get<{ status: string }>('/health'),
  moneyHealth: (inputs: MoneyHealthInputs) =>
    post<MoneyHealthResponse>('/money-health-score/score', inputs),
  analyzePortfolio: (file: File) =>
    uploadFile<PortfolioAnalysisResponse>('/portfolio/analyze', file),
}