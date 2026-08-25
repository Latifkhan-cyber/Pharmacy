'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    pharmacy_name: 'PrimeCare Pharmacy',
    pharmacy_address: '123 Health Ave, Medical City',
    pharmacy_phone: '0300-1234567',
    tax_rate: '5',
    low_stock_threshold: '15',
    expiry_alert_days: '90'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const map: Record<string, string> = { ...settings }
        data.data.forEach((s: any) => {
          map[s.key] = s.value
        })
        setSettings(map)
      }
    } catch (err) {
      console.error('Failed to load settings', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        })
      )
      await Promise.all(promises)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout title="System Settings & Configuration">
      <div className="max-w-4xl space-y-6">
        {savedSuccess && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-sm flex items-center gap-2">
            <span>✅</span> Settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Pharmacy Profile Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-white border-b border-slate-800 pb-3">
              🏥 Pharmacy Identity & Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Pharmacy / Store Name</label>
                <input
                  type="text"
                  required
                  value={settings.pharmacy_name || ''}
                  onChange={(e) => setSettings({ ...settings, pharmacy_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  required
                  value={settings.pharmacy_phone || ''}
                  onChange={(e) => setSettings({ ...settings, pharmacy_phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={settings.pharmacy_address || ''}
                  onChange={(e) => setSettings({ ...settings, pharmacy_address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Operational & Stock Alert Thresholds */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-white border-b border-slate-800 pb-3">
              ⚙️ Inventory & Tax Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Default Sales Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.tax_rate || '0'}
                  onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Low Stock Alert Quantity</label>
                <input
                  type="number"
                  value={settings.low_stock_threshold || '10'}
                  onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Near Expiry Alert (Days)</label>
                <input
                  type="number"
                  value={settings.expiry_alert_days || '90'}
                  onChange={(e) => setSettings({ ...settings, expiry_alert_days: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-blue-500/20 transition-all"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
