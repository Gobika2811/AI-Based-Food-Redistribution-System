import React, { useState, useEffect } from 'react'
import api from '../api'
import {
  HeartHandshake,
  Search,
  Filter,
  Clock,
  MapPin,
  ThermometerSnowflake,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Car,
  Phone,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react'

export default function DonationFeed({ onClaimSuccess }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedUrgency, setSelectedUrgency] = useState('')
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccessData, setClaimSuccessData] = useState(null)

  // Claim modal form data
  const [claimForm, setClaimForm] = useState({
    pickup_time: '',
    beneficiary_count: 50,
    driver_name: '',
    driver_phone: '',
    notes: ''
  })

  const loadFeed = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedStorage) params.storage_condition = selectedStorage
      if (selectedUrgency) params.urgency = selectedUrgency
      if (search) params.search = search

      const res = await api.get('/donations/live', { params })
      setDonations(res.data)
    } catch (err) {
      console.error("Failed to load live donation feed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [selectedStorage, selectedUrgency])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadFeed()
  }

  const openClaimModal = (donation) => {
    setSelectedDonation(donation)
    // Default pickup time: 2 hours from now
    const defaultTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16)
    setClaimForm({
      pickup_time: defaultTime,
      beneficiary_count: Math.round(Number(donation.quantity) * 2.4),
      driver_name: '',
      driver_phone: '',
      notes: ''
    })
    setClaimSuccessData(null)
  }

  const handleClaimSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDonation) return

    try {
      setClaiming(true)
      const payload = {
        pickup_time: new Date(claimForm.pickup_time).toISOString(),
        beneficiary_count: Number(claimForm.beneficiary_count),
        driver_name: claimForm.driver_name || "Assigned NGO Transport Volunteer",
        driver_phone: claimForm.driver_phone || "+1-555-0100",
        notes: claimForm.notes || "Standard food distribution pickup"
      }

      const res = await api.get(`/donations/${selectedDonation.id}`)
      const claimRes = await api.post(`/donations/${selectedDonation.id}/claim`, payload)
      
      setClaimSuccessData(claimRes.data)
      loadFeed()
      if (onClaimSuccess) onClaimSuccess()
    } catch (err) {
      console.error("Claim failed", err)
      alert(err.response?.data?.detail || "Could not claim this donation.")
    } finally {
      setClaiming(false)
    }
  }

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical (&lt;24h)</span>
      case 'high':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> High Urgency</span>
      case 'medium':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Moderate</span>
      default:
        return <span className="bg-slate-700/40 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Standard</span>
    }
  }

  const getStorageBadge = (storage) => {
    switch (storage) {
      case 'frozen':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"><ThermometerSnowflake className="w-3 h-3" /> Frozen (-18°C)</span>
      case 'chilled':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"><ThermometerSnowflake className="w-3 h-3" /> Chilled (2-4°C)</span>
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium">Ambient Dry</span>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Feed Hero Header */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 p-6 rounded-3xl border border-sky-900/40 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-full text-sky-300 text-xs font-semibold mb-3">
            <HeartHandshake className="w-4 h-4" />
            <span>Recipient Organization Redistribution Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Food Donation Opportunities</h1>
          <p className="text-sm text-slate-400 mt-1">
            Claim available surplus batches from local supermarkets, restaurants, and bakeries. Scheduled pickups ensure food reaches vulnerable communities before spoilage.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder="Search items (e.g., Bread, Milk, Greens)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">Storage:</span>
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">All Storage Types</option>
              <option value="ambient">Ambient / Pantry</option>
              <option value="chilled">Chilled / Cold Chain</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Urgency:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">All Urgencies</option>
              <option value="critical">Critical (&lt;24h)</option>
              <option value="high">High Urgency</option>
              <option value="medium">Moderate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Donation Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Scanning for active surplus donations...</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Available Surplus at this Moment</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All listed surplus batches have been claimed or no matching batches fit the current filters. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((item) => {
            const estimatedMeals = Math.round(Number(item.quantity) * 2.38)
            return (
              <div
                key={item.id}
                className="bg-[#0E1527] border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-sky-950/20 group"
              >
                <div>
                  {/* Top tags row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getUrgencyBadge(item.urgency)}
                    {getStorageBadge(item.storage_condition)}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description || "Fresh surplus batch donated directly from store inventory."}
                  </p>

                  {/* Quantity & Estimated Meals Pill */}
                  <div className="mt-4 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Available Quantity</p>
                      <p className="text-lg font-extrabold text-white">
                        {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Potential Meals</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        ~{estimatedMeals} <span className="text-xs text-emerald-500/80 font-normal">meals</span>
                      </p>
                    </div>
                  </div>

                  {/* Logistics Specs */}
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 truncate">{item.pickup_address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>Expiry: <strong className="text-slate-200">{item.expiry_date}</strong></span>
                    </div>
                    {item.dietary_tags && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {item.dietary_tags.split(',').map((tag, idx) => (
                          <span key={idx} className="bg-slate-800/80 text-slate-300 text-[10px] px-2 py-0.5 rounded-md">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim CTA Button */}
                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => openClaimModal(item)}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-sky-900/30"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Claim for Redistribution</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Claim Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {claimSuccessData ? (
              // Success State with Verification OTP
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Donation Successfully Reserved!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your transport team has been locked in for pickup. Present this verification OTP code to the business upon arrival.
                </p>

                {/* OTP Display Card */}
                <div className="bg-slate-950 border border-emerald-500/40 p-4 rounded-2xl max-w-xs mx-auto">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Pickup Verification OTP</span>
                  <span className="text-3xl font-mono font-extrabold text-emerald-400 tracking-wider">
                    {claimSuccessData.verification_code}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Provide this code to {selectedDonation.pickup_address} staff to confirm handover.</p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSelectedDonation(null)
                      setClaimSuccessData(null)
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Done & Return to Feed
                  </button>
                </div>
              </div>
            ) : (
              // Claim Input Form
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 bg-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 border border-sky-500/30">
                      <HeartHandshake className="w-3 h-3" />
                      <span>NGO Food Request & Pickup Coordination</span>
                    </div>
                    <h3 className="text-base font-bold text-white">Request Food Donation</h3>
                    <p className="text-xs text-slate-400">{selectedDonation.title} ({selectedDonation.quantity} {selectedDonation.unit})</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDonation(null)}
                    className="text-slate-500 hover:text-white text-lg font-bold px-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Scheduled Pickup Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={claimForm.pickup_time}
                      onChange={(e) => setClaimForm({ ...claimForm, pickup_time: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Estimated Beneficiaries / Meals to Distribute</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={claimForm.beneficiary_count}
                      onChange={(e) => setClaimForm({ ...claimForm, beneficiary_count: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Delivery Partner / Driver Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Marcus Vance (City Logistics)"
                        value={claimForm.driver_name}
                        onChange={(e) => setClaimForm({ ...claimForm, driver_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Delivery Partner Phone</label>
                      <input
                        type="tel"
                        placeholder="+1-555-0188"
                        value={claimForm.driver_phone}
                        onChange={(e) => setClaimForm({ ...claimForm, driver_phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Logistics / Handling Notes (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Temperature-controlled van arriving at rear loading dock"
                      value={claimForm.notes}
                      onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 flex items-start space-x-2 text-[11px] text-sky-300">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>By submitting this food request, your designated delivery partner agrees to collect within the selected pickup window.</span>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDonation(null)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-1/2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-sky-900/30"
                  >
                    {claiming ? <span>Submitting Request...</span> : <span>Submit NGO Food Request</span>}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
