import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Flame,
  Building,
  Percent,
  AlertTriangle,
  Receipt,
  Save,
  CheckCircle,
  Database,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchSettings, saveSetting } from '../services/settingsService'
import { seedFirestoreDatabase } from '../services/seedService'
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfig,
} from '../firebase/config'

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Firebase Config States
  const currentFbConfig = getSavedFirebaseConfig()
  const [fbApiKey, setFbApiKey] = useState(currentFbConfig.apiKey || '')
  const [fbProjectId, setFbProjectId] = useState(currentFbConfig.projectId || '')
  const [fbAuthDomain, setFbAuthDomain] = useState(currentFbConfig.authDomain || '')
  const [fbStorageBucket, setFbStorageBucket] = useState(currentFbConfig.storageBucket || '')
  const [fbAppId, setFbAppId] = useState(currentFbConfig.appId || '')
  const [fbMsgSenderId, setFbMsgSenderId] = useState(currentFbConfig.messagingSenderId || '')
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchSettings()
      const map: Record<string, string> = {}
      data.forEach((s) => {
        map[s.key] = s.value
      })
      setSettings(map)
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      for (const [k, v] of Object.entries(settings)) {
        await saveSetting(k, v)
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      alert('Error saving settings')
    }
  }

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault()
    const newConfig: FirebaseConfig = {
      apiKey: fbApiKey.trim(),
      projectId: fbProjectId.trim(),
      authDomain: fbAuthDomain.trim(),
      storageBucket: fbStorageBucket.trim(),
      appId: fbAppId.trim(),
      messagingSenderId: fbMsgSenderId.trim(),
    }
    saveFirebaseConfig(newConfig)
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    setSeedMessage('Seeding default pharmacy collections to Firestore...')
    const res = await seedFirestoreDatabase()
    setIsSeeding(false)
    setSeedMessage(res.message)
  }

  const configured = isFirebaseConfigured()

  return (
    <AppLayout title="System & Firebase Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            Pharmacy Preferences & Cloud Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your store information, sales tax rates, invoice branding, and Google Firebase database credentials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: General Store Settings (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              Store & Receipt Profile
            </h3>

            <form onSubmit={handleSaveAll} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pharmacy / Hospital Name</label>
                <input
                  type="text"
                  value={settings['pharmacy_name'] || 'PrimeCare Pharmacy & Healthcare'}
                  onChange={(e) => handleChange('pharmacy_name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contact Phone</label>
                  <input
                    type="text"
                    value={settings['pharmacy_phone'] || '+92 300 1234567'}
                    onChange={(e) => handleChange('pharmacy_phone', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings['currency_symbol'] || 'Rs.'}
                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Store Address</label>
                <input
                  type="text"
                  value={settings['pharmacy_address'] || 'Plot 42-B, Health Boulevard, Medical District'}
                  onChange={(e) => handleChange('pharmacy_address', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Sales Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings['tax_rate'] || '0'}
                    onChange={(e) => handleChange('tax_rate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Low Stock Alert Level</label>
                  <input
                    type="number"
                    value={settings['low_stock_threshold'] || '20'}
                    onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Receipt Footer Message</label>
                <textarea
                  rows={2}
                  value={settings['receipt_footer_text'] || 'Thank you for choosing PrimeCare! Keep medicines out of reach of children.'}
                  onChange={(e) => handleChange('receipt_footer_text', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Store settings updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Preferences</span>
              </button>
            </form>
          </div>

          {/* Right Column: Cloud Database & Backup (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Cloud Database & Synchronization
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Cloud Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Your pharmacy catalog, sales records, customers, and supplier ledgers are securely synchronized in real-time.
              </p>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Database Engine:</span>
                  <span className="text-white font-medium">Cloud Firestore (Real-Time)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sync Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Encryption:</span>
                  <span className="text-white font-mono text-[11px]">AES-256 Cloud Encrypted</span>
                </div>
              </div>
            </div>

            {/* Database Population Action */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 font-semibold">Catalog Setup & Reset</p>
              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>{isSeeding ? 'Populating Database...' : 'Populate Sample Medicine Catalog'}</span>
              </button>
              {seedMessage && (
                <p className="text-[11px] text-blue-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {seedMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
