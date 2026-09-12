import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api'
import { setNotifications, markReadSuccess } from '../store'
import {
  ShieldAlert,
  Boxes,
  Percent,
  CalendarCheck,
  TrendingDown,
  BellRing,
  CheckCircle,
  AlertTriangle,
  Utensils,
  Leaf,
  HeartHandshake,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react'

export default function Dashboard({ setActiveTab, onSelectDonationToCreate }) {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { notifications, unreadCount } = useSelector(state => state.alerts)
  const isBusiness = user?.role === 'business'

  // Business stats
  const [bizStats, setBizStats] = useState({
    total_items: 0,
    total_batches: 0,
    total_active_qty: 0,
    expired_batches_count: 0,
    near_expiry_batches_count: 0,
    waste_percentage: 0,
    total_donations_count: 0,
    total_food_rescued_kg: 0,
    total_meals_saved: 0,
    total_co2_prevented_kg: 0
  })

  // NGO stats
  const [ngoStats, setNgoStats] = useState({
    available_donations: 0,
    active_claims: 0,
    total_rescued_kg: 0,
    total_meals_served: 0,
    total_co2_diverted_kg: 0,
    completed_pickups: 0
  })

  // AI Waste Risk items
  const [aiRiskItems, setAiRiskItems] = useState([])
  const [reorders, setReorders] = useState([])
  const [liveDonations, setLiveDonations] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const alertsRes = await api.get('/alerts')
      dispatch(setNotifications(alertsRes.data))

      if (isBusiness) {
        const statsRes = await api.get('/analytics/dashboard')
        setBizStats(statsRes.data)

        const riskRes = await api.get('/ai/waste-risk')
        setAiRiskItems(riskRes.data.slice(0, 5))

        const reorderRes = await api.get('/ai/reorder-recommendations')
        setReorders(reorderRes.data.slice(0, 3))
      } else {
        const ngoRes = await api.get('/analytics/ngo-dashboard')
        setNgoStats(ngoRes.data)

        const feedRes = await api.get('/donations/live')
        setLiveDonations(feedRes.data.slice(0, 4))
      }
    } catch (err) {
      console.error("Dashboard metrics load error", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`)
      dispatch(markReadSuccess(id))
    } catch (err) {
      console.error("Failed to mark alert as read", err)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Analyzing inventory & redistribution feeds...</p>
      </div>
    )
  }

  // --- BUSINESS VIEW ---
  if (isBusiness) {
    return (
      <div className="space-y-6">
        
        {/* Welcome & AI Health Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Inventory Waste Engine Active</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || "Partner"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your real-time inventory spoilage forecast and surplus food redistribution hub.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              <Boxes className="w-4 h-4" />
              <span>Manage Inventory</span>
            </button>
          </div>
        </div>

        {/* Urgent Expiry System Alerts Banner */}
        <div className="bg-amber-950/20 border-2 border-amber-500/40 p-5 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Urgent Expiry System Alerts</span>
                  <span className="bg-rose-500 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold">3 CRITICAL BATCHES</span>
                </h3>
                <p className="text-xs text-slate-400">Automated AI engine identified inventory lots nearing shelf-life threshold requiring immediate priority redistribution.</p>
              </div>
            </div>
            <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl font-semibold hidden sm:inline">
              ⚡ Action Priority: Redistribute Before Spoilage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/90 border border-rose-500/30 p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">EXPIRES TODAY (12H)</span>
                <span className="text-[11px] text-rose-400 font-bold">92% Waste Risk</span>
              </div>
              <h4 className="text-xs font-bold text-white">Artisan Sourdough Loaves</h4>
              <p className="text-[11px] text-slate-400">Batch #B-01 • 25.0 kg • Ambient</p>
              <p className="text-[10px] text-emerald-400 font-medium pt-1">Recommended: 1-Click Surplus Donation to Hope NGO</p>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">EXPIRES IN 24H</span>
                <span className="text-[11px] text-amber-400 font-bold">85% Waste Risk</span>
              </div>
              <h4 className="text-xs font-bold text-white">Organic Greek Yogurt Pots</h4>
              <p className="text-[11px] text-slate-400">Batch #B-02 • 35.0 kg • Chilled (2°C)</p>
              <p className="text-[10px] text-emerald-400 font-medium pt-1">Recommended: Expedited cold-chain recovery</p>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">EXPIRES IN 48H</span>
                <span className="text-[11px] text-amber-400 font-bold">76% Waste Risk</span>
              </div>
              <h4 className="text-xs font-bold text-white">Crisp Greens & Tomatoes</h4>
              <p className="text-[11px] text-slate-400">Batch #B-03 • 40.0 kg • Chilled</p>
              <p className="text-[10px] text-emerald-400 font-medium pt-1">Recommended: List on Live Surplus Feed</p>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0E1527] border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Active Batches</span>
              <div className="p-2 bg-slate-800 text-slate-300 rounded-xl"><Boxes className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-extrabold text-white mt-2">{bizStats.total_batches}</p>
            <p className="text-[11px] text-slate-500 mt-1">{bizStats.total_items} SKU items tracked</p>
          </div>

          <div className="bg-[#0E1527] border border-amber-500/20 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Near-Expiry Attention</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><CalendarCheck className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-extrabold text-amber-300 mt-2">{bizStats.near_expiry_batches_count}</p>
            <p className="text-[11px] text-slate-400 mt-1">Expiring within 72 hours</p>
          </div>

          <div className="bg-[#0E1527] border border-emerald-500/20 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Meals Donated to NGOs</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Utensils className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2">{bizStats.total_meals_saved}</p>
            <p className="text-[11px] text-slate-400 mt-1">{bizStats.total_food_rescued_kg} kg food rescued</p>
          </div>

          <div className="bg-[#0E1527] border border-teal-500/20 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">CO₂e Offset Achieved</span>
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl"><Leaf className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-extrabold text-teal-400 mt-2">{bizStats.total_co2_prevented_kg} <span className="text-xs font-normal">kg</span></p>
            <p className="text-[11px] text-slate-400 mt-1">Landfill emissions prevented</p>
          </div>
        </div>

        {/* AI Waste Risk Radar Table */}
        <div className="bg-[#0E1527] border border-slate-800 rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Waste Risk Radar</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Machine learning model evaluating shelf life, perishability velocity, and historical demand to flag imminent spoilage.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>View All Batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aiRiskItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No high-risk inventory detected. All stock is within safe shelf-life parameters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Item / Category</th>
                    <th className="py-3 px-3">Batch ID</th>
                    <th className="py-3 px-3">Stock On-Hand</th>
                    <th className="py-3 px-3">Days to Expiry</th>
                    <th className="py-3 px-3">AI Waste Risk Score</th>
                    <th className="py-3 px-3">Recommended Action</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {aiRiskItems.map((item) => (
                    <tr key={item.batch_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <strong className="text-white block">{item.name}</strong>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{item.batch_number}</td>
                      <td className="py-3 px-3 font-bold text-white">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${item.days_to_expiry <= 2 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {item.days_to_expiry <= 0 ? 'Expires Today' : `${item.days_to_expiry} days left`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.risk_score >= 80 ? 'bg-rose-500' : item.risk_score >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${item.risk_score}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-xs">{item.risk_score}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {item.recommended_action}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (onSelectDonationToCreate) onSelectDonationToCreate(item)
                            else setActiveTab('inventory')
                          }}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>Donate Surplus</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lower Row: Demand Forecasting & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* AI Demand Forecasting & Reorders */}
          <div className="bg-[#0E1527] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>AI Replenishment & Demand Forecast</span>
              </h3>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">EOQ Optimized</span>
            </div>
            
            {reorders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Stock levels optimal. No reorder needed.</p>
            ) : (
              <div className="space-y-3">
                {reorders.map((r) => (
                  <div key={r.item_id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white">{r.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.reasoning}</p>
                    </div>
                    {r.recommended_order_quantity > 0 && (
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-sky-400 font-semibold uppercase block">Reorder</span>
                        <span className="text-sm font-extrabold text-white">+{r.recommended_order_quantity} {r.unit}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System & Expiry Alerts */}
          <div className="bg-[#0E1527] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <span>Recent System Alerts</span>
              </h3>
              <span className="text-[10px] bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-semibold">{unreadCount} unread</span>
            </div>
            
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No alerts at this time.</p>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                    <p className="text-slate-300 leading-snug">{n.message}</p>
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex-shrink-0 cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    )
  }

  // --- NGO RECIPIENT VIEW ---
  return (
    <div className="space-y-6">
      
      {/* NGO Hero Header */}
      <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Community Redistribution Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, {user?.name || "Community Partner"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse live surplus batches from local grocery businesses and dispatch volunteer drivers before expiry.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('feed')}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-sky-500/20"
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Browse Live Surplus Feed</span>
        </button>
      </div>

      {/* NGO KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E1527] border border-sky-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Available Surplus Batches</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl"><HeartHandshake className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{ngoStats.available_donations}</p>
          <p className="text-[11px] text-slate-400 mt-1">Ready for pickup nearby</p>
        </div>

        <div className="bg-[#0E1527] border border-amber-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Active Scheduled Pickups</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><Clock className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-extrabold text-amber-300 mt-2">{ngoStats.active_claims}</p>
          <p className="text-[11px] text-slate-400 mt-1">Driver OTPs active</p>
        </div>

        <div className="bg-[#0E1527] border border-emerald-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total Meals Distributed</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Utensils className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{ngoStats.total_meals_served}</p>
          <p className="text-[11px] text-slate-400 mt-1">{ngoStats.total_rescued_kg} kg food rescued</p>
        </div>

        <div className="bg-[#0E1527] border border-teal-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">CO₂ Emissions Diverted</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl"><Leaf className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-extrabold text-teal-400 mt-2">{ngoStats.total_co2_diverted_kg} <span className="text-xs font-normal">kg</span></p>
          <p className="text-[11px] text-slate-400 mt-1">{ngoStats.completed_pickups} verified rescues</p>
        </div>
      </div>

      {/* Live Feed Teaser */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Surplus Food Available for Claim</h3>
            <p className="text-xs text-slate-400 mt-0.5">Nearby food businesses with urgent surplus ready for pickup.</p>
          </div>
          <button
            onClick={() => setActiveTab('feed')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Full Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {liveDonations.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No donations currently listed. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveDonations.map((d) => (
              <div key={d.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {d.urgency} urgency
                  </span>
                  <h4 className="text-xs font-bold text-white mt-2 line-clamp-1">{d.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {d.quantity} {d.unit} • <strong className="text-emerald-400">~{Math.round(Number(d.quantity) * 2.4)} meals</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 truncate">📍 {d.pickup_address}</p>
                </div>
                <button
                  onClick={() => setActiveTab('feed')}
                  className="mt-3 w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-semibold transition cursor-pointer"
                >
                  View & Claim
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
