"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxInput {
  basic_salary: number;
  hra_received: number;
  special_allowance: number;
  other_income: number;
  rent_paid_annual: number;
  is_metro: boolean;
  section_80c: number;
  section_80d_self: number;
  section_80d_parents: number;
  section_80ccd_nps: number;
  home_loan_interest: number;
  other_deductions: number;
  age: number;
}

interface RegimeComparison {
  regime: string;
  gross_income: number;
  total_deductions: number;
  taxable_income: number;
  tax_before_cess: number;
  cess: number;
  total_tax: number;
  effective_tax_rate: number;
  monthly_tax: number;
  in_hand_monthly: number;
  slab_breakdown: Array<{
    slab: string;
    income_in_slab: number;
    rate: string;
    tax: number;
  }>;
}

interface DeductionBreakdown {
  name: string;
  amount: number;
  section: string;
  applicable: boolean;
  note: string;
}

interface TaxOutput {
  gross_total_income: number;
  recommended_regime: string;
  tax_savings_by_switching: number;
  old_regime: RegimeComparison;
  new_regime: RegimeComparison;
  deduction_breakdown: DeductionBreakdown[];
  total_deductions_old: number;
  hra_exemption: number;
  ai_explanation: string;
  tax_saving_tips: string[];
  financial_year: string;
  assessment_year: string;
  disclaimer: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label,
  name,
  value,
  onChange,
  hint,
  max,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-emerald-500">
        <span className="px-3 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 text-sm">
          ₹
        </span>
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          min={0}
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

function RegimeCard({
  regime,
  recommended,
}: {
  regime: RegimeComparison;
  recommended: string;
}) {
  const [showSlabs, setShowSlabs] = useState(false);
  const isRecommended = regime.regime === recommended;
  const label = regime.regime === "old" ? "Old Regime" : "New Regime";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isRecommended
          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
          {label}
        </h3>
        {isRecommended && (
          <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
            Recommended
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Gross income</span>
          <span className="text-gray-900 dark:text-gray-100">{formatINR(regime.gross_income)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total deductions</span>
          <span className="text-green-600 dark:text-green-400">- {formatINR(regime.total_deductions)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-800 pt-2">
          <span className="text-gray-500 dark:text-gray-400">Taxable income</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{formatINR(regime.taxable_income)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tax + cess</span>
          <span className="text-red-600 dark:text-red-400 font-medium">{formatINR(regime.total_tax)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Effective rate</span>
          <span className="text-gray-900 dark:text-gray-100">{regime.effective_tax_rate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-800 pt-2">
          <span className="text-gray-500 dark:text-gray-400">Monthly tax</span>
          <span className="text-red-500 dark:text-red-400">{formatINR(regime.monthly_tax)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Monthly in-hand</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-base">{formatINR(regime.in_hand_monthly)}</span>
        </div>
      </div>

      <button
        onClick={() => setShowSlabs(!showSlabs)}
        className="mt-4 text-xs text-gray-500 dark:text-gray-400 underline"
      >
        {showSlabs ? "Hide" : "Show"} slab breakdown
      </button>

      {showSlabs && (
        <div className="mt-3 space-y-1">
          {regime.slab_breakdown.map((s, i) => (
            <div key={i} className="flex justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
              <span>{s.slab} @ {s.rate}</span>
              <span>{formatINR(s.tax)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaxWizardPage() {
  const [form, setForm] = useState({
    basic_salary: "600000",
    hra_received: "200000",
    special_allowance: "150000",
    other_income: "0",
    rent_paid_annual: "120000",
    is_metro: false,
    section_80c: "100000",
    section_80d_self: "15000",
    section_80d_parents: "0",
    section_80ccd_nps: "0",
    home_loan_interest: "0",
    other_deductions: "0",
    age: "30",
  });

  const [result, setResult] = useState<TaxOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const payload: TaxInput = {
      basic_salary: parseFloat(form.basic_salary),
      hra_received: parseFloat(form.hra_received),
      special_allowance: parseFloat(form.special_allowance),
      other_income: parseFloat(form.other_income || "0"),
      rent_paid_annual: parseFloat(form.rent_paid_annual || "0"),
      is_metro: form.is_metro as unknown as boolean,
      section_80c: parseFloat(form.section_80c || "0"),
      section_80d_self: parseFloat(form.section_80d_self || "0"),
      section_80d_parents: parseFloat(form.section_80d_parents || "0"),
      section_80ccd_nps: parseFloat(form.section_80ccd_nps || "0"),
      home_loan_interest: parseFloat(form.home_loan_interest || "0"),
      other_deductions: parseFloat(form.other_deductions || "0"),
      age: parseInt(form.age),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tax/calculate`,
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

      const data: TaxOutput = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Tax Wizard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Compare Old vs New regime for FY 2024-25 and find which saves you more tax.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300">
          FY 2024-25 · AY 2025-26. Calculations are indicative only. Consult a CA before filing.
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">

          {/* Income */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Annual income
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField label="Basic salary" name="basic_salary" value={form.basic_salary} onChange={handleChange} hint="Annual basic salary" />
              <InputField label="HRA received" name="hra_received" value={form.hra_received} onChange={handleChange} hint="Annual HRA from employer" />
              <InputField label="Special allowance" name="special_allowance" value={form.special_allowance} onChange={handleChange} hint="All other allowances" />
              <InputField label="Other income" name="other_income" value={form.other_income} onChange={handleChange} hint="Interest, freelance, etc." />
              <InputField label="Annual rent paid" name="rent_paid_annual" value={form.rent_paid_annual} onChange={handleChange} hint="0 if not renting" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_metro"
                checked={form.is_metro as unknown as boolean}
                onChange={handleChange}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I live in a metro city (Mumbai, Delhi, Kolkata, Chennai)
              </span>
            </label>
          </div>

          {/* Deductions */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Deductions (old regime)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField label="80C investments" name="section_80c" value={form.section_80c} onChange={handleChange} hint="PF, ELSS, PPF, LIC — max ₹1.5L" max={150000} />
              <InputField label="80D — self & family" name="section_80d_self" value={form.section_80d_self} onChange={handleChange} hint="Health insurance — max ₹25,000" max={25000} />
              <InputField label="80D — parents" name="section_80d_parents" value={form.section_80d_parents} onChange={handleChange} hint="Parents health insurance — max ₹50,000" max={50000} />
              <InputField label="NPS 80CCD(1B)" name="section_80ccd_nps" value={form.section_80ccd_nps} onChange={handleChange} hint="Extra NPS — max ₹50,000" max={50000} />
              <InputField label="Home loan interest" name="home_loan_interest" value={form.home_loan_interest} onChange={handleChange} hint="Section 24(b) — max ₹2L" max={200000} />
              <InputField label="Other deductions" name="other_deductions" value={form.other_deductions} onChange={handleChange} hint="Any other eligible deductions" />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? "Calculating..." : "Calculate my tax"}
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

            {/* Savings banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {result.recommended_regime === "new" ? "New Regime" : "Old Regime"} saves you{" "}
                <span className="text-lg font-bold">
                  {formatINR(result.tax_savings_by_switching)}
                </span>{" "}
                in tax this year
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                FY {result.financial_year} · AY {result.assessment_year}
              </p>
            </div>

            {/* Regime comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RegimeCard regime={result.old_regime} recommended={result.recommended_regime} />
              <RegimeCard regime={result.new_regime} recommended={result.recommended_regime} />
            </div>

            {/* Deduction breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                Deduction breakdown (old regime)
              </h2>
              <div className="space-y-2">
                {result.deduction_breakdown.filter(d => d.applicable).map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{d.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{d.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        - {formatINR(d.amount)}
                      </p>
                      <p className="text-xs text-gray-400">{d.section}</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-medium text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Total deductions</span>
                  <span className="text-green-600 dark:text-green-400">- {formatINR(result.total_deductions_old)}</span>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-6">
              <h2 className="text-base font-medium text-emerald-900 dark:text-emerald-200 mb-2">
                Why this recommendation
              </h2>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {result.ai_explanation}
              </p>
            </div>

            {/* Tax saving tips */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
                Ways to reduce your tax further
              </h2>
              <ul className="space-y-3">
                {result.tax_saving_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-emerald-500 mt-0.5 shrink-0">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center pb-4">
              {result.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}