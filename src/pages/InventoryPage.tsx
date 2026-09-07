import React, { useState, useEffect } from 'react'
import {
  Boxes,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchMedicines } from '../services/medicineService'
import { Medicine, MedicineBatch } from '../types'

interface FlattenedBatchItem {
  medicineId: string
  medicineName: string
  category: string
  unitType: string
  batchId: string
  batchNumber: string
  expiryDate: string
  quantity: number
  salePrice: number
  purchasePrice: number
  reorderLevel: number
  daysUntilExpiry: number
  isExpired: boolean
  isNearExpiry: boolean
  isLowStock: boolean
}

export const InventoryPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low' | 'near_expiry' | 'expired'>('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchMedicines()
      setMedicines(data)
    } catch (err) {
      console.error('Error fetching inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Flatten batches for batch-level inspection
  const flattened: FlattenedBatchItem[] = []
  const now = new Date().getTime()

  medicines.forEach((med) => {
    const batches = med.batches || []
    const totalStock = batches.reduce((s, b) => s + Number(b.quantity || 0), 0)
    const isLow = totalStock <= (med.reorderLevel || 20)

    batches.forEach((b) => {
      const expTime = new Date(b.expiryDate).getTime()
      const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24))
      const isExpired = diffDays <= 0
      const isNearExpiry = diffDays > 0 && diffDays <= 90

      flattened.push({
        medicineId: med.id,
        medicineName: med.name,
        category: med.category,
        unitType: med.unitType,
        batchId: b.id,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        quantity: b.quantity,
        salePrice: Number(b.salePrice),
        purchasePrice: Number(b.purchasePrice),
        reorderLevel: med.reorderLevel || 20,
        daysUntilExpiry: diffDays,
        isExpired,
        isNearExpiry,
        isLowStock: isLow,
      })
    })
  })

  // Filter batches
  const filtered = flattened.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterType === 'low') return item.isLowStock
    if (filterType === 'near_expiry') return item.isNearExpiry
    if (filterType === 'expired') return item.isExpired
    return true
  })

  const lowStockCount = flattened.filter((i) => i.isLowStock).length
  const nearExpiryCount = flattened.filter((i) => i.isNearExpiry).length
  const expiredCount = flattened.filter((i) => i.isExpired).length

  return (
    <AppLayout title="Inventory & Expiry Control">
      <div className="space-y-6">
        {/* Metric Alert Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setFilterType('low')}
            className={`p-5 rounded-3xl border cursor-pointer transition-all shadow-lg ${
              filterType === 'low'
                ? 'bg-amber-500/20 border-amber-500 shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Batches</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">{lowStockCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Under minimum reorder limit</p>
          </div>

          <div
            onClick={() => setFilterType('near_expiry')}
            className={`p-5 rounded-3xl border cursor-pointer transition-all shadow-lg ${
              filterType === 'near_expiry'
                ? 'bg-orange-500/20 border-orange-500 shadow-orange-500/10'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Expiring in 90 Days</span>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-black text-orange-400 mt-2">{nearExpiryCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Priority for dispensing</p>
          </div>

          <div
            onClick={() => setFilterType('expired')}
            className={`p-5 rounded-3xl border cursor-pointer transition-all shadow-lg ${
              filterType === 'expired'
                ? 'bg-red-500/20 border-red-500 shadow-red-500/10'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Expired Batches</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-black text-red-400 mt-2">{expiredCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Immediate quarantine required</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search batch or medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Batches ({flattened.length})
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilterType('near_expiry')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'near_expiry'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Near Expiry
            </button>
            <button
              onClick={() => setFilterType('expired')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterType === 'expired'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Batches Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Medicine</th>
                  <th className="py-3.5 px-4 font-bold">Batch No</th>
                  <th className="py-3.5 px-4 font-bold">Quantity</th>
                  <th className="py-3.5 px-4 font-bold">Expiry Date</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Sale Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      Scanning inventory batches...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      No batch records match this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.batchId} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-xs">{item.medicineName}</p>
                        <p className="text-[11px] text-slate-400">{item.category}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-300 font-bold">
                        {item.batchNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">{item.quantity} {item.unitType}s</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.expiryDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px]">
                            Expired ({Math.abs(item.daysUntilExpiry)}d ago)
                          </span>
                        ) : item.isNearExpiry ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-[10px]">
                            Expires in {item.daysUntilExpiry} days
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                            Healthy ({item.daysUntilExpiry}d left)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                        Rs. {item.salePrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
