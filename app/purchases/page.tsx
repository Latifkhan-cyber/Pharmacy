'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Supplier {
  id: string
  name: string
  phone: string
  dueAmount: number
}

interface Medicine {
  id: string
  name: string
  unitType: string
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // New Purchase Form
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(`PO-${Date.now()}`)
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [items, setItems] = useState<any[]>([
    { medicineId: '', batchNumber: '', expiryDate: '', quantity: 50, purchasePrice: 0, salePrice: 0, mrp: 0 }
  ])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [purRes, supRes, medRes] = await Promise.all([
        fetch('/api/purchases').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/medicines').then(r => r.json())
      ])

      if (purRes.success) setPurchases(purRes.data)
      if (supRes.success) setSuppliers(supRes.data)
      if (medRes.success) setMedicines(medRes.data)
    } catch (err) {
      console.error('Error fetching purchases data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      { medicineId: '', batchNumber: '', expiryDate: '', quantity: 50, purchasePrice: 0, salePrice: 0, mrp: 0 }
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const subtotal = items.reduce((sum, item) => sum + ((parseFloat(item.purchasePrice) || 0) * (parseInt(item.quantity) || 0)), 0)
  const totalAmount = Math.max(0, subtotal + (parseFloat(tax as any) || 0) - (parseFloat(discount as any) || 0))
  const dueAmount = Math.max(0, totalAmount - (parseFloat(paidAmount as any) || 0))

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      alert('Please select a supplier')
      return
    }
    if (items.some(i => !i.medicineId || !i.batchNumber || !i.expiryDate)) {
      alert('Please fill all medicine, batch number, and expiry date fields')
      return
    }

    setSaving(true)
    try {
      const payload = {
        invoiceNumber,
        supplierId,
        subtotal,
        tax: parseFloat(tax as any) || 0,
        discount: parseFloat(discount as any) || 0,
        totalAmount,
        paidAmount: parseFloat(paidAmount as any) || 0,
        dueAmount,
        paymentStatus: dueAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending'),
        items: items.map(i => ({
          medicineId: i.medicineId,
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
          quantity: parseInt(i.quantity) || 0,
          purchasePrice: parseFloat(i.purchasePrice) || 0,
          salePrice: parseFloat(i.salePrice) || 0,
          mrp: parseFloat(i.mrp) || parseFloat(i.salePrice) || 0,
          total: (parseFloat(i.purchasePrice) || 0) * (parseInt(i.quantity) || 0)
        }))
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setInvoiceNumber(`PO-${Date.now()}`)
        setItems([{ medicineId: '', batchNumber: '', expiryDate: '', quantity: 50, purchasePrice: 0, salePrice: 0, mrp: 0 }])
        fetchData()
      } else {
        alert(data.error || 'Failed to record purchase')
      }
    } catch (err) {
      alert('Error submitting purchase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Purchase Orders & Shipments">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div>
            <h3 className="font-bold text-lg text-white">Supplier Purchase Invoices</h3>
            <p className="text-xs text-slate-400">Incoming stock orders and supplier payables</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <span>+</span> New Purchase Order
          </button>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Total Cost</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Due Balance</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">Loading purchase records...</td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">No purchase records found.</td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-blue-400 text-sm">{p.invoiceNumber}</td>
                      <td className="px-5 py-4 font-semibold text-white">{p.supplier?.name}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4 font-bold text-white">Rs. {parseFloat(p.totalAmount).toFixed(2)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-400">Rs. {parseFloat(p.paidAmount).toFixed(2)}</td>
                      <td className="px-5 py-4 font-bold text-purple-400">Rs. {parseFloat(p.dueAmount).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            p.paymentStatus === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : p.paymentStatus === 'partial'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-3xl w-full text-white space-y-4 my-8 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">Record Incoming Purchase</h3>
                <p className="text-xs text-slate-400">Stock will be automatically incremented upon save</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Purchase Invoice # *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-blue-400 uppercase">Medicine Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    + Add Item
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 items-end p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">Medicine *</label>
                      <select
                        required
                        value={item.medicineId}
                        onChange={(e) => updateItem(idx, 'medicineId', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unitType})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Batch # *</label>
                      <input
                        type="text"
                        required
                        placeholder="BATCH-01"
                        value={item.batchNumber}
                        onChange={(e) => updateItem(idx, 'batchNumber', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={item.expiryDate}
                        onChange={(e) => updateItem(idx, 'expiryDate', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Qty *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Cost (Rs.) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.purchasePrice || ''}
                          onChange={(e) => updateItem(idx, 'purchasePrice', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-300 p-1 mt-3"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Subtotal:</label>
                  <span className="font-bold text-white text-base">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Paid Now (Rs.):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Due to Supplier (Rs.):</label>
                  <span className="font-bold text-purple-400 text-base">Rs. {dueAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
                >
                  {saving ? 'Saving...' : `Save Purchase (Rs. ${totalAmount.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
