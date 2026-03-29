"use client";

import { useState } from "react";

export default function CouplePlanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Mock initial state for fast hackathon demo
  const [formData, setFormData] = useState({
    user: { name: "Jacob", income: 1500000, expenses: 400000, tax_regime: "new" },
    partner: { name: "Amy", income: 1000000, expenses: 300000, tax_regime: "old" },
    shared_goals: [{ goal_name: "House Downpayment", target_amount: 5000000, years: 5 }],
    expense_split_preference: "proportional",
  });

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Point this to your local FastAPI backend port (e.g., 8000)
      const res = await fetch("http://localhost:8000/api/couple/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Failed to fetch plan:", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Couple Planner</h1>
        <p className="text-gray-500 mt-2">Optimize shared goals and split finances equitably.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                value={formData.user.name} 
                onChange={(e) => setFormData({...formData, user: {...formData.user, name: e.target.value}})} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Annual Income (₹)</label>
              <input 
                type="number" 
                value={formData.user.income} 
                onChange={(e) => setFormData({...formData, user: {...formData.user, income: Number(e.target.value)}})} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
              />
            </div>
          </div>
        </div>

        {/* Partner Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Partner's Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                value={formData.partner.name} 
                onChange={(e) => setFormData({...formData, partner: {...formData.partner, name: e.target.value}})} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Annual Income (₹)</label>
              <input 
                type="number" 
                value={formData.partner.income} 
                onChange={(e) => setFormData({...formData, partner: {...formData.partner, income: Number(e.target.value)}})} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleCalculate} 
          disabled={loading} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          {loading ? "Optimizing..." : "Optimize Joint Finances"}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-indigo-900">Your Joint Financial Blueprint</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Combined Income</p>
              <p className="text-xl font-bold text-black">₹{result.total_combined_income.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Suggested Split Ratio</p>
              <p className="text-xl font-bold text-black">{result.suggested_split_ratio}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-black">Shared Goal SIP Split</h3>
            {result.goal_splits.map((goal: any, idx: number) => (
              <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                <p className="font-medium text-gray-800">{goal.goal_name} (Total SIP: ₹{goal.total_monthly_sip.toLocaleString('en-IN')}/mo)</p>
                <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                  <p>{formData.user.name} pays: <span className="font-semibold text-indigo-600">₹{goal.user_contribution.toLocaleString('en-IN')}</span></p>
                  <p>{formData.partner.name} pays: <span className="font-semibold text-indigo-600">₹{goal.partner_contribution.toLocaleString('en-IN')}</span></p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-black">AI Advisor Insights</h3>
            <p className="text-gray-700 mb-4">{result.ai_compatibility_report}</p>
            
            <h4 className="font-medium text-gray-900 mt-4 mb-2">Tax Strategy</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {result.tax_optimization_tips.map((tip: string, idx: number) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}