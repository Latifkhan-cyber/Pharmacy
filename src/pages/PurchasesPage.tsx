import React, { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Plus,
  Search,
  Building2,
  Calendar,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchPurchases, createPurchase } from '../services/purchaseService'
import { fetchSuppliers } from '../services/supplierService'
import { fetchMedicines } from '../services/medicineService'
import { Purchase, Supplier, Medicine, PurchaseItem } from '../types'

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // New Purchase Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [saving, setSaving] = useState(false)

  // Current Item Form in Modal
  const [itemMedId, setItemMedId] = useState('')
  const [itemBatch, setItemBatch] = useState('')
  const [itemExpiry, setItemExpiry] = useState('')
  const [itemQty, setItemQty] = useState(50)
  const [itemBuyPrice, setItemBuyPrice] = useState(10)
  const [itemSalePrice, setItemSalePrice] = useState(15)
  const [itemMrp, setItemMrp] = useState(18)

  const loadData = async () => {
    setLoading(true)
    try {
      const [purs, sups, meds] = await Promise.all([
        fetchPurchases(),
        fetchSuppliers(),
        fetchMedicines(),
      ])
      setPurchases(purs)
      setSuppliers(sups)
      setMedicines(meds)
      if (sups.length > 0) setSelectedSupplierId(sups[0].id)
      if (meds.length > 0) setItemMedId(meds[0].id)
    } catch (err) {
      console.error('Error loading purchases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addItemToPurchase = () => {
    const med = medicines.find((m) => m.id === itemMedId)
    if (!med || !itemBatch.trim() || !itemExpiry) {
      alert('Please fill out medicine, batch number and expiry date')
      return
    }

    const total = Number(itemQty) * Number(itemBuyPrice)
    const newItem: PurchaseItem = {
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: itemBatch.trim(),
      expiryDate: itemExpiry,
      quantity: Number(itemQty),
      purchasePrice: Number(itemBuyPrice),
      salePrice: Number(itemSalePrice),
      mrp: Number(itemMrp),
      total,
    }

    setItems([...items, newItem])
    setItemBatch(`BAT-${Date.now().toString().slice(-4)}`)
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const totalAmount = Math.max(0, subtotal + tax - discount)
  const dueAmount = Math.max(0, totalAmount - paidAmount)

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId || items.length === 0) {
      alert('Please add at least one item to the purchase invoice.')
      return
    }

    setSaving(true)
    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId)

      await createPurchase({
        supplierId: selectedSupplierId,
        supplierName: supplier?.name || 'Distributor Vendor',
        purchaseDate: new Date().toISOString(),
        subtotal,
        tax,
        discount,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentStatus: dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
        items,
      })

      setShowAddModal(false)
      setItems([])
      loadData()
    } catch (err: any) {
      alert('Error recording purchase: ' + err?.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = purchases.filter((p) => {
    return (
      !searchQuery.trim() ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  return (
    <AppLayout title="Supplier Purchases & Stock In">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
              Purchase Orders & Stock In
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Procure stock from pharmaceutical distributors, track purchase pricing and supplier balances
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
              onClick={() => {
                setShowAddModal(true)
                setItemBatch(`BAT-${Date.now().toString().slice(-4)}`)
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Purchase</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search purchase order # or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">PO Invoice #</th>
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold">Supplier</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Paid</th>
                  <th className="py-3.5 px-4 font-bold text-right">Due</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      Loading purchase history...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {pur.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(pur.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {pur.supplierName || 'Distributor'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            pur.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {pur.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
                        Rs. {Number(pur.paidAmount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-red-400 font-bold">
                        Rs. {Number(pur.dueAmount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                        Rs. {Number(pur.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full text-white space-y-4 shadow-2xl my-8">
            <h3 className="text-base font-bold">Record Supplier Purchase</h3>
            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city || 'Vendor'}) • Current Due: Rs. {s.dueAmount}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add item sub-form */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <p className="font-bold text-slate-300">Add Medicine Item to Purchase</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-0.5 text-[11px]">Medicine</label>
                    <select
                      value={itemMedId}
                      onChange={(e) => setItemMedId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5 text-[11px]">Batch #</label>
                    <input
                      type="text"
                      value={itemBatch}
                      onChange={(e) => setItemBatch(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-0.5 text-[11px]">Expiry Date</label>
                    <input
                      type="date"
                      value={itemExpiry}
                      onChange={(e) => setItemExpiry(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5 text-[11px]">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5 text-[11px]">Buy Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemBuyPrice}
                      onChange={(e) => setItemBuyPrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5 text-[11px]">Sale Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemSalePrice}
                      onChange={(e) => setItemSalePrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItemToPurchase}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all"
                >
                  + Add Item to List
                </button>
              </div>

              {/* Items List Preview */}
              {items.length > 0 && (
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[10px]">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Cost</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{it.medicineName}</td>
                          <td className="p-2 font-mono text-blue-300">{it.batchNumber}</td>
                          <td className="p-2 text-center">{it.quantity}</td>
                          <td className="p-2 text-right">Rs. {it.purchasePrice.toFixed(2)}</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">Rs. {it.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-slate-400 mb-1">Total Bill</label>
                  <p className="text-lg font-black text-white">Rs. {totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Paid Amount (Rs.)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Due to Supplier</label>
                  <p className="text-lg font-black text-red-400">Rs. {dueAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || items.length === 0}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                >
                  {saving ? 'Recording...' : 'Complete Stock In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
