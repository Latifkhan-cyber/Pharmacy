import React, { useState, useEffect } from 'react'
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import {
  fetchDistributors,
  createDistributor,
  updateDistributor,
  deleteDistributor,
} from '../services/distributorService'
import { Distributor } from '../types'

export const DistributorsPage: React.FC = () => {
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false)
  const [editingDist, setEditingDist] = useState<Distributor | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('')
  const [totalSales, setTotalSales] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchDistributors()
      setDistributors(data)
    } catch (err) {
      console.error('Error fetching distributors:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenModal = (dist?: Distributor) => {
    if (dist) {
      setEditingDist(dist)
      setName(dist.name)
      setPhone(dist.phone)
      setArea(dist.area || '')
      setCity(dist.city || '')
      setTotalSales(dist.totalSales || 0)
      setTotalExpenses(dist.totalExpenses || 0)
    } else {
      setEditingDist(null)
      setName('')
      setPhone('')
      setArea('')
      setCity('')
      setTotalSales(0)
      setTotalExpenses(0)
    }
    setShowModal(true)
  }

  const handleSaveDistributor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setSaving(true)
    try {
      const profit = Math.max(0, Number(totalSales) - Number(totalExpenses))
      if (editingDist) {
        await updateDistributor(editingDist.id, {
          name: name.trim(),
          phone: phone.trim(),
          area: area.trim() || undefined,
          city: city.trim() || undefined,
          totalSales: Number(totalSales),
          totalExpenses: Number(totalExpenses),
          totalProfit: profit,
        })
      } else {
        await createDistributor({
          name: name.trim(),
          phone: phone.trim(),
          area: area.trim() || undefined,
          city: city.trim() || undefined,
          totalSales: Number(totalSales),
          totalExpenses: Number(totalExpenses),
          totalProfit: profit,
          isActive: true,
        })
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      alert('Error saving distributor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, distName: string) => {
    if (!confirm(`Delete distributor rep "${distName}"?`)) return
    await deleteDistributor(id)
    loadData()
  }

  const filtered = distributors.filter((d) => {
    return (
      !searchQuery.trim() ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.area && d.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.phone.includes(searchQuery)
    )
  })

  return (
    <AppLayout title="Distributor & Field Reps">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              Distributors & Field Sales Representatives
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Track territory route sales, field logistics expenses, and net profit generation
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
              <span>Add Rep</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by rep name, territory or phone..."
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
                  <th className="py-3.5 px-4 font-bold">Rep Name</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Territory</th>
                  <th className="py-3.5 px-4 font-bold">Phone Number</th>
                  <th className="py-3.5 px-4 font-bold text-right">Gross Sales</th>
                  <th className="py-3.5 px-4 font-bold text-right">Field Expenses</th>
                  <th className="py-3.5 px-4 font-bold text-right">Net Profit</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      Loading distributor representatives...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      No distributor records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4 font-bold text-white text-xs">
                        {d.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {d.area || 'All Sectors'}
                        {d.city && <p className="text-[10px] text-slate-500">{d.city}</p>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {d.phone}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                        Rs. {Number(d.totalSales || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-red-400 font-medium">
                        Rs. {Number(d.totalExpenses || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                        Rs. {Number(d.totalProfit || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(d)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
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
              {editingDist ? 'Edit Distributor Rep' : 'Add New Distributor Rep'}
            </h3>
            <form onSubmit={handleSaveDistributor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Rep Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bilal Ahmed"
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
                  placeholder="03456789012"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Area</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="North District"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Medical Town"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Gross Sales (Rs.)</label>
                  <input
                    type="number"
                    value={totalSales}
                    onChange={(e) => setTotalSales(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Expenses (Rs.)</label>
                  <input
                    type="number"
                    value={totalExpenses}
                    onChange={(e) => setTotalExpenses(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
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
                  {saving ? 'Saving...' : 'Save Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
