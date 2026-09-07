import React, { useState, useEffect } from 'react'
import {
  Pill,
  Search,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  Barcode,
  RefreshCw,
  Layers,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import {
  fetchMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  addBatchToMedicine,
} from '../services/medicineService'
import { Medicine, MedicineBatch } from '../types'

export const MedicinesPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMed, setEditingMed] = useState<Medicine | null>(null)
  const [batchModalMed, setBatchModalMed] = useState<Medicine | null>(null)

  // Form States for Medicine
  const [name, setName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [category, setCategory] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [unitType, setUnitType] = useState('Tablet')
  const [reorderLevel, setReorderLevel] = useState(20)
  const [barcode, setBarcode] = useState('')
  const [saving, setSaving] = useState(false)

  // Form States for Initial Stock / Batch Setup on Add Medicine
  const [includeInitialBatch, setIncludeInitialBatch] = useState(true)
  const [initBatchNumber, setInitBatchNumber] = useState('')
  const [initExpiryDate, setInitExpiryDate] = useState('')
  const [initQuantity, setInitQuantity] = useState(100)
  const [initPurchasePrice, setInitPurchasePrice] = useState(5)
  const [initSalePrice, setInitSalePrice] = useState(8)
  const [initMrp, setInitMrp] = useState(10)

  // Form States for Add Batch Modal on Existing Medicine
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [purchasePrice, setPurchasePrice] = useState(5)
  const [salePrice, setSalePrice] = useState(8)
  const [mrp, setMrp] = useState(10)
  const [batchSaving, setBatchSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchMedicines()
      setMedicines(data)
      const cats = Array.from(new Set(data.map((m) => m.category))).filter(Boolean)
      setCategories(cats)
    } catch (err) {
      console.error('Error fetching medicines:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAddModal = (med?: Medicine) => {
    if (med) {
      setEditingMed(med)
      setName(med.name)
      setGenericName(med.genericName || '')
      setCategory(med.category)
      setManufacturer(med.manufacturer || '')
      setUnitType(med.unitType || 'Tablet')
      setReorderLevel(med.reorderLevel || 20)
      setBarcode(med.barcode || '')
      setIncludeInitialBatch(false)
    } else {
      setEditingMed(null)
      setName('')
      setGenericName('')
      setCategory(categories[0] || 'General')
      setManufacturer('')
      setUnitType('Tablet')
      setReorderLevel(20)
      setBarcode('')
      setIncludeInitialBatch(true)
      setInitBatchNumber(`BAT-${Date.now().toString().slice(-4)}`)
      // Default 1 year from now
      const oneYearLater = new Date()
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
      setInitExpiryDate(oneYearLater.toISOString().split('T')[0])
      setInitQuantity(100)
      setInitPurchasePrice(5)
      setInitSalePrice(8)
      setInitMrp(10)
    }
    setShowAddModal(true)
  }

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category.trim()) return

    setSaving(true)
    try {
      if (editingMed) {
        await updateMedicine(editingMed.id, {
          name: name.trim(),
          genericName: genericName.trim() || undefined,
          category: category.trim(),
          manufacturer: manufacturer.trim() || undefined,
          unitType,
          reorderLevel: Number(reorderLevel),
          barcode: barcode.trim() || undefined,
        })
      } else {
        const initialBatches: MedicineBatch[] = []
        if (includeInitialBatch && initBatchNumber.trim() && initExpiryDate) {
          initialBatches.push({
            id: 'b-' + Date.now(),
            medicineId: 'temp',
            batchNumber: initBatchNumber.trim(),
            expiryDate: initExpiryDate,
            quantity: Number(initQuantity) || 0,
            purchasePrice: Number(initPurchasePrice) || 0,
            salePrice: Number(initSalePrice) || 0,
            mrp: Number(initMrp) || Number(initSalePrice) || 0,
          })
        }

        await createMedicine({
          name: name.trim(),
          genericName: genericName.trim() || undefined,
          category: category.trim(),
          manufacturer: manufacturer.trim() || undefined,
          unitType,
          reorderLevel: Number(reorderLevel),
          barcode: barcode.trim() || undefined,
          isActive: true,
          batches: initialBatches,
        })
      }
      setShowAddModal(false)
      loadData()
    } catch (err) {
      alert('Error saving medicine')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, medName: string) => {
    if (!confirm(`Are you sure you want to delete "${medName}"?`)) return
    await deleteMedicine(id)
    loadData()
  }

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchModalMed || !batchNumber.trim() || !expiryDate) return

    setBatchSaving(true)
    try {
      await addBatchToMedicine(batchModalMed.id, {
        batchNumber: batchNumber.trim(),
        expiryDate,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        mrp: Number(mrp),
      })
      setBatchModalMed(null)
      loadData()
    } catch (err) {
      alert('Error adding batch')
    } finally {
      setBatchSaving(false)
    }
  }

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.barcode && m.barcode.includes(searchQuery))

    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <AppLayout title="Medicine Catalog & Formulation">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-400" />
              Medicine Inventory Master
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage drug formulations, batches, expiry dates, barcodes, and pricing structures
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Medicine</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, generic or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto text-xs custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Medicine / Generic</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Unit / Packaging</th>
                  <th className="py-3.5 px-4 font-bold">Available Batches</th>
                  <th className="py-3.5 px-4 font-bold">Total Stock</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      Loading medicine catalog...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      No medicines match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((med) => {
                    const batches = med.batches || []
                    const totalStock = batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0)
                    const isLow = totalStock <= (med.reorderLevel || 20)

                    return (
                      <tr key={med.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white text-xs">{med.name}</p>
                          {med.genericName && (
                            <p className="text-[11px] text-slate-400">{med.genericName}</p>
                          )}
                          {med.barcode && (
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3 h-3" /> {med.barcode}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{med.category}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold text-[10px]">
                            {med.unitType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 font-bold">{batches.length} batch(es)</span>
                            <button
                              onClick={() => {
                                setBatchModalMed(med)
                                setBatchNumber(`B-${Date.now().toString().slice(-4)}`)
                                setExpiryDate('')
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-[10px] font-bold border border-slate-700"
                            >
                              + Batch
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              totalStock <= 0
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {totalStock} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAddModal(med)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(med.id, med.name)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Add / Edit Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white space-y-4 shadow-2xl my-8">
            <h3 className="text-base font-bold">
              {editingMed ? 'Edit Medicine Master' : 'Add New Medicine'}
            </h3>
            <form onSubmit={handleSaveMedicine} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Medicine Brand Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Panadol Extra 500mg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Generic Formula</label>
                  <input
                    type="text"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Paracetamol + Caffeine"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Analgesics"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Packaging Unit</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Reorder Alert Qty</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="896400..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Manufacturer / Pharma Company</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. GSK / Abbott / Getz"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* Initial Batch & Expiry Date Setup Section (When creating new medicine) */}
              {!editingMed && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeInitialBatch}
                        onChange={(e) => setIncludeInitialBatch(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Add Initial Stock & Expiry Date Now</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Stock Setup
                    </span>
                  </div>

                  {includeInitialBatch && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Batch Number *</label>
                          <input
                            type="text"
                            required={includeInitialBatch}
                            value={initBatchNumber}
                            onChange={(e) => setInitBatchNumber(e.target.value)}
                            placeholder="BAT-2026-A"
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold text-amber-300">Expiry Date *</label>
                          <input
                            type="date"
                            required={includeInitialBatch}
                            value={initExpiryDate}
                            onChange={(e) => setInitExpiryDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={initQuantity}
                            onChange={(e) => setInitQuantity(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Buy Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={initPurchasePrice}
                            onChange={(e) => setInitPurchasePrice(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Sale Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={initSalePrice}
                            onChange={(e) => setInitSalePrice(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">M.R.P.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={initMrp}
                            onChange={(e) => setInitMrp(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                >
                  {saving ? 'Saving...' : 'Save Medicine & Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {batchModalMed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">
              Add Batch to "{batchModalMed.name}"
            </h3>
            <form onSubmit={handleSaveBatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Quantity Added *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Buy Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">M.R.P.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBatchModalMed(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                >
                  {batchSaving ? 'Adding...' : 'Add Batch Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
