'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  creditLimit: number
  totalSales: number
  totalPaid: number
  dueAmount: number
  loyaltyPoints: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [payAmount, setPayAmount] = useState<number>(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    creditLimit: 5000
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data.success) {
        setCustomers(data.data)
      }
    } catch (err) {
      console.error('Error loading customers', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setShowAddModal(false)
        setForm({ name: '', phone: '', email: '', address: '', city: '', creditLimit: 5000 })
        fetchCustomers()
      } else {
        alert(data.error || 'Failed to create customer')
      }
    } catch (err) {
      alert('Error creating customer')
    } finally {
      setSaving(false)
    }
  }

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || payAmount <= 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: payAmount,
          paymentType: 'customer',
          paymentMethod: payMethod,
          notes: `Dues collection payment from ${selectedCustomer.name}`
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowPayModal(false)
        setPayAmount(0)
        fetchCustomers()
      } else {
        alert(data.error || 'Failed to collect payment')
      }
    } catch (err) {
      alert('Error recording payment')
    } finally {
      setSaving(false)
    }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  const totalOutstanding = customers.reduce((sum, c) => sum + (parseFloat(c.dueAmount.toString()) || 0), 0)

  return (
    <AppLayout title="Customers & Credit (Udhaar) Dues">
      <div className="space-y-6">
        {/* Metric Summary & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Registered Customers</p>
            <h4 className="text-2xl font-bold text-white mt-1">{customers.length}</h4>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
            <p className="text-xs font-semibold text-purple-400 uppercase">Total Receivables (Dues)</p>
            <h4 className="text-2xl font-extrabold text-purple-300 mt-1">Rs. {totalOutstanding.toFixed(2)}</h4>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>+</span> Add New Customer
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <input
            type="text"
            placeholder="🔍 Search customers by name, mobile number, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Customers Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Total Purchases</th>
                  <th className="px-5 py-3.5">Loyalty Points</th>
                  <th className="px-5 py-3.5">Outstanding Due</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">Loading customers...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">No customers found.</td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const due = parseFloat(c.dueAmount.toString()) || 0
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-white text-base">{c.name}</p>
                          {c.city && <span className="text-xs text-slate-500">{c.city}</span>}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-300">{c.phone}</td>
                        <td className="px-5 py-4 font-semibold text-white">
                          Rs. {parseFloat(c.totalSales.toString()).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                            ⭐ {c.loyaltyPoints} pts
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`font-extrabold text-sm ${
                              due > 0 ? 'text-purple-400' : 'text-emerald-400'
                            }`}
                          >
                            Rs. {due.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {due > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedCustomer(c)
                                setPayAmount(due)
                                setShowPayModal(true)
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                            >
                              Collect Due
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">All Clear</span>
                          )}
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-xl font-bold">Register Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Aslam Pervez"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 03001234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@email.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                    placeholder="5000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Address & City</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address, City"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20"
                >
                  {saving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Payment Modal */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-xl font-bold">Collect Customer Due (Udhaar)</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Outstanding Balance:</span>
                <span className="text-purple-400 font-bold text-base">Rs. {parseFloat(selectedCustomer.dueAmount.toString()).toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount Receiving (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={parseFloat(selectedCustomer.dueAmount.toString())}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online / EasyPaisa / JazzCash</option>
                  <option value="card">Card / POS</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  {saving ? 'Processing...' : `Collect Rs. ${payAmount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
