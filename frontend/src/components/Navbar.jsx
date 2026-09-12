import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Leaf, User, LogOut, Bell, HeartHandshake, Store, Database, MapPin } from 'lucide-react'
import { logout, authSuccess, authStart } from '../store'
import api from '../api'

export default function Navbar({ activeTab, setActiveTab }) {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { notifications, unreadCount } = useSelector(state => state.alerts)
  const [showNotifications, setShowNotifications] = useState(false)

  const isBusiness = user?.role === 'business'
  const isNGO = user?.role === 'ngo'

  const demoPersonas = [
    { name: "GreenGrocer Supermarket", email: "supermarket@greenmart.com", role: "business", icon: Store, color: "emerald", label: "Supermarket Donor" },
    { name: "Bistro Good Food", email: "chef@bistrogood.com", role: "business", icon: Store, color: "amber", label: "Restaurant Donor" },
    { name: "Hope Community Food Bank", email: "contact@hopefoodbank.org", role: "ngo", icon: HeartHandshake, color: "sky", label: "Food Bank Recipient" },
    { name: "City Heart Community Kitchen", email: "kitchen@cityshelter.org", role: "ngo", icon: HeartHandshake, color: "rose", label: "Kitchen Recipient" }
  ]

  const switchPersona = async (persona) => {
    try {
      dispatch(authStart())
      const res = await api.post('/auth/login', {
        email: persona.email,
        password: "password123"
      })
      const token = res.data.access_token
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      dispatch(authSuccess({ token, user: meRes.data }))
      setActiveTab('dashboard')
    } catch (err) {
      console.error("Failed to switch persona", err)
    }
  }

  return (
    <header className="border-b border-slate-800 bg-[#0E1527]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Quick Demo Switcher Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-1.5 text-xs flex flex-wrap items-center justify-between text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300">Dual-Sided Simulation Mode:</span>
          <span className="text-slate-400">Switch personas instantly to test both Donor & Recipient workflows:</span>
        </div>
        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
          {demoPersonas.map((p) => {
            const isCurrent = user?.email === p.email
            return (
              <button
                key={p.email}
                onClick={() => switchPersona(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  isCurrent
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-transparent'
                }`}
              >
                <p.icon className="w-3 h-3" />
                <span>{p.name.split(' ')[0]} ({p.role.toUpperCase()})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">ResQ<span className="text-emerald-400">Food</span></span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isBusiness ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {isBusiness ? 'Donor Portal' : 'Recipient Portal'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-medium">AI Waste Reduction & Food Redistribution Network</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>

          {isBusiness && (
            <>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'inventory' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Inventory & AI Risk
              </button>
              <button
                onClick={() => setActiveTab('find-ngo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'find-ngo' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Find NGO Partners</span>
              </button>
              <button
                onClick={() => setActiveTab('logistics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'logistics' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active Handover Verification
              </button>
            </>
          )}

          {isNGO && (
            <>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'feed' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Surplus Feed
              </button>
              <button
                onClick={() => setActiveTab('logistics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'logistics' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pickup Coordinator & OTP
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('db-tables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
              activeTab === 'db-tables' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DB Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'impact' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ESG Impact Analytics
          </button>
        </nav>

        {/* User Info & Controls */}
        <div className="flex items-center space-x-4">
          
          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0E1527]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="font-bold text-white">System Alerts</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{notifications.length} alerts</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 py-3 text-center">No alerts at this time.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-xl border ${n.is_read ? 'bg-slate-800/40 border-slate-800/60 text-slate-400' : 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'}`}>
                        <p className="leading-snug">{n.message}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User badge */}
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className={`p-1.5 rounded-lg ${isBusiness ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role} • {user?.business_type || "NGO"}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => dispatch(logout())}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>

        </div>
      </div>
    </header>
  )
}
