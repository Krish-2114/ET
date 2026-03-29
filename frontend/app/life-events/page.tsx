"use client";

import { useState } from "react";

export default function LifeEventAdvisor() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    event_type: "BABY", // Default selection
    current_income: 1500000,
    current_savings: 500000,
    event_amount: 50000, 
  });

  const eventTypes = [
    { id: "BONUS", label: "Got a Bonus", icon: "💰" },
    { id: "MARRIAGE", label: "Getting Married", icon: "💍" },
    { id: "BABY", label: "Having a Baby", icon: "👶" },
    { id: "JOB_SWITCH", label: "Job Switch", icon: "💼" },
    { id: "HOME_PURCHASE", label: "Buying a Home", icon: "🏠" },
  ];

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/life-events/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Failed to fetch advice:", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* FIXED: Changed heading to text-white and subtitle to text-gray-400 for visibility */}
      <div>
        <h1 className="text-3xl font-bold text-white">Life Event Advisor</h1>
        <p className="text-gray-400 mt-2">See how major life changes impact your financial FIRE journey.</p>
      </div>

      {/* Event Selector UI */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">1. Select a Life Event</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {eventTypes.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setFormData({ ...formData, event_type: evt.id })}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition ${
                formData.event_type === evt.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-100 hover:border-indigo-300"
              }`}
            >
              <span className="text-3xl mb-2">{evt.icon}</span>
              <span className="text-sm font-medium text-gray-700">{evt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Financial Inputs */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">2. Financial Context</h2>
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* FIXED: Added flex flex-col and mt-auto for perfect bottom alignment */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Income (₹)</label>
            <input 
              type="number" 
              value={formData.current_income} 
              onChange={(e) => setFormData({...formData, current_income: Number(e.target.value)})} 
              className="mt-auto block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
            />
          </div>
          
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Savings (₹)</label>
            <input 
              type="number" 
              value={formData.current_savings} 
              onChange={(e) => setFormData({...formData, current_savings: Number(e.target.value)})} 
              className="mt-auto block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
            />
          </div>
          
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">Event Amount (₹)</label>
            <p className="text-xs text-gray-400 mb-2">(e.g., Bonus amount or new monthly expense)</p>
            <input 
              type="number" 
              value={formData.event_amount} 
              onChange={(e) => setFormData({...formData, event_amount: Number(e.target.value)})} 
              className="mt-auto block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white text-gray-900" 
            />
          </div>

        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleCalculate} 
          disabled={loading} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          {loading ? "Analyzing..." : "Analyze Impact"}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-indigo-900">Event Action Plan: {eventTypes.find(e => e.id === formData.event_type)?.label}</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-3 text-black">✅ Immediate Actions</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {result.immediate_actions.map((action: string, idx: number) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
              <h3 className="text-lg font-semibold mb-3 text-red-700">⚠️ Hidden Risks</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {result.hidden_risks.map((risk: string, idx: number) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-2 text-black">Timeline Adjustment</h3>
            <p className="text-gray-700">{result.plan_adjustments}</p>
          </div>
        </div>
      )}
    </div>
  );
}