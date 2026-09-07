import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Supplier } from '../types'
import { INITIAL_SUPPLIERS } from './seedService'

const LOCAL_STORAGE_SUPPLIERS = 'primecare_suppliers'

const getLocalSuppliers = (): Supplier[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_SUPPLIERS)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS))
    return INITIAL_SUPPLIERS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_SUPPLIERS
  }
}

const saveLocalSuppliers = (sups: Supplier[]) => {
  localStorage.setItem(LOCAL_STORAGE_SUPPLIERS, JSON.stringify(sups))
}

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  if (!isFirebaseConfigured()) return getLocalSuppliers()

  try {
    const colRef = collection(db, 'suppliers')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) return getLocalSuppliers()
    const list: Supplier[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list
  } catch {
    return getLocalSuppliers()
  }
}

export const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  if (!isFirebaseConfigured()) {
    const sups = getLocalSuppliers()
    const newSup: Supplier = {
      ...supplier,
      id: 'sup-' + Date.now(),
      totalPurchase: supplier.totalPurchase || 0,
      totalPaid: supplier.totalPaid || 0,
      dueAmount: supplier.dueAmount || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    sups.unshift(newSup)
    saveLocalSuppliers(sups)
    return newSup
  }

  try {
    const colRef = collection(db, 'suppliers')
    const docRef = await addDoc(colRef, {
      ...supplier,
      createdAt: new Date().toISOString(),
    })
    return { id: docRef.id, ...supplier }
  } catch {
    const sups = getLocalSuppliers()
    const newSup: Supplier = { ...supplier, id: 'sup-' + Date.now() }
    sups.unshift(newSup)
    saveLocalSuppliers(sups)
    return newSup
  }
}

export const updateSupplier = async (id: string, updates: Partial<Supplier>): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const sups = getLocalSuppliers()
    const idx = sups.findIndex((s) => s.id === id)
    if (idx !== -1) {
      sups[idx] = { ...sups[idx], ...updates }
      saveLocalSuppliers(sups)
    }
    return
  }

  try {
    const docRef = doc(db, 'suppliers', id)
    await updateDoc(docRef, updates)
  } catch {
    const sups = getLocalSuppliers()
    const idx = sups.findIndex((s) => s.id === id)
    if (idx !== -1) {
      sups[idx] = { ...sups[idx], ...updates }
      saveLocalSuppliers(sups)
    }
  }
}

export const deleteSupplier = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const sups = getLocalSuppliers().filter((s) => s.id !== id)
    saveLocalSuppliers(sups)
    return
  }

  try {
    const docRef = doc(db, 'suppliers', id)
    await deleteDoc(docRef)
  } catch {
    const sups = getLocalSuppliers().filter((s) => s.id !== id)
    saveLocalSuppliers(sups)
  }
}
