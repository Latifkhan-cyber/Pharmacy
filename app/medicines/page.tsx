'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Batch {
  id: string
  batchNumber: string
  quantity: number
  purchasePrice: number
  salePrice: number
  mrp: number
  expiryDate: string
}

interface Medicine {
  id: string
  name: string
  genericName?: string
  category: string
  manufacturer?: string
  unitType: string
  reorderLevel: number
  barcode?: string
  isActive: boolean
  batches: Batch[]
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Modals
  const [showAddMedModal, setShowAddMedModal] = useState(false)
  const [showAddBatchModal, setShowAddBatchModal] = useState(false)
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null)
  const [viewingBatchesMed, setViewingBatchesMed] = useState<Medicine | null>(null)

  // Medicine Form State
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    category: 'Analgesics',
    manufacturer: '',
    unitType: 'Tablet',
    reorderLevel: 20,
    barcode: ''
  })

  // Batch Form State
  const [batchForm, setBatchForm] = useState({
    batchNumber: '',
    quantity: 100,
    purchasePrice: 0,
    salePrice: 0,
    mrp: 0,
    expiryDate: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/medicines')
      const data = await res.json()
      if (data.success) {
        setMedicines(data.data)
        const cats = Array.from(new Set(data.data.map((m: Medicine) => m.category))).filter(Boolean) as string[]
        setCategories(cats)
      }
    } catch (err) {
      console.error('Failed to load medicines', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm)
      })
      const data = await res.json()
      if (data.success) {
        setShowAddMedModal(false)
        setMedForm({
          name: '',
          genericName: '',
          category: 'Analgesics',
          manufacturer: '',
          unitType: 'Tablet',
          reorderLevel: 20,
          barcode: ''
        })
        fetchMedicines()
      } else {
        alert(data.error || 'Failed to create medicine')
      }
    } catch (err) {
      alert('Error creating medicine')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMed) return
    setSaving(true)
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...batchForm,
          medicineId: selectedMed.id
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowAddBatchModal(false)
        setBatchForm({
          batchNumber: '',
          quantity: 100,
          purchasePrice: 0,
          salePrice: 0,
          mrp: 0,
          expiryDate: ''
        })
        fetchMedicines()
      } else {
        alert(data.error || 'Failed to add batch')
      }
    } catch (err) {
      alert('Error adding batch')
    } finally {
      setSaving(false)
    }
  }

  const filtered = medicines.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <AppLayout title="Medicine Directory & Inventory">
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Search medicines, generic name, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 max-w-md px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddMedModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <span>+</span> Add Medicine
          </button>
        </div>

        {/* Medicines Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Medicine Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Total Stock</th>
                  <th className="px-5 py-3.5">Batches</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading medicines...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No medicines found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const totalStock = m.batches?.reduce((sum, b) => sum + b.quantity, 0) || 0
                    const isLow = totalStock <= m.reorderLevel
                    const isOut = totalStock === 0

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-white text-base leading-tight">{m.name}</p>
                          {m.genericName && (
                            <p className="text-xs text-slate-400 mt-0.5">{m.genericName}</p>
                          )}
                          {m.manufacturer && (
                            <span className="text-[11px] text-blue-400">Mfr: {m.manufacturer}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg font-medium">
                            {m.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-300">{m.unitType}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isOut
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : isLow
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {totalStock} units
                            </span>
                            {isLow && !isOut && (
                              <span className="text-[10px] text-amber-400 font-semibold uppercase">Low</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {m.batches?.length || 0} batch(es)
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            onClick={() => setViewingBatchesMed(m)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                          >
                            View Batches
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMed(m)
                              setShowAddBatchModal(true)
                            }}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all"
                          >
                            + Batch
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold">Register New Medicine</h3>
              <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Brand / Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    placeholder="e.g. Panadol Extra 500mg"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={medForm.genericName}
                    onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    placeholder="e.g. Analgesics"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={medForm.manufacturer}
                    onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                    placeholder="e.g. GSK"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Unit Type *</label>
                  <select
                    value={medForm.unitType}
                    onChange={(e) => setMedForm({ ...medForm, unitType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream / Ointment</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    min="1"
                    value={medForm.reorderLevel}
                    onChange={(e) => setMedForm({ ...medForm, reorderLevel: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={medForm.barcode}
                    onChange={(e) => setMedForm({ ...medForm, barcode: e.target.value })}
                    placeholder="Optional barcode"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
                >
                  {saving ? 'Saving...' : 'Register Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && selectedMed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Add New Batch</h3>
                <p className="text-xs text-blue-400">{selectedMed.name}</p>
              </div>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={batchForm.batchNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                  placeholder="e.g. BATCH-2024-05"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Purchase Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.purchasePrice || ''}
                    onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sale Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.salePrice || ''}
                    onChange={(e) => setBatchForm({ ...batchForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">MRP ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.mrp || ''}
                    onChange={(e) => setBatchForm({ ...batchForm, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
                >
                  {saving ? 'Adding...' : 'Add Stock Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Batches Modal */}
      {viewingBatchesMed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full text-white space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">{viewingBatchesMed.name}</h3>
                <p className="text-xs text-slate-400">Batch details and expiry registry</p>
              </div>
              <button onClick={() => setViewingBatchesMed(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto pr-1">
              {viewingBatchesMed.batches?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No batches found for this medicine.</div>
              ) : (
                viewingBatchesMed.batches?.map((b) => {
                  const expiry = new Date(b.expiryDate)
                  const isExpired = expiry < new Date()

                  return (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-sm font-bold text-blue-400">{b.batchNumber}</span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Cost: Rs. {parseFloat(b.purchasePrice.toString()).toFixed(2)} • Sale: Rs. {parseFloat(b.salePrice.toString()).toFixed(2)} • MRP: Rs. {parseFloat(b.mrp.toString()).toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-white">{b.quantity} units</span>
                        <p className={`text-[11px] font-medium ${isExpired ? 'text-red-400' : 'text-slate-400'}`}>
                          {isExpired ? 'Expired: ' : 'Exp: '} {expiry.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewingBatchesMed(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
