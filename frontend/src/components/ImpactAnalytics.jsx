import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../api'
import {
  Sparkles,
  Utensils,
  Scale,
  Leaf,
  DollarSign,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Download,
  Share2
} from 'lucide-react'

export default function ImpactAnalytics() {
  const { user } = useSelector(state => state.auth)
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadImpact = async () => {
    try {
      setLoading(true)
      const res = await api.get('/analytics/impact')
      setImpact(res.data)
    } catch (err) {
      console.error("Failed to load impact analytics", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImpact()
  }, [])

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Compiling environmental & social impact reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 p-6 rounded-3xl border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-300 text-xs font-semibold mb-2">
            <Award className="w-4 h-4" />
            <span>ESG & Community Impact Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Environmental & Social Food Rescue Ledger</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time tracking of food waste diverted from methane-producing landfills, converted into nutritious meals for local shelters, community kitchens, and food banks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ESG Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Meals Saved */}
        <div className="bg-[#0E1527] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nutritious Meals Rescued</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {impact?.total_meals_served?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Based on 0.42 kg/meal benchmark
          </p>
        </div>

        {/* Food Waste Diverted */}
        <div className="bg-[#0E1527] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-sky-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Food Diverted from Landfills</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {impact?.total_food_rescued_kg?.toLocaleString() || 0} <span className="text-sm font-normal text-slate-400">kg</span>
          </p>
          <p className="text-[11px] text-sky-400 mt-1 font-medium">
            {impact?.donations_completed || 0} verified pickup handovers
          </p>
        </div>

        {/* CO2 Emissions Avoided */}
        <div className="bg-[#0E1527] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-teal-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CO₂e Emissions Prevented</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {impact?.total_co2_diverted_kg?.toLocaleString() || 0} <span className="text-sm font-normal text-slate-400">kg</span>
          </p>
          <p className="text-[11px] text-teal-400 mt-1 font-medium">
            2.5 kg CO₂ avoided per 1 kg food saved
          </p>
        </div>

        {/* Economic Value */}
        <div className="bg-[#0E1527] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated Value Rescued</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            ${impact?.total_cost_saved?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-amber-400 mt-1 font-medium">
            Tax-deductible surplus food recovery
          </p>
        </div>

      </div>

      {/* Impact Benchmark & Verification Methodology */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-3">Verified Impact Calculation Standards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-200">1 Meal Equivalent: 0.42 kg</p>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Based on the standard nutritional guidelines recognized by the USDA and the UN Food and Agriculture Organization (FAO).
            </p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-200">2.5 kg CO₂e / kg Food Waste</p>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Diverting food waste from anaerobic landfill environments prevents high-potency methane (CH₄) gas emissions.
            </p>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-200">Closed-Loop Handover Verification</p>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Records are only minted into the ledger once both donor and recipient exchange and verify the dynamic 6-digit OTP code.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Rescues Ledger Table */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Verified Handover Records</h3>
            <p className="text-xs text-slate-500">Immutable ledger of completed redistribution events</p>
          </div>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-medium">
            {impact?.recent_rescues?.length || 0} events recorded
          </span>
        </div>

        {impact?.recent_rescues?.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No completed handovers in this timeframe.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Food Rescued</th>
                  <th className="py-2.5 px-3">Nutritious Meals</th>
                  <th className="py-2.5 px-3">CO₂e Offset</th>
                  <th className="py-2.5 px-3">Estimated Value</th>
                  <th className="py-2.5 px-3">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {impact?.recent_rescues?.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(rec.recorded_at).toLocaleDateString()} {new Date(rec.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-mono text-indigo-400">#RES-{rec.id}</td>
                    <td className="py-3 px-3 font-bold text-white">{rec.food_rescued_kg} kg</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{rec.meals_served} meals</td>
                    <td className="py-3 px-3 text-teal-400 font-medium">{rec.co2_diverted_kg} kg CO₂</td>
                    <td className="py-3 px-3 text-amber-300 font-medium">${rec.cost_saved_estimated}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  )
}
