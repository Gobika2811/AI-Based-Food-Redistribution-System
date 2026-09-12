import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authStart, authSuccess, authFailed } from '../store'
import api from '../api'
import { Leaf, Mail, Lock, User, MapPin, Phone, Building, HeartHandshake, Store, ArrowRight } from 'lucide-react'

export default function Auth({ onAuthSuccess }) {
  const params = new URLSearchParams(window.location.search)
  const initialMode = params.get('mode')
  const [isLogin, setIsLogin] = useState(initialMode === 'register' ? false : true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'business',
    business_type: 'supermarket',
    address: '45 Market Street',
    phone: '+1-555-0199'
  })
  
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const demoPersonas = [
    { name: "GreenGrocer Supermarket", email: "supermarket@greenmart.com", role: "business", icon: Store, color: "emerald", desc: "Donor: Supermarket inventory & AI waste risk" },
    { name: "Hope Community Food Bank", email: "contact@hopefoodbank.org", role: "ngo", icon: HeartHandshake, color: "sky", desc: "Recipient: Live surplus feed & pickup coordinator" }
  ]

  const loginWithDemo = async (email, password = "password123") => {
    dispatch(authStart())
    try {
      const response = await api.post('/auth/login', { email, password })
      const token = response.data.access_token
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      dispatch(authSuccess({ token, user: userRes.data }))
      if (onAuthSuccess) onAuthSuccess()
    } catch (err) {
      dispatch(authFailed("Demo login failed. Make sure backend is running."))
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(authStart())

    if (!isLogin && formData.password !== formData.confirmPassword) {
      dispatch(authFailed("Passwords do not match."))
      return
    }

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        })
        const token = response.data.access_token
        const userRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        dispatch(authSuccess({ token, user: userRes.data }))
        if (onAuthSuccess) onAuthSuccess()
      } else {
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          business_type: formData.role === 'business' ? formData.business_type : null,
          address: formData.address,
          phone: formData.phone
        })
        
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        })
        const token = response.data.access_token
        const userRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        dispatch(authSuccess({ token, user: userRes.data }))
        if (onAuthSuccess) onAuthSuccess()
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Authentication request failed."
      dispatch(authFailed(errMsg))
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-sky-500/10 blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-[#0E1527] p-8 rounded-3xl border border-slate-800 shadow-2xl z-10 space-y-6">
        
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-emerald-500 p-3 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/20 mb-3">
            <Leaf className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            ResQ<span className="text-emerald-400">Food</span> Platform
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            AI-powered inventory waste prediction & surplus redistribution network.
          </p>
        </div>

        {/* 1-Click Demo Login Personas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Instant 1-Click Demo Access
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoPersonas.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => loginWithDemo(p.email)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition cursor-pointer group"
              >
                <div className="flex items-center space-x-2 text-white text-xs font-bold group-hover:text-emerald-300">
                  <p.icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p.name.split(' ')[0]}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{p.role}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Login / Register Toggle */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded-lg font-semibold transition cursor-pointer ${isLogin ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded-lg font-semibold transition cursor-pointer ${!isLogin ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Register Profile
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {!isLogin && (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  formData.role === 'ngo'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {formData.role === 'ngo' ? <HeartHandshake className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                  <span>{formData.role === 'ngo' ? 'NGO Partner Registration' : 'Business Donor Registration'}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Verified Onboarding</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Organization / Entity Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder={formData.role === 'ngo' ? "Hope Community Food Bank" : "Fresh Valley Supermarket"}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Role Type</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="business">Donor Business</option>
                    <option value="ngo">Recipient Organization (NGO)</option>
                  </select>
                </div>
                {formData.role === 'business' ? (
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Business Type</label>
                    <select
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="supermarket">Supermarket</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="hotel">Hotel / Catering</option>
                      <option value="bakery">Bakery</option>
                      <option value="grocery">Grocery Store</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">NGO Reg / Trust ID</label>
                    <input
                      type="text"
                      name="ngo_reg_id"
                      placeholder="e.g. NGO-REG-2026-8819"
                      value={formData.ngo_reg_id || ''}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Physical Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="123 Market St, City"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="+1-555-0199"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-400 font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-slate-400 font-medium mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center space-x-1.5"
          >
            {loading ? <span>Authenticating...</span> : (
              <>
                <span>{isLogin ? 'Sign In to Workspace' : 'Complete Registration'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

      </div>

    </div>
  )
}
