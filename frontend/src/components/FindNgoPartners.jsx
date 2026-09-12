import React, { useState } from 'react'
import { HeartHandshake, MapPin, Phone, ShieldCheck, ThermometerSnowflake, Star, Clock, Send, Search, Filter } from 'lucide-react'

export default function FindNgoPartners({ onDirectDispatch }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [radiusFilter, setRadiusFilter] = useState('all')
  const [storageFilter, setStorageFilter] = useState('all')

  const partners = [
    {
      id: 1,
      name: "Hope Community Food Bank",
      trust_id: "NGO-REG-2026-8819",
      rating: "4.9",
      reviews: 128,
      distance: "1.2 km away",
      dist_val: 1.2,
      address: "88 Charity Boulevard, Central Hub",
      cold_storage: true,
      cold_storage_desc: "Commercial Walk-in Chillers & Freezers",
      daily_capacity: "500+ Meals / Day",
      categories: ["Dairy & Chilled", "Fresh Produce", "Bakery & Grains", "Prepared Meals"],
      hours: "08:00 AM - 08:30 PM (Daily)",
      contact: "Elena Rostova",
      phone: "+1-555-0188"
    },
    {
      id: 2,
      name: "City Heart Community Kitchen",
      trust_id: "NGO-REG-2026-3391",
      rating: "4.8",
      reviews: 94,
      distance: "2.4 km away",
      dist_val: 2.4,
      address: "120 Hope Avenue, Downtown",
      cold_storage: true,
      cold_storage_desc: "Commercial Walk-in Chiller",
      daily_capacity: "350 Meals / Day",
      categories: ["Prepared Meals", "Fresh Vegetables", "Breads & Pastries"],
      hours: "07:00 AM - 10:00 PM",
      contact: "Chef Marcus",
      phone: "+1-555-0214"
    },
    {
      id: 3,
      name: "Feeding Hands Foundation",
      trust_id: "NGO-REG-2026-5120",
      rating: "4.7",
      reviews: 62,
      distance: "3.8 km away",
      dist_val: 3.8,
      address: "45 Unity Way, Westside",
      cold_storage: true,
      cold_storage_desc: "Temperature-Controlled Van Fleet",
      daily_capacity: "600+ Meals / Day",
      categories: ["Surplus Groceries", "Packaged Dry Goods", "Fruits & Greens"],
      hours: "09:00 AM - 06:00 PM",
      contact: "Sarah Jenkins",
      phone: "+1-555-0352"
    },
    {
      id: 4,
      name: "St. Jude Care Outreach",
      trust_id: "NGO-REG-2026-7744",
      rating: "4.9",
      reviews: 45,
      distance: "5.1 km away",
      dist_val: 5.1,
      address: "14 River Road, North District",
      cold_storage: false,
      cold_storage_desc: "Ambient Dry Pantry Storage",
      daily_capacity: "200 Meals / Day",
      categories: ["Bakery Items", "Fresh Produce", "Canned Goods"],
      hours: "10:00 AM - 04:00 PM",
      contact: "Brother Thomas",
      phone: "+1-555-0488"
    }
  ]

  const filtered = partners.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categories.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchRadius = radiusFilter === 'all' ? true :
      radiusFilter === '2' ? p.dist_val <= 2.0 :
      radiusFilter === '5' ? p.dist_val <= 5.0 : true

    const matchStorage = storageFilter === 'all' ? true :
      storageFilter === 'cold' ? p.cold_storage : !p.cold_storage

    return matchSearch && matchRadius && matchStorage
  })

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Verified Recipient NGO Directory & Matching</span>
          </div>
          <h2 className="text-xl font-bold text-white">Find Verified NGO & Community Kitchen Partners</h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect directly with audited local non-profits, food banks, and shelters for immediate surplus food dispatch and rescue.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Trust ID: <strong>100% Audited</strong></span>
          </span>
          <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>Proximity: <strong>Within 6 km</strong></span>
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#0E1527] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            placeholder="Search NGOs by name, address, or food category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Radius:</span>
            <select
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All (Within 10 km)</option>
              <option value="2" className="bg-slate-900">Within 2 km</option>
              <option value="5" className="bg-slate-900">Within 5 km</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Storage:</span>
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Facilities</option>
              <option value="cold" className="bg-slate-900">Cold Storage / Chilled</option>
              <option value="ambient" className="bg-slate-900">Ambient Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* NGO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((ngo) => (
          <div key={ngo.id} className="bg-[#0E1527] border border-slate-800 hover:border-slate-700 transition rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">{ngo.name}</h3>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{ngo.trust_id}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{ngo.distance}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{ngo.rating}</span>
                      <span className="text-slate-500 font-normal">({ngo.reviews} rescues)</span>
                    </span>
                  </div>
                </div>

                <span className="text-xs bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1 rounded-xl font-semibold flex-shrink-0">
                  {ngo.daily_capacity}
                </span>
              </div>

              {/* Physical Location & Hours */}
              <div className="mt-3 bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300">{ngo.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>Open: <strong className="text-slate-300">{ngo.hours}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>Cold Chain: <strong className="text-sky-300">{ngo.cold_storage_desc}</strong></span>
                </div>
              </div>

              {/* Accepted Categories */}
              <div className="mt-3">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Accepted Food Streams</p>
                <div className="flex flex-wrap gap-1.5">
                  {ngo.categories.map((c, i) => (
                    <span key={i} className="text-[11px] bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{ngo.contact}: <strong className="text-slate-300">{ngo.phone}</strong></span>
              </div>

              <button
                onClick={() => onDirectDispatch && onDirectDispatch(ngo)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Direct Dispatch Surplus</span>
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
