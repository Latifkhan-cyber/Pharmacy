import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Plus,
  Search,
  Trash2,
  Calendar,
  RefreshCw,
  Tag,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import {
  fetchExpenses,
  createExpense,
  deleteExpense,
} from '../services/expenseService'
import { Expense } from '../types'

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add Modal State
  const [showModal, setShowModal] = useState(false)
  const [category, setCategory] = useState('Electricity & Utilities')
  const [amount, setAmount] = useState(1000)
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchExpenses()
      setExpenses(data)
    } catch (err) {
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category.trim() || amount <= 0) return

    setSaving(true)
    try {
      await createExpense({
        category: category.trim(),
        amount: Number(amount),
        description: description.trim() || undefined,
        expenseDate,
      })
      setShowModal(false)
      setDescription('')
      setAmount(1000)
      loadData()
    } catch (err) {
      alert('Error recording expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record?')) return
    await deleteExpense(id)
    loadData()
  }

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const filtered = expenses.filter((e) => {
    return (
      !searchQuery.trim() ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  return (
    <AppLayout title="Operational Expenses & Overhead">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              Pharmacy Operational Expenses
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Log store utilities, staff salaries, packaging, refrigeration power, and maintenance costs
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
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-red-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* Total Expense Banner & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Recorded Expenses
            </span>
            <p className="text-2xl font-black text-red-400 mt-1">
              Rs. {totalExpenseAmount.toLocaleString()}
            </p>
          </div>

          <div className="sm:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search expense category or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Expense Date</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Description / Purpose</th>
                  <th className="py-3.5 px-4 font-bold text-right">Amount (Rs.)</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{exp.expenseDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 font-semibold text-[10px] border border-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {exp.description || 'General Operational Cost'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-red-400 text-sm">
                        Rs. {Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">Record Store Expense</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Staff Salary & Overtime">Staff Salary & Overtime</option>
                  <option value="Shop Rent & Maintenance">Shop Rent & Maintenance</option>
                  <option value="Packaging & Bags">Packaging & Bags</option>
                  <option value="Transport & Fuel">Transport & Fuel</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or voucher number..."
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
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
