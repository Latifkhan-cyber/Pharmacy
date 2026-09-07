import React, { useState, useEffect } from 'react'
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../services/supplierService'
import { createPayment } from '../services/paymentService'
import { Supplier } from '../types'

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false)
  const [editingSup, setEditingSup] = useState<Supplier | null>(null)
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)

  // Pay Supplier Modal
  const [paySup, setPaySup] = useState<Supplier | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState<'cash' | 'bank' | 'online'>('bank')
  const [paySaving, setPaySaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchSuppliers()
      setSuppliers(data)
    } catch (err) {
      console.error('Error fetching suppliers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSup(sup)
      setName(sup.name)
      setContactPerson(sup.contactPerson || '')
      setPhone(sup.phone)
      setEmail(sup.email || '')
      setCity(sup.city || '')
    } else {
      setEditingSup(null)
      setName('')
      setContactPerson('')
      setPhone('')
      setEmail('')
      setCity('')
    }
    setShowModal(true)
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setSaving(true)
    try {
      if (editingSup) {
        await updateSupplier(editingSup.id, {
          name: name.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim() || undefined,
        })
      } else {
        await createSupplier({
          name: name.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          totalPurchase: 0,
          totalPaid: 0,
          dueAmount: 0,
          isActive: true,
        })
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      alert('Error saving supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, supName: string) => {
    if (!confirm(`Delete supplier "${supName}"?`)) return
    await deleteSupplier(id)
    loadData()
  }

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paySup || payAmount <= 0) return

    setPaySaving(true)
    try {
      await createPayment({
        paymentDate: new Date().toISOString(),
        amount: Number(payAmount),
        paymentMethod: payMethod,
        paymentType: 'supplier',
        supplierId: paySup.id,
        supplierName: paySup.name,
        notes: `Payment settlement to ${paySup.name}`,
      })
      setPaySup(null)
      setPayAmount(0)
      loadData()
    } catch (err) {
      alert('Error settling supplier payment')
    } finally {
      setPaySaving(false)
    }
  }

  const filtered = suppliers.filter((s) => {
    return (
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery)
    )
  })

  return (
    <AppLayout title="Suppliers & Vendor Accounts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Supplier & Distributor Master
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Track vendor contracts, purchase totals, payables, and settlement history
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
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by supplier name, contact or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Supplier Name</th>
                  <th className="py-3.5 px-4 font-bold">Contact Person / City</th>
                  <th className="py-3.5 px-4 font-bold">Phone Number</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Purchases</th>
                  <th className="py-3.5 px-4 font-bold text-right">Payable Due</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      No suppliers registered yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 font-bold text-white text-xs">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {s.contactPerson || 'Sales Desk'}
                        {s.city && <p className="text-[10px] text-slate-500">{s.city}</p>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {s.phone}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                        Rs. {Number(s.totalPurchase || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {Number(s.dueAmount || 0) > 0 ? (
                          <span className="font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            Rs. {Number(s.dueAmount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold text-[11px]">Paid Up</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {Number(s.dueAmount || 0) > 0 && (
                            <button
                              onClick={() => {
                                setPaySup(s)
                                setPayAmount(s.dueAmount)
                              }}
                              className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold"
                            >
                              Pay Due
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">
              {editingSup ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>
            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prime Pharma Distributors"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Kashif Ali (Sales Rep)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03124455667"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@primepharma.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">City / Hub Location</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Karachi / Lahore Hub"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {paySup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">Pay Supplier: {paySup.name}</h3>
            <p className="text-xs text-red-400 font-semibold">
              Current Payable Balance: Rs. {Number(paySup.dueAmount).toFixed(2)}
            </p>
            <form onSubmit={handlePaySupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  max={paySup.dueAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-black text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Channel</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="bank">Bank Wire / Online Transfer</option>
                  <option value="cash">Cash from Register</option>
                  <option value="online">Cheque / Digital Account</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaySup(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySaving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl"
                >
                  {paySaving ? 'Processing...' : 'Confirm Supplier Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
