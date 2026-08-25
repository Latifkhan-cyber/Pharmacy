'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

interface Expense {
  id: string
  expenseDate: string
  category: string
  amount: number
  description?: string
  user?: {
    fullName: string
  }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    category: 'Electricity',
    amount: 0,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const [expRes, catRes] = await Promise.all([
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/expenses/categories').then(r => r.json()).catch(() => ({ data: [] }))
      ])

      if (expRes.success) {
        setExpenses(expRes.data)
        const cats = Array.from(new Set(expRes.data.map((e: Expense) => e.category))).filter(Boolean) as string[]
        setCategories(cats.length > 0 ? cats : ['Rent', 'Salary', 'Electricity', 'Fuel', 'Office Supplies', 'Maintenance', 'Other'])
      }
    } catch (err) {
      console.error('Error loading expenses', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          amount: parseFloat(form.amount as any) || 0,
          description: form.description,
          expenseDate: new Date(form.expenseDate).toISOString()
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setForm({ category: 'Electricity', amount: 0, description: '', expenseDate: new Date().toISOString().split('T')[0] })
        fetchExpenses()
      } else {
        alert(data.error || 'Failed to record expense')
      }
    } catch (err) {
      alert('Error recording expense')
    } finally {
      setSaving(false)
    }
  }

  const filtered = expenses.filter(e =>
    categoryFilter === 'all' || e.category === categoryFilter
  )

  const totalExpense = filtered.reduce((sum, e) => sum + (parseFloat(e.amount.toString()) || 0), 0)

  return (
    <AppLayout title="Operational Expenses">
      <div className="space-y-6">
        {/* Metric & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Filtered Expenses Total</p>
              <h4 className="text-2xl font-extrabold text-rose-400 mt-0.5">Rs. {totalExpense.toFixed(2)}</h4>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
          >
            <span>+</span> Record Expense
          </button>
        </div>

        {/* Expenses Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Recorded By</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">Loading expense logs...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">No expense records found.</td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300">
                        {e.description || '-'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {e.user?.fullName || 'System User'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-rose-400 text-base">
                        -Rs. {parseFloat(e.amount.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold">Record Operational Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="Electricity">Electricity / Utilities</option>
                  <option value="Rent">Shop / Facility Rent</option>
                  <option value="Salary">Staff Salaries</option>
                  <option value="Fuel">Fuel & Generator</option>
                  <option value="Office Supplies">Office Supplies & Stationery</option>
                  <option value="Maintenance">Equipment Maintenance</option>
                  <option value="Marketing">Marketing / Advertising</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expense Amount (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description / Bill Receipt Notes</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter details or voucher number..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
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
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20"
                >
                  {saving ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
