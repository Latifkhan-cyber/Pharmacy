import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Setting } from '../types'
import { INITIAL_SETTINGS } from './seedService'

const LOCAL_STORAGE_SETTINGS = 'primecare_settings'

export const fetchSettings = async (): Promise<Setting[]> => {
  if (!isFirebaseConfigured()) {
    const data = localStorage.getItem(LOCAL_STORAGE_SETTINGS)
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(INITIAL_SETTINGS))
      return INITIAL_SETTINGS
    }
    return JSON.parse(data)
  }

  try {
    const colRef = collection(db, 'settings')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) {
      const data = localStorage.getItem(LOCAL_STORAGE_SETTINGS)
      if (!data) {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(INITIAL_SETTINGS))
        return INITIAL_SETTINGS
      }
      return JSON.parse(data)
    }
    const list: Setting[] = []
    snapshot.forEach((d) => list.push({ key: d.id, ...(d.data() as any) }))
    return list
  } catch {
    const data = localStorage.getItem(LOCAL_STORAGE_SETTINGS)
    return data ? JSON.parse(data) : INITIAL_SETTINGS
  }
}

export const saveSetting = async (key: string, value: string, description?: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const settings = await fetchSettings()
    const idx = settings.findIndex((s) => s.key === key)
    if (idx !== -1) {
      settings[idx].value = value
      if (description) settings[idx].description = description
    } else {
      settings.push({ key, value, description })
    }
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings))
    return
  }

  try {
    const docRef = doc(db, 'settings', key)
    await setDoc(docRef, { key, value, description: description || '' })
  } catch {
    const settings = await fetchSettings()
    const idx = settings.findIndex((s) => s.key === key)
    if (idx !== -1) {
      settings[idx].value = value
    } else {
      settings.push({ key, value, description })
    }
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings))
  }
}
