import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Medicine, MedicineBatch } from '../types'
import { INITIAL_MEDICINES } from './seedService'

const LOCAL_STORAGE_MEDS = 'primecare_medicines'

const getLocalMedicines = (): Medicine[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_MEDS)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_MEDS, JSON.stringify(INITIAL_MEDICINES))
    return INITIAL_MEDICINES
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_MEDICINES
  }
}

const saveLocalMedicines = (meds: Medicine[]) => {
  localStorage.setItem(LOCAL_STORAGE_MEDS, JSON.stringify(meds))
}

export const fetchMedicines = async (): Promise<Medicine[]> => {
  if (!isFirebaseConfigured()) {
    return getLocalMedicines()
  }

  try {
    const colRef = collection(db, 'medicines')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) {
      // If Firestore collection is empty, return initial fallback
      return getLocalMedicines()
    }
    const list: Medicine[] = []
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) })
    })
    return list
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to local data:', err)
    return getLocalMedicines()
  }
}

export const createMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  if (!isFirebaseConfigured()) {
    const meds = getLocalMedicines()
    const newMed: Medicine = {
      ...medicine,
      id: 'med-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    meds.unshift(newMed)
    saveLocalMedicines(meds)
    return newMed
  }

  try {
    const colRef = collection(db, 'medicines')
    const docRef = await addDoc(colRef, {
      ...medicine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return { id: docRef.id, ...medicine }
  } catch (err) {
    console.error('Firestore create failed, saving locally:', err)
    const meds = getLocalMedicines()
    const newMed: Medicine = { ...medicine, id: 'med-' + Date.now() }
    meds.unshift(newMed)
    saveLocalMedicines(meds)
    return newMed
  }
}

export const updateMedicine = async (id: string, updates: Partial<Medicine>): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const meds = getLocalMedicines()
    const idx = meds.findIndex((m) => m.id === id)
    if (idx !== -1) {
      meds[idx] = { ...meds[idx], ...updates, updatedAt: new Date().toISOString() }
      saveLocalMedicines(meds)
    }
    return
  }

  try {
    const docRef = doc(db, 'medicines', id)
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.warn('Firestore update failed, updating locally:', err)
    const meds = getLocalMedicines()
    const idx = meds.findIndex((m) => m.id === id)
    if (idx !== -1) {
      meds[idx] = { ...meds[idx], ...updates }
      saveLocalMedicines(meds)
    }
  }
}

export const deleteMedicine = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const meds = getLocalMedicines().filter((m) => m.id !== id)
    saveLocalMedicines(meds)
    return
  }

  try {
    const docRef = doc(db, 'medicines', id)
    await deleteDoc(docRef)
  } catch (err) {
    const meds = getLocalMedicines().filter((m) => m.id !== id)
    saveLocalMedicines(meds)
  }
}

export const addBatchToMedicine = async (medicineId: string, batch: Omit<MedicineBatch, 'id' | 'medicineId'>): Promise<MedicineBatch> => {
  const newBatch: MedicineBatch = {
    id: 'batch-' + Date.now(),
    medicineId,
    ...batch,
    createdAt: new Date().toISOString(),
  }

  const meds = await fetchMedicines()
  const med = meds.find((m) => m.id === medicineId)
  if (med) {
    const existingBatches = med.batches || []
    const updatedBatches = [...existingBatches, newBatch]
    await updateMedicine(medicineId, { batches: updatedBatches })
  }

  return newBatch
}

export const updateBatchStock = async (medicineId: string, batchId: string, quantityDeducted: number): Promise<void> => {
  const meds = await fetchMedicines()
  const med = meds.find((m) => m.id === medicineId)
  if (med && med.batches) {
    const updatedBatches = med.batches.map((b) => {
      if (b.id === batchId) {
        return { ...b, quantity: Math.max(0, Number(b.quantity) - quantityDeducted) }
      }
      return b
    })
    await updateMedicine(medicineId, { batches: updatedBatches })
  }
}
