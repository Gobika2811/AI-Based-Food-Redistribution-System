import React, { useState, useEffect } from 'react'
import { Database, Table, Key, ShieldCheck, Layers, CheckCircle2 } from 'lucide-react'

export default function DbTablesViewer() {
  const [activeTable, setActiveTable] = useState('inventory_items')

  const tablesMeta = {
    inventory_items: {
      name: 'inventory_items',
      title: 'Inventory Products Table',
      description: 'Master catalog of food products, SKUs, barcode mappings, and storage conditions.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key, Auto Increment' },
        { col: 'business_id', type: 'INTEGER', pk: false, fk: 'users.id', desc: 'Donor business owner' },
        { col: 'category_id', type: 'INTEGER', pk: false, fk: 'categories.id', desc: 'Category classification' },
        { col: 'name', type: 'VARCHAR(255)', pk: false, fk: null, desc: 'Product title / name' },
        { col: 'sku', type: 'VARCHAR(100)', pk: false, fk: null, desc: 'Stock keeping unit' },
        { col: 'barcode', type: 'VARCHAR(100)', pk: false, fk: null, desc: 'EAN/UPC barcode number' },
        { col: 'unit', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'Measurement unit (kg, L, pack)' },
        { col: 'storage_recommendation', type: 'TEXT', pk: false, fk: null, desc: 'AI temperature / shelf recommendation' },
        { col: 'created_at', type: 'DATETIME', pk: false, fk: null, desc: 'Creation timestamp' }
      ],
      sampleRows: [
        { id: 1, business_id: 1, category_id: 2, name: 'Artisan Sourdough Loaves', sku: 'BAK-SDR-01', barcode: '890103094821', unit: 'kg', storage_recommendation: 'Store at room temperature in sealed breadbox', created_at: '2026-09-12 06:30:00' },
        { id: 2, business_id: 1, category_id: 1, name: 'Organic Greek Yogurt', sku: 'DRY-YGT-02', barcode: '890103094822', unit: 'kg', storage_recommendation: 'Keep refrigerated at 1°C to 4°C tightly closed', created_at: '2026-09-12 06:30:00' },
        { id: 3, business_id: 1, category_id: 3, name: 'Crisp Greens & Vine Tomatoes', sku: 'PRD-GRN-03', barcode: '890103094823', unit: 'kg', storage_recommendation: 'Store leafy greens in crisper drawer with paper towel', created_at: '2026-09-12 06:30:00' },
        { id: 4, business_id: 1, category_id: 1, name: 'Organic Whole Milk', sku: 'DRY-MK-001', barcode: '890103094824', unit: 'L', storage_recommendation: 'Keep refrigerated at 2°C', created_at: '2026-09-12 06:30:00' }
      ]
    },
    inventory_batches: {
      name: 'inventory_batches',
      title: 'Inventory Batches Table',
      description: 'Physical lots/batches with precise quantities, manufacturing tracking, and expiry timestamps.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key' },
        { col: 'item_id', type: 'INTEGER', pk: false, fk: 'inventory_items.id', desc: 'Parent product reference' },
        { col: 'batch_number', type: 'VARCHAR(100)', pk: false, fk: null, desc: 'Batch identifier (e.g. B-01)' },
        { col: 'quantity', type: 'DECIMAL(10,2)', pk: false, fk: null, desc: 'Active remaining stock' },
        { col: 'expiry_date', type: 'DATE', pk: false, fk: null, desc: 'Calculated expiry date' },
        { col: 'status', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'active / near_expiry / donated / expired' },
        { col: 'created_at', type: 'DATETIME', pk: false, fk: null, desc: 'Batch lot creation timestamp' }
      ],
      sampleRows: [
        { id: 1, item_id: 1, batch_number: 'B-01', quantity: '25.00', expiry_date: '2026-09-12', status: 'near_expiry', created_at: '2026-09-12 06:30:00' },
        { id: 2, item_id: 2, batch_number: 'B-02', quantity: '35.00', expiry_date: '2026-09-13', status: 'near_expiry', created_at: '2026-09-12 06:30:00' },
        { id: 3, item_id: 3, batch_number: 'B-03', quantity: '40.00', expiry_date: '2026-09-15', status: 'active', created_at: '2026-09-12 06:30:00' },
        { id: 4, item_id: 4, batch_number: 'B-04', quantity: '30.00', expiry_date: '2026-09-19', status: 'active', created_at: '2026-09-12 06:30:00' }
      ]
    },
    donation_listings: {
      name: 'donation_listings',
      title: 'Donation Listings Table',
      description: 'Surplus food listings published by businesses for recipient NGO discovery.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key' },
        { col: 'business_id', type: 'INTEGER', pk: false, fk: 'users.id', desc: 'Donor business ID' },
        { col: 'inventory_batch_id', type: 'INTEGER', pk: false, fk: 'inventory_batches.id', desc: 'Source batch ID' },
        { col: 'title', type: 'VARCHAR(255)', pk: false, fk: null, desc: 'Donation post title' },
        { col: 'quantity', type: 'DECIMAL(10,2)', pk: false, fk: null, desc: 'Kilograms of food offered' },
        { col: 'urgency', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'critical / high / medium' },
        { col: 'status', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'available / claimed / completed' }
      ],
      sampleRows: [
        { id: 1, business_id: 1, inventory_batch_id: 1, title: 'Fresh Bakery Assortment (Sourdough & Bagels)', quantity: '25.00', urgency: 'critical', status: 'completed' },
        { id: 2, business_id: 1, inventory_batch_id: 3, title: 'Assorted Organic Crisp Greens & Tomatoes', quantity: '40.00', urgency: 'high', status: 'available' },
        { id: 3, business_id: 1, inventory_batch_id: 2, title: 'Organic Greek Yogurt & Milk Crates', quantity: '35.00', urgency: 'high', status: 'completed' }
      ]
    },
    donation_claims: {
      name: 'donation_claims',
      title: 'Donation Claims Table',
      description: 'Reservations made by recipient NGOs with cryptographic OTP verification codes.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key' },
        { col: 'donation_id', type: 'INTEGER', pk: false, fk: 'donation_listings.id', desc: 'Listing claimed' },
        { col: 'ngo_id', type: 'INTEGER', pk: false, fk: 'users.id', desc: 'Claiming recipient NGO' },
        { col: 'otp_code', type: 'VARCHAR(20)', pk: false, fk: null, desc: '6-digit digital handover OTP' },
        { col: 'driver_name', type: 'VARCHAR(100)', pk: false, fk: null, desc: 'Assigned logistics courier' },
        { col: 'status', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'pending_pickup / verified_delivered' }
      ],
      sampleRows: [
        { id: 1, donation_id: 1, ngo_id: 3, otp_code: 'RQ-5328', driver_name: 'Marcus Vance (City Food Logistics)', status: 'verified_delivered' },
        { id: 2, donation_id: 3, ngo_id: 3, otp_code: 'RQ-8192', driver_name: 'Dave Miller (Hope Volunteer)', status: 'verified_delivered' }
      ]
    },
    impact_metrics: {
      name: 'impact_metrics',
      title: 'ESG Impact Metrics Ledger',
      description: 'Immutable ledger recording verified food rescues, meals generated, and greenhouse gas offsets.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key' },
        { col: 'donation_id', type: 'INTEGER', pk: false, fk: 'donation_listings.id', desc: 'Source donation record' },
        { col: 'food_rescued_kg', type: 'DECIMAL(10,2)', pk: false, fk: null, desc: 'Weight of food diverted' },
        { col: 'meals_rescued', type: 'INTEGER', pk: false, fk: null, desc: 'Calculated nutritional meals (0.42kg/meal)' },
        { col: 'co2_prevented_kg', type: 'DECIMAL(10,2)', pk: false, fk: null, desc: 'Carbon offset (2.5kg CO2e/kg)' },
        { col: 'created_at', type: 'DATETIME', pk: false, fk: null, desc: 'Verification timestamp' }
      ],
      sampleRows: [
        { id: 1, donation_id: 1, food_rescued_kg: '25.00', meals_rescued: 59, co2_prevented_kg: '62.50', created_at: '2026-09-12 07:22:00' },
        { id: 2, donation_id: 3, food_rescued_kg: '35.00', meals_rescued: 83, co2_prevented_kg: '87.50', created_at: '2026-09-10 09:15:00' }
      ]
    },
    users: {
      name: 'users',
      title: 'Users & Roles Table',
      description: 'Authenticated accounts for Donor businesses and Recipient NGO organizations.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key' },
        { col: 'email', type: 'VARCHAR(255)', pk: false, fk: null, desc: 'Unique login email' },
        { col: 'role', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'business / ngo' },
        { col: 'name', type: 'VARCHAR(255)', pk: false, fk: null, desc: 'Entity / Company name' },
        { col: 'trust_id', type: 'VARCHAR(100)', pk: false, fk: null, desc: 'Govt Reg or NGO Trust ID' },
        { col: 'address', type: 'TEXT', pk: false, fk: null, desc: 'Physical pickup/delivery location' },
        { col: 'phone', type: 'VARCHAR(50)', pk: false, fk: null, desc: 'Contact telephone' }
      ],
      sampleRows: [
        { id: 1, email: 'supermarket@greenmart.com', role: 'business', name: 'GreenGrocer Supermarket', trust_id: 'BIZ-REG-9912', address: '45 Market Street, Loading Bay B', phone: '+1-555-0199' },
        { id: 2, email: 'chef@bistrogood.com', role: 'business', name: 'Bistro Good Food', trust_id: 'BIZ-REG-4421', address: '12 Gourmet Avenue', phone: '+1-555-0200' },
        { id: 3, email: 'contact@hopefoodbank.org', role: 'ngo', name: 'Hope Community Food Bank', trust_id: 'NGO-REG-2026-8819', address: '88 Charity Boulevard', phone: '+1-555-0188' }
      ]
    },
    categories: {
      name: 'categories',
      title: 'Categories Taxonomy Table',
      description: 'Food categorization hierarchy with default decay parameters and storage instructions.',
      schema: [
        { col: 'id', type: 'INTEGER', pk: true, fk: null, desc: 'Primary Key' },
        { col: 'name', type: 'VARCHAR(100)', pk: false, fk: null, desc: 'Category designation' },
        { col: 'description', type: 'TEXT', pk: false, fk: null, desc: 'Taxonomy details and storage advice' }
      ],
      sampleRows: [
        { id: 1, name: 'Dairy & Chilled', description: 'Refrigerated milk, cheese, and yogurt products (1°C-4°C)' },
        { id: 2, name: 'Bakery & Grains', description: 'Artisanal breads, bagels, and fresh flour items' },
        { id: 3, name: 'Fresh Produce', description: 'Leafy greens, vegetables, and ripe seasonal fruits' },
        { id: 4, name: 'Prepared Meals', description: 'Cooked dishes and hot counter portions requiring rapid recovery' }
      ]
    }
  }

  const currentMeta = tablesMeta[activeTable]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>SQLite 3 Engine (resqfood.db) — Relational Schema Explorer</span>
          </div>
          <h2 className="text-xl font-bold text-white">Database Tables & Relational Schema Architecture</h2>
          <p className="text-xs text-slate-400 mt-1">
            Normalized database entities supporting inventory tracking, AI waste risk indices, cryptographic OTP claims, and immutable ESG impact ledgers.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Foreign Keys: <strong>Enforced (ON)</strong></span>
          </span>
          <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Tables: <strong>7 Entities</strong></span>
          </span>
        </div>
      </div>

      {/* Table Navigation Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {Object.keys(tablesMeta).map(key => {
          const t = tablesMeta[key]
          const isActive = activeTable === key
          return (
            <button
              key={key}
              onClick={() => setActiveTable(key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t.name}</span>
            </button>
          )
        })}
      </div>

      {/* Active Table Header Details */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white font-mono">{currentMeta.name}</h3>
            <span className="text-[11px] bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold">
              {currentMeta.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{currentMeta.description}</p>
        </div>
        <div className="text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Columns: <strong className="text-white">{currentMeta.schema.length}</strong> | Rows: <strong className="text-emerald-400">{currentMeta.sampleRows.length}</strong>
        </div>
      </div>

      {/* Schema Structure Table */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Entity Schema & Column Attributes</span>
          </span>
          <span className="text-[10px] text-slate-400">DDL Structure</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/70 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Column Name</th>
                <th className="py-2.5 px-4">Data Type</th>
                <th className="py-2.5 px-4">Key / Index</th>
                <th className="py-2.5 px-4">Relation / Foreign Key</th>
                <th className="py-2.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {currentMeta.schema.map(col => (
                <tr key={col.col} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-bold text-white flex items-center gap-1.5">
                    {col.pk && <Key className="w-3 h-3 text-amber-400" />}
                    <span>{col.col}</span>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400">{col.type}</td>
                  <td className="py-2.5 px-4">
                    {col.pk ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        PRIMARY KEY
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    {col.fk ? (
                      <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        {'FK -> ' + col.fk}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-sans">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-xs">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Data Records Table */}
      <div className="bg-[#0E1527] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Database Records (SQLite Data Preview)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">SELECT * FROM {currentMeta.name}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/70 border-b border-slate-800 tracking-wider">
              <tr>
                {Object.keys(currentMeta.sampleRows[0] || {}).map(k => (
                  <th key={k} className="py-2.5 px-4 font-mono">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {currentMeta.sampleRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  {Object.values(row).map((val, idx) => (
                    <td key={idx} className="py-2.5 px-4 text-slate-200">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
