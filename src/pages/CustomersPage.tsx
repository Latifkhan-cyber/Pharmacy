import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  DollarSign,
  Wallet,
  RefreshCw,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/customerService'
import { createPayment } from '../services/paymentService'
import { Customer } from '../types'

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false)
  const [editingCust, setEditingCust] = useState<Customer | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [creditLimit, setCreditLimit] = useState(5000)
  const [saving, setSaving] = useState(false)

  // Payment Collection Modal
  const [paymentCust, setPaymentCust] = useState<Customer | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState<'cash' | 'bank' | 'online'>('cash')
  const [paySaving, setPaySaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchCustomers()
      setCustomers(data)
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenModal = (cust?: Customer) => {
    if (cust) {
      setEditingCust(cust)
      setName(cust.name)
      setPhone(cust.phone)
      setEmail(cust.email || '')
      setCity(cust.city || '')
      setCreditLimit(cust.creditLimit || 5000)
    } else {
      setEditingCust(null)
      setName('')
      setPhone('')
      setEmail('')
      setCity('')
      setCreditLimit(5000)
    }
    setShowModal(true)
  }

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setSaving(true)
    try {
      if (editingCust) {
        await updateCustomer(editingCust.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          creditLimit: Number(creditLimit),
        })
      } else {
        await createCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          creditLimit: Number(creditLimit),
          totalSales: 0,
          totalPaid: 0,
          dueAmount: 0,
          loyaltyPoints: 0,
          isActive: true,
        })
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      alert('Error saving customer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, custName: string) => {
    if (!confirm(`Delete customer "${custName}"?`)) return
    await deleteCustomer(id)
    loadData()
  }

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentCust || payAmount <= 0) return

    setPaySaving(true)
    try {
      await createPayment({
        paymentDate: new Date().toISOString(),
        amount: Number(payAmount),
        paymentMethod: payMethod,
        paymentType: 'customer',
        customerId: paymentCust.id,
        customerName: paymentCust.name,
        notes: `Due settlement payment from ${paymentCust.name}`,
      })
      setPaymentCust(null)
      setPayAmount(0)
      loadData()
    } catch (err) {
      alert('Error recording payment')
    } finally {
      setPaySaving(false)
    }
  }

  const filtered = customers.filter((c) => {
    return (
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
  })

  return (
    <AppLayout title="Customers & Udhaar Ledger">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Customer Accounts & Dues Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Maintain customer contact directories, credit balances, loyalty points, and payment receipts
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
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
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
                  <th className="py-3.5 px-4 font-bold">Customer Name</th>
                  <th className="py-3.5 px-4 font-bold">Phone / Address</th>
                  <th className="py-3.5 px-4 font-bold">Loyalty Pts</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Purchases</th>
                  <th className="py-3.5 px-4 font-bold text-right">Balance Due</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      Loading customer directory...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      No customer records match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 font-bold text-white text-xs">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1 text-slate-300 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                        </div>
                        {c.city && <p className="text-[10px] text-slate-500 mt-0.5">{c.city}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-bold text-[10px]">
                          ⭐ {c.loyaltyPoints || 0} pts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                        Rs. {Number(c.totalSales || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {Number(c.dueAmount || 0) > 0 ? (
                          <span className="font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                            Rs. {Number(c.dueAmount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold text-[11px]">Clear</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {Number(c.dueAmount || 0) > 0 && (
                            <button
                              onClick={() => {
                                setPaymentCust(c)
                                setPayAmount(c.dueAmount)
                              }}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold"
                            >
                              Collect Due
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">
              {editingCust ? 'Edit Customer Account' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammad Tariq"
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
                  placeholder="03001234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Address / Area</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Medical City, Sector 4"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Credit Limit (Rs.)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
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
                  {saving ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {paymentCust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">Collect Due from {paymentCust.name}</h3>
            <p className="text-xs text-purple-400 font-semibold">
              Current Outstanding Balance: Rs. {Number(paymentCust.dueAmount).toFixed(2)}
            </p>
            <form onSubmit={handleCollectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Amount Received (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  max={paymentCust.dueAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-black text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="cash">Cash in Register</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="online">Online / EasyPaisa / JazzCash</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentCust(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySaving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  {paySaving ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
