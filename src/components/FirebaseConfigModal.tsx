import React, { useState } from 'react'
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfig,
} from '../firebase/config'
import { seedFirestoreDatabase } from '../services/seedService'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const FirebaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const currentConfig = getSavedFirebaseConfig()
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '')
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '')
  const [projectId, setProjectId] = useState(currentConfig.projectId || '')
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '')
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '')
  const [appId, setAppId] = useState(currentConfig.appId || '')
  const [rawJson, setRawJson] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSeeding, setIsSeeding] = useState(false)

  if (!isOpen) return null

  const handleParseJson = () => {
    try {
      // Clean up common JS object copy-pastes (e.g. apiKey: "...")
      let cleaned = rawJson.trim()
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').replace(/;$/, '').trim()
      }
      // If keys aren't quoted, quote them
      cleaned = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
      // Replace single quotes with double quotes
      cleaned = cleaned.replace(/'/g, '"')

      const parsed = JSON.parse(cleaned)
      if (parsed.apiKey) setApiKey(parsed.apiKey)
      if (parsed.authDomain) setAuthDomain(parsed.authDomain)
      if (parsed.projectId) setProjectId(parsed.projectId)
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket)
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId)
      if (parsed.appId) setAppId(parsed.appId)
      setStatusMessage('✅ Firebase config extracted successfully!')
    } catch (e: any) {
      setStatusMessage('❌ Could not parse JSON. Please enter fields manually.')
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const newConfig: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    }
    saveFirebaseConfig(newConfig)
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    setStatusMessage('Seeding Firestore collections...')
    const res = await seedFirestoreDatabase()
    setIsSeeding(false)
    setStatusMessage(res.success ? `✅ ${res.message}` : `❌ ${res.message}`)
  }

  const configured = isFirebaseConfigured()

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full text-white space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-bold text-lg text-white">Firebase Project Configuration</h3>
              <p className="text-xs text-slate-400">
                Connect your Google Firebase Auth & Cloud Firestore database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Status indicator */}
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            configured
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>
              {configured
                ? `Firebase Project Connected: "${currentConfig.projectId}"`
                : 'Running in Local Mode (Enter your Firebase credentials below)'}
            </span>
          </div>
        </div>

        {/* Firestore Quick Checklist */}
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2 text-blue-200">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>ℹ️</span> 2-Step Firestore Activation in Firebase Console:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
            <li>
              Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">Firebase Console</a> &gt; Select Project <strong className="text-white">pharmacy-5999e</strong>
            </li>
            <li>
              Click <strong className="text-white">Firestore Database</strong> &gt; Click <strong className="text-white">Create database</strong> (choose "Start in test mode").
            </li>
            <li>
              In the <strong className="text-white">Rules</strong> tab, ensure: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">allow read, write: if true;</code>
            </li>
          </ol>
        </div>

        {/* Quick Paste JSON option */}
        <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <label className="block text-xs font-semibold text-slate-300">
            Paste Firebase Config Object (Quick Setup)
          </label>
          <textarea
            rows={3}
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder={`{\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app"\n}`}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleParseJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-bold rounded-lg transition-all"
          >
            Auto-Fill Fields from JSON
          </button>
        </div>

        {/* Manual Config Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">API Key *</label>
              <input
                type="text"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Project ID *</label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-pharmacy-app"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="my-pharmacy.firebaseapp.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Storage Bucket</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="my-pharmacy.appspot.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Messaging Sender ID</label>
              <input
                type="text"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                placeholder="123456789012"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {statusMessage && (
            <p className="text-xs font-semibold py-1 px-2 rounded bg-slate-800 text-blue-300">
              {statusMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSeed}
              disabled={!configured || isSeeding}
              className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
            >
              {isSeeding ? '🌱 Seeding...' : '🌱 Seed Database with Sample Data'}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
