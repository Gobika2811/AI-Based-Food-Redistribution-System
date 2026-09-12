import React, { useState, useEffect } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import store, { setUser, logout, authSuccess } from './store'
import api from './api'
import Auth from './components/Auth'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import InventoryCRUD from './components/InventoryCRUD'
import DonationFeed from './components/DonationFeed'
import LogisticsTracker from './components/LogisticsTracker'
import ImpactAnalytics from './components/ImpactAnalytics'
import FindNgoPartners from './components/FindNgoPartners'
import DbTablesViewer from './components/DbTablesViewer'

function MainApp() {
  const dispatch = useDispatch()
  const { isAuthenticated, token, user } = useSelector(state => state.auth)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [appInitializing, setAppInitializing] = useState(true)

  const initializeAuthUser = async () => {
    const params = new URLSearchParams(window.location.search)
    const demo = params.get('demo')
    const tab = params.get('tab')
    const mode = params.get('mode')
    if (tab) setActiveTab(tab)

    if (mode === 'login' || mode === 'register' || params.get('logout') === 'true') {
      dispatch(logout())
      setAppInitializing(false)
      return
    }

    if (demo === 'business' || demo === 'ngo') {
      try {
        const email = demo === 'business' ? 'supermarket@greenmart.com' : 'contact@hopefoodbank.org'
        const res = await api.post('/auth/login', { email, password: 'password123' })
        const token = res.data.access_token
        const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        dispatch(authSuccess({ token, user: me.data }))
        setAppInitializing(false)
        return
      } catch (e) {
        console.error("Auto demo login failed", e)
      }
    }

    if (token) {
      try {
        const response = await api.get('/auth/me')
        dispatch(setUser(response.data))
      } catch (err) {
        console.error("Token verification failed.", err)
        dispatch(logout())
      }
    }
    setAppInitializing(false)
  }

  useEffect(() => {
    initializeAuthUser()
  }, [token])

  if (appInitializing) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center text-slate-400">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-light tracking-wide text-xs text-slate-300">Initializing ResQFood platform...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={initializeAuthUser} />
  }

  const isBusiness = user?.role === 'business'
  const isNGO = user?.role === 'ngo'

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      
      {/* Dynamic Top Navbar with Dual-Sided Switcher */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Viewport */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard setActiveTab={setActiveTab} />
        )}

        {activeTab === 'inventory' && isBusiness && (
          <InventoryCRUD setActiveTab={setActiveTab} />
        )}

        {activeTab === 'find-ngo' && (
          <FindNgoPartners onDirectDispatch={() => setActiveTab('inventory')} />
        )}

        {activeTab === 'db-tables' && (
          <DbTablesViewer />
        )}

        {activeTab === 'feed' && (
          <DonationFeed onClaimSuccess={() => setActiveTab('logistics')} />
        )}

        {activeTab === 'logistics' && (
          <LogisticsTracker />
        )}

        {activeTab === 'impact' && (
          <ImpactAnalytics />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-[#070A11]/80 py-6 text-center text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 ResQFood: AI-Based Food Redistribution System.</p>
          <p className="text-slate-600">Dual-Sided Waste Reduction & Surplus Inventory Platform</p>
        </div>
      </footer>

    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  )
}
