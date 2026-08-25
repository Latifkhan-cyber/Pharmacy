'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Distributor {
  id: string
  name: string
  phone: string
  email?: string
  area?: string
  city?: string
  totalSales: number
  totalExpenses: number
  totalProfit: number
}

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showExpModal, setShowExpModal] = useState(false)
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [form, setForm] = useState({ name: '', phone: '', email: '', area: '', city: '' })
  const [saleForm, setSaleForm] = useState({ amount: 0, cost: 0, notes: '' })
  const [expForm, setExpForm] = useState({ category: 'Fuel', amount: 0, description: '' })

  useEffect(() => {
    fetchDistributors()
  }, [])

  const fetchDistributors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/distributors')
      const data = await res.json()
      if (data.success) setDistributors(data.data)
    } catch (err) {
      console.error('Error fetching distributors', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDistributor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setShowAddModal(false)
        setForm({ name: '', phone: '', email: '', area: '', city: '' })
        fetchDistributors()
      } else {
        alert(data.error || 'Failed to add distributor')
      }
    } catch (err) {
      alert('Error creating distributor')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDistributor) return
    setSaving(true)
    try {
      const res = await fetch(`/api/distributors/${selectedDistributor.id}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(saleForm.amount as any) || 0,
          cost: parseFloat(saleForm.cost as any) || 0,
          notes: saleForm.notes
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowSaleModal(false)
        setSaleForm({ amount: 0, cost: 0, notes: '' })
        fetchDistributors()
      } else {
        alert(data.error || 'Failed to record sale')
      }
    } catch (err) {
      alert('Error adding sale')
    } finally {
      setSaving(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDistributor) return
    setSaving(true)
    try {
      const res = await fetch(`/api/distributors/${selectedDistributor.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expForm.category,
          amount: parseFloat(expForm.amount as any) || 0,
          description: expForm.description
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowExpModal(false)
        setExpForm({ category: 'Fuel', amount: 0, description: '' })
        fetchDistributors()
      } else {
        alert(data.error || 'Failed to record expense')
      }
    } catch (err) {
      alert('Error adding expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Distributors & Sales Representatives">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div>
            <h3 className="font-bold text-lg text-white">Sales Representatives (Distributors)</h3>
            <p className="text-xs text-slate-400">Track field collections, operational expenses, and rep profit</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <span>+</span> Add Representative
          </button>
        </div>

        {/* Distributors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 text-center py-16 text-slate-400">Loading sales representatives...</div>
          ) : distributors.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-500 text-sm">
              No sales representatives registered yet. Click above to add one.
            </div>
          ) : (
            distributors.map((d) => {
              const sales = parseFloat(d.totalSales.toString()) || 0
              const exp = parseFloat(d.totalExpenses.toString()) || 0
              const profit = parseFloat(d.totalProfit.toString()) || (sales - exp)

              return (
                <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-lg">{d.name}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{d.phone}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold rounded-lg">
                        {d.area || d.city || 'Field'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <p className="text-[10px] uppercase text-slate-400 font-semibold">Total Sales</p>
                        <p className="text-sm font-bold text-white mt-0.5">Rs. {sales.toFixed(0)}</p>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <p className="text-[10px] uppercase text-slate-400 font-semibold">Expenses</p>
                        <p className="text-sm font-bold text-rose-400 mt-0.5">Rs. {exp.toFixed(0)}</p>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <p className="text-[10px] uppercase text-slate-400 font-semibold">Net Profit</p>
                        <p className="text-sm font-bold text-emerald-400 mt-0.5">Rs. {profit.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedDistributor(d)
                        setShowSaleModal(true)
                      }}
                      className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all text-center"
                    >
                      + Add Sale
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDistributor(d)
                        setShowExpModal(true)
                      }}
                      className="py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-all text-center"
                    >
                      + Add Expense
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Distributor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold">Add Sales Representative</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDistributor} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rep Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Asad Malik"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="03001234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assigned Area</label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="e.g. Central Zone"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  {saving ? 'Saving...' : 'Register Rep'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Distributor Sale Modal */}
      {showSaleModal && selectedDistributor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Record Distributor Sale</h3>
                <p className="text-xs text-blue-400">Rep: {selectedDistributor.name}</p>
              </div>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSale} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sale Revenue Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleForm.amount || ''}
                  onChange={(e) => setSaleForm({ ...saleForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Cost of Goods (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={saleForm.cost || ''}
                  onChange={(e) => setSaleForm({ ...saleForm, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  placeholder="e.g. Clinic supply batch delivery"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  {saving ? 'Recording...' : 'Save Rep Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Distributor Expense Modal */}
      {showExpModal && selectedDistributor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Record Rep Field Expense</h3>
                <p className="text-xs text-rose-400">Rep: {selectedDistributor.name}</p>
              </div>
              <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expense Category</label>
                <select
                  value={expForm.category}
                  onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="Fuel">Fuel / Petrol Allowance</option>
                  <option value="Transportation">Bus / Transit / Delivery</option>
                  <option value="Daily Allowance">Food / Daily Allowance</option>
                  <option value="Other">Other Field Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Expense Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expForm.amount || ''}
                  onChange={(e) => setExpForm({ ...expForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="e.g. Fuel receipt for north route delivery"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  {saving ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
