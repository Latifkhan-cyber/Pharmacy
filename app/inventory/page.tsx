'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'low' | 'near-expiry' | 'expired' | 'valuation'>('low')

  useEffect(() => {
    fetch('/api/medicines')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMedicines(data.data)
        }
      })
      .catch(err => console.error('Error loading inventory', err))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

  // Filter batches
  const allBatches = medicines.flatMap(m =>
    m.batches.map((b: any) => ({
      ...b,
      medicineName: m.name,
      genericName: m.genericName,
      unitType: m.unitType,
      category: m.category,
      reorderLevel: m.reorderLevel,
    }))
  )

  const lowStockList = medicines.filter(m => {
    const totalQty = m.batches.reduce((sum: number, b: any) => sum + b.quantity, 0)
    return totalQty <= m.reorderLevel
  })

  const nearExpiryList = allBatches.filter(b => {
    const exp = new Date(b.expiryDate)
    return exp >= today && exp <= ninetyDaysFromNow && b.quantity > 0
  })

  const expiredList = allBatches.filter(b => {
    const exp = new Date(b.expiryDate)
    return exp < today && b.quantity > 0
  })

  // Category valuations
  const categoryValuations: Record<string, { count: number; qty: number; value: number }> = {}
  medicines.forEach(m => {
    if (!categoryValuations[m.category]) {
      categoryValuations[m.category] = { count: 0, qty: 0, value: 0 }
    }
    categoryValuations[m.category].count += 1
    m.batches.forEach((b: any) => {
      categoryValuations[m.category].qty += b.quantity
      categoryValuations[m.category].value += b.quantity * parseFloat(b.purchasePrice)
    })
  })

  return (
    <AppLayout title="Inventory & Stock Alerts">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('low')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'low'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⚠️</span> Low Stock ({lowStockList.length})
          </button>

          <button
            onClick={() => setActiveTab('near-expiry')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'near-expiry'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow-lg shadow-orange-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⏳</span> Near Expiry 90d ({nearExpiryList.length})
          </button>

          <button
            onClick={() => setActiveTab('expired')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'expired'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🚫</span> Expired Batches ({expiredList.length})
          </button>

          <button
            onClick={() => setActiveTab('valuation')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'valuation'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>📊</span> Stock Valuations
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading alerts and inventory...</div>
          ) : activeTab === 'low' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Low Stock Medicines</h3>
                  <p className="text-xs text-slate-400">Medicines where total stock is at or below reorder threshold</p>
                </div>
                <Link
                  href="/purchases"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
                >
                  + Order from Supplier
                </Link>
              </div>

              {lowStockList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">✅ All medicines have healthy stock levels!</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {lowStockList.map(m => {
                    const total = m.batches.reduce((sum: number, b: any) => sum + b.quantity, 0)
                    return (
                      <div key={m.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.category} • Unit: {m.unitType}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${total === 0 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {total} units left (Min: {m.reorderLevel})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'near-expiry' ? (
            <div>
              <h3 className="font-bold text-lg text-white mb-1">Batches Expiring in 90 Days</h3>
              <p className="text-xs text-slate-400 mb-4">Prioritize these batches for dispensing</p>

              {nearExpiryList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">✅ No batches expiring in the next 90 days.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {nearExpiryList.map(b => (
                    <div key={b.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{b.medicineName}</p>
                        <p className="text-xs text-slate-400">Batch: <span className="font-mono text-blue-400">{b.batchNumber}</span> • Category: {b.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-orange-400 font-bold text-xs block">
                          Expires: {new Date(b.expiryDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">{b.quantity} units remaining</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'expired' ? (
            <div>
              <h3 className="font-bold text-lg text-white mb-1">Expired Batches</h3>
              <p className="text-xs text-red-400 mb-4">Quarantine and dispose of these items immediately</p>

              {expiredList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">✅ No expired batches in inventory.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {expiredList.map(b => (
                    <div key={b.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{b.medicineName}</p>
                        <p className="text-xs text-slate-400">Batch: <span className="font-mono text-red-400">{b.batchNumber}</span></p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                          Expired on {new Date(b.expiryDate).toLocaleDateString()}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">{b.quantity} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-lg text-white mb-1">Stock Valuation by Category</h3>
              <p className="text-xs text-slate-400 mb-4">Total financial cost value of on-hand inventory</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(categoryValuations).map(([category, val]) => (
                  <div key={category} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs font-bold text-blue-400 uppercase">{category}</p>
                    <h4 className="text-xl font-extrabold text-white mt-1">Rs. {val.value.toFixed(2)}</h4>
                    <p className="text-xs text-slate-500 mt-2">
                      {val.count} products • {val.qty} total units in stock
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
