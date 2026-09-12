import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../api'
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Key,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

export default function LogisticsTracker() {
  const { user } = useSelector(state => state.auth)
  const isBusiness = user?.role === 'business'
  
  const [listings, setListings] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [verificationInput, setVerificationInput] = useState({})
  const [verifyingId, setVerifyingId] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const loadLogisticsData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      if (isBusiness) {
        const res = await api.get('/donations/my-listings')
        setListings(res.data)
      } else {
        const res = await api.get('/donations/my-claims')
        setClaims(res.data)
      }
    } catch (err) {
      console.error("Failed to load logistics records", err)
      setErrorMsg("Failed to load records. Check connection.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogisticsData()
  }, [user])

  const handleVerifyOtp = async (donationId) => {
    const code = verificationInput[donationId]
    if (!code || code.trim() === '') {
      alert("Please enter the 6-digit verification OTP provided by the driver.")
      return
    }

    try {
      setVerifyingId(donationId)
      const res = await api.post(`/donations/${donationId}/verify-pickup`, {
        verification_code: code.trim()
      })
      setVerificationResult({ donationId, data: res.data })
      loadLogisticsData()
    } catch (err) {
      console.error("Verification failed", err)
      alert(err.response?.data?.detail || "Invalid OTP verification code.")
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold mb-2">
            <Truck className="w-4 h-4" />
            <span>Pickup Logistics & Digital Verification</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isBusiness ? "Surplus Handover Verification Portal" : "My Scheduled NGO Pickups & OTP Codes"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isBusiness
              ? "Verify drivers with their unique 6-digit OTP code to log food rescue impact into ESG reports."
              : "Track active donation claims, view scheduled pickup windows, and present the handover OTP code."}
          </p>
        </div>
        <button
          onClick={loadLogisticsData}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Verification Success Highlight */}
      {verificationResult && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl flex items-start space-x-4 animate-fadeIn">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-300">Food Handover Successfully Verified!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Surplus food has officially been rescued. Inventory logs have been updated to "donated".
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-emerald-400">
              <span>🍲 {verificationResult.data.impact.meals_served} Meals Rescued</span>
              <span>⚖️ {verificationResult.data.impact.food_rescued_kg} kg Diverted</span>
              <span>🌿 {verificationResult.data.impact.co2_diverted_kg} kg CO₂e Prevented</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading logistics statuses...</p>
        </div>
      ) : isBusiness ? (
        // BUSINESS DONOR VIEW: View listings and verify claims
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Your Active & Claimed Surplus Listings</h2>
            <span className="text-xs text-slate-500">{listings.length} total listings</span>
          </div>

          {listings.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
              No surplus listings created yet. Go to Inventory to list near-expiry batches!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {listings.map((item) => {
                const isClaimed = item.status === 'claimed'
                const isCompleted = item.status === 'completed'
                const claim = item.claims && item.claims.length > 0 ? item.claims[0] : null

                return (
                  <div
                    key={item.id}
                    className={`bg-[#0E1527] border rounded-2xl p-5 transition ${
                      isClaimed
                        ? 'border-amber-500/50 shadow-lg shadow-amber-950/20'
                        : isCompleted
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Details */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isClaimed
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Listing #{item.id}</span>
                        </div>

                        <h3 className="text-base font-bold text-white">{item.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span>📦 Quantity: <strong className="text-slate-200">{item.quantity} {item.unit}</strong></span>
                          <span>📍 <span className="text-slate-300">{item.pickup_address}</span></span>
                          <span>⏳ Expiry: <strong className="text-slate-300">{item.expiry_date}</strong></span>
                        </div>

                        {claim && (
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 mt-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-white flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-sky-400" />
                                <span>Claimed by: {claim.ngo?.name || "Verified NGO Partner"}</span>
                              </p>
                              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                NGO Food Request Confirmed
                              </span>
                            </div>
                            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 space-y-0.5">
                              <p className="text-slate-300">
                                <span className="text-slate-400 font-medium">Delivery Partner / Driver:</span> <strong className="text-sky-300">{claim.driver_name || "Marcus Vance (City Logistics)"}</strong> ({claim.driver_phone || "+1-555-0100"})
                              </p>
                              <p className="text-slate-400">
                                Scheduled Pickup Window: <strong className="text-amber-300">{new Date(claim.pickup_time).toLocaleString()}</strong>
                              </p>
                            </div>
                            {claim.notes && <p className="text-slate-400 italic">Handling Notes: "{claim.notes}"</p>}
                          </div>
                        )}
                      </div>

                      {/* Right: Verification Action */}
                      <div className="lg:w-84 flex-shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                        {isCompleted ? (
                          <div className="text-center space-y-2 text-emerald-400 py-1">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-1">
                                Mark Delivered &amp; Verified
                              </span>
                              <p className="text-xs font-bold text-white">Pickup Completed &amp; Approved</p>
                              <p className="text-[10px] text-slate-400">Handover verified via OTP. ESG Impact logged.</p>
                            </div>
                          </div>
                        ) : isClaimed ? (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-amber-400">
                              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                              <span className="text-xs font-bold uppercase tracking-wider">Business Pickup Approval</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              Verify Delivery Partner OTP to approve pickup and release surplus donation:
                            </p>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={verificationInput[item.id] || ''}
                                onChange={(e) => setVerificationInput({ ...verificationInput, [item.id]: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                onClick={() => handleVerifyOtp(item.id)}
                                disabled={verifyingId === item.id}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex-shrink-0 flex items-center space-x-1 shadow-md shadow-emerald-500/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{verifyingId === item.id ? "..." : "Approve Pickup"}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 text-xs py-2">
                            <Clock className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                            <span>Awaiting NGO claim on the live redistribution feed.</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        // NGO RECIPIENT VIEW: View all claims made and active OTPs
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Your Claimed Pickups &amp; Dispatch Codes</h2>
            <span className="text-xs text-slate-500">{claims.length} total claims</span>
          </div>

          {claims.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
              No claims made yet. Browse the Live Surplus Feed to claim food!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {claims.map((claim) => {
                const isCompleted = claim.status === 'completed'
                return (
                  <div
                    key={claim.id}
                    className={`bg-[#0E1527] border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition ${
                      isCompleted ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-sky-500/40 shadow-lg shadow-sky-950/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}>
                          {isCompleted ? 'Marked Delivered' : 'Active Pickup Dispatch'}
                        </span>
                        <span className="text-xs text-slate-500">Claim #{claim.id}</span>
                      </div>

                      <h3 className="text-base font-bold text-white">
                        Surplus Donation Collection #{claim.donation_id}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span>🕒 Scheduled Pickup: <strong className="text-slate-200">{new Date(claim.pickup_time).toLocaleString()}</strong></span>
                        <span>👥 Beneficiaries: <strong className="text-emerald-400">~{claim.beneficiary_count} meals</strong></span>
                        <span>🚚 Delivery Partner: <strong className="text-sky-300">{claim.driver_name || "Marcus Vance (City Logistics)"}</strong></span>
                      </div>
                    </div>

                    {/* OTP Display Badge */}
                    <div className="flex-shrink-0 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[210px]">
                      {isCompleted ? (
                        <div className="text-emerald-400 space-y-1">
                          <CheckCircle2 className="w-6 h-6 mx-auto" />
                          <span className="text-xs font-bold block">Marked Delivered</span>
                          <span className="text-[10px] text-slate-500">Food safely received &amp; logged</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Delivery Partner Handover OTP</span>
                          <span className="text-2xl font-mono font-extrabold text-amber-400 tracking-wider">
                            {claim.verification_code || "RQ-8492"}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Show this to store staff to approve pickup</span>
                        </div>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
