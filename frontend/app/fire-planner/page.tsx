"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FIREInput {
  current_age: number;
  target_retirement_age: number;
  monthly_income: number;
  monthly_expenses: number;
  current_savings: number;
  monthly_sip: number;
}

interface YearlyProjection {
  year: number;
  age: number;
  corpus: number;
  sip_contributed: number;
  growth_from_existing: number;
}

interface MilestoneCard {
  year: number;
  age: number;
  corpus_value: number;
  label: string;
  description: string;
  achieved: boolean;
}

interface FIREOutput {
  fire_corpus_needed: number;
  current_corpus: number;
  corpus_gap: number;
  years_to_fire: number;
  monthly_sip_needed: number;
  current_savings_rate: number;
  yearly_projections: YearlyProjection[];
  milestones: MilestoneCard[];
  inflation_adjusted_monthly_expense: number;
  annual_expense_at_retirement: number;
  corpus_lasts_till_age: number;
  assumed_return_rate: number;
  assumed_inflation_rate: number;
  equity_allocation: number;
  ai_explanation: string;
  improvement_tips: string[];
  is_achievable: boolean;
  feasibility_note: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatINRShort = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${Math.round(value / 1000)}K`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label,
  name,
  value,
  onChange,
  prefix = "₹",
  min,
  max,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-violet-500">
        {prefix && (
          <span className="px-3 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 text-sm">
            {prefix}
          </span>
        )}
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-gray-100 outline-none"
        />
      </div>
      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-500">{hint}</p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
  green = false,
  red = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800"
          : green
          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
          : red
          ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
      }`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p
        className={`text-xl font-semibold ${
          highlight
            ? "text-violet-700 dark:text-violet-300"
            : green
            ? "text-green-700 dark:text-green-300"
            : red
            ? "text-red-600 dark:text-red-400"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
      )}
    </div>
  );
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
          Age {label}
        </p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatINRShort(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FIREPlannerPage() {
  const [form, setForm] = useState({
    current_age: "28",
    target_retirement_age: "50",
    monthly_income: "100000",
    monthly_expenses: "60000",
    current_savings: "500000",
    monthly_sip: "10000",
  });

  const [result, setResult] = useState<FIREOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const payload: FIREInput = {
      current_age: parseInt(form.current_age),
      target_retirement_age: parseInt(form.target_retirement_age),
      monthly_income: parseFloat(form.monthly_income),
      monthly_expenses: parseFloat(form.monthly_expenses),
      current_savings: parseFloat(form.current_savings),
      monthly_sip: parseFloat(form.monthly_sip || "0"),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/fire/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Calculation failed");
      }

      const data: FIREOutput = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data — sample every 2 years to keep chart readable
  const chartData = result
    ? result.yearly_projections
        .filter((p) => p.year % 2 === 0 || p.year === result.years_to_fire)
        .map((p) => ({
          age: p.age,
          Corpus: p.corpus,
          "SIP Contributed": p.sip_contributed,
          Target: result.fire_corpus_needed,
        }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            FIRE Path Planner
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Financial Independence, Retire Early — find your number and the
            monthly SIP to get there.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300">
          All projections assume {" "}
          <strong>6% inflation</strong> and{" "}
          <strong>equity-weighted returns</strong>. These are estimates for
          planning purposes only — not financial advice or guaranteed outcomes.
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-5">
            Your details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Current age"
              name="current_age"
              value={form.current_age}
              onChange={handleChange}
              prefix="yrs"
              min={18}
              max={70}
            />
            <InputField
              label="Target retirement age"
              name="target_retirement_age"
              value={form.target_retirement_age}
              onChange={handleChange}
              prefix="yrs"
              min={25}
              max={80}
            />
            <InputField
              label="Monthly take-home income"
              name="monthly_income"
              value={form.monthly_income}
              onChange={handleChange}
              hint="Post-tax income"
            />
            <InputField
              label="Monthly expenses"
              name="monthly_expenses"
              value={form.monthly_expenses}
              onChange={handleChange}
              hint="All living costs"
            />
            <InputField
              label="Current savings & investments"
              name="current_savings"
              value={form.current_savings}
              onChange={handleChange}
              hint="MF + FD + stocks + PF"
            />
            <InputField
              label="Current monthly SIP"
              name="monthly_sip"
              value={form.monthly_sip}
              onChange={handleChange}
              hint="Optional — 0 if none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full sm:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? "Calculating..." : "Calculate my FIRE plan"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Feasibility banner */}
            <div
              className={`rounded-xl p-4 border text-sm ${
                result.is_achievable
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                  : "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300"
              }`}
            >
              {result.feasibility_note}
            </div>

            {/* Key numbers */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                label="FIRE corpus needed"
                value={formatINR(result.fire_corpus_needed)}
                sub="Total retirement corpus"
                highlight
              />
              <StatCard
                label="Monthly SIP needed"
                value={formatINR(result.monthly_sip_needed)}
                sub="To reach corpus on time"
                highlight
              />
              <StatCard
                label="Years to FIRE"
                value={`${result.years_to_fire} yrs`}
                sub={`Retire at ${form.target_retirement_age}`}
              />
              <StatCard
                label="Savings rate"
                value={`${(result.current_savings_rate * 100).toFixed(1)}%`}
                sub="% of income saved"
                green={result.current_savings_rate >= 0.3}
                red={result.current_savings_rate < 0.2}
              />
              <StatCard
                label="Monthly expense at retirement"
                value={formatINR(result.inflation_adjusted_monthly_expense)}
                sub="Inflation adjusted"
              />
              <StatCard
                label="Corpus gap"
                value={formatINR(result.corpus_gap)}
                sub="Still needs to be built"
                red={result.corpus_gap > 0}
              />
              <StatCard
                label="Corpus lasts till"
                value={`Age ${result.corpus_lasts_till_age}`}
                sub="With 4% withdrawal rule"
                green={result.corpus_lasts_till_age >= 85}
              />
              <StatCard
                label="Equity allocation"
                value={`${(result.equity_allocation * 100).toFixed(0)}%`}
                sub={`${(result.assumed_return_rate * 100).toFixed(1)}% blended return assumed`}
              />
            </div>

            {/* Corpus growth chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                Corpus growth over time
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                Projected portfolio value year by year vs your FIRE target
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="age"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}`}
                    label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatINRShort}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={result.fire_corpus_needed}
                    stroke="#10b981"
                    strokeDasharray="6 3"
                    label={{ value: "FIRE target", position: "right", fontSize: 10, fill: "#10b981" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="SIP Contributed"
                    stroke="#0ea5e9"
                    fill="url(#sipGrad)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="Corpus"
                    stroke="#7c3aed"
                    fill="url(#corpusGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Milestones */}
            {result.milestones.length > 0 && (
              <div>
                <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Milestones on your FIRE journey
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.milestones.map((m, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-semibold shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {m.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Age {m.age} · Year {m.year} · {formatINR(m.corpus_value)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            <div className="bg-violet-50 dark:bg-violet-950 border border-violet-100 dark:border-violet-800 rounded-2xl p-6">
              <h2 className="text-base font-medium text-violet-900 dark:text-violet-200 mb-2">
                How this was calculated
              </h2>
              <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed">
                {result.ai_explanation}
              </p>
            </div>

            {/* Improvement Tips */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
                Ways to improve your FIRE timeline
              </h2>
              <ul className="space-y-3">
                {result.improvement_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-violet-500 mt-0.5 shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Assumptions footer */}
            <div className="text-xs text-gray-400 dark:text-gray-600 text-center pb-4">
              Assumptions: {result.assumed_inflation_rate * 100}% inflation ·{" "}
              {(result.assumed_return_rate * 100).toFixed(1)}% blended return ·{" "}
              {result.equity_allocation * 100}% equity allocation · 25x FIRE multiplier ·
              4% safe withdrawal rate. Not financial advice.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}