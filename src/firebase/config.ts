import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

const LOCAL_STORAGE_KEY = 'primecare_firebase_config'

// User's provided Firebase configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyA2Nwmgq4SRhnYPkN3O7ijtvl-B2VUmTRk",
  authDomain: "pharmacy-5999e.firebaseapp.com",
  projectId: "pharmacy-5999e",
  storageBucket: "pharmacy-5999e.firebasestorage.app",
  messagingSenderId: "779050579232",
  appId: "1:779050579232:web:b4beb947af701d936f9345",
  measurementId: "G-HG15NPJJ62"
}

export const getSavedFirebaseConfig = (): FirebaseConfig => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Could not parse saved Firebase config from localStorage', e)
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
  }
}

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config))
  window.location.reload()
}

export const isFirebaseConfigured = (): boolean => {
  const cfg = getSavedFirebaseConfig()
  return Boolean(cfg.apiKey && cfg.projectId && cfg.apiKey !== 'YOUR_API_KEY')
}

const activeConfig = getSavedFirebaseConfig()
const app = !getApps().length ? initializeApp(activeConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
