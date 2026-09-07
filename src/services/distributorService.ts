import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Distributor, DistributorSale, DistributorExpense } from '../types'
import { INITIAL_DISTRIBUTORS } from './seedService'

const LOCAL_STORAGE_DISTRIBUTORS = 'primecare_distributors'
const LOCAL_STORAGE_DIST_SALES = 'primecare_dist_sales'
const LOCAL_STORAGE_DIST_EXP = 'primecare_dist_exp'

const getLocalDistributors = (): Distributor[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_DISTRIBUTORS)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_DISTRIBUTORS, JSON.stringify(INITIAL_DISTRIBUTORS))
    return INITIAL_DISTRIBUTORS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_DISTRIBUTORS
  }
}

const saveLocalDistributors = (dists: Distributor[]) => {
  localStorage.setItem(LOCAL_STORAGE_DISTRIBUTORS, JSON.stringify(dists))
}

export const fetchDistributors = async (): Promise<Distributor[]> => {
  if (!isFirebaseConfigured()) return getLocalDistributors()

  try {
    const colRef = collection(db, 'distributors')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) return getLocalDistributors()
    const list: Distributor[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list
  } catch {
    return getLocalDistributors()
  }
}

export const createDistributor = async (distributor: Omit<Distributor, 'id'>): Promise<Distributor> => {
  if (!isFirebaseConfigured()) {
    const dists = getLocalDistributors()
    const newDist: Distributor = {
      ...distributor,
      id: 'dist-' + Date.now(),
      totalSales: distributor.totalSales || 0,
      totalExpenses: distributor.totalExpenses || 0,
      totalProfit: distributor.totalProfit || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    dists.unshift(newDist)
    saveLocalDistributors(dists)
    return newDist
  }

  try {
    const colRef = collection(db, 'distributors')
    const docRef = await addDoc(colRef, {
      ...distributor,
      createdAt: new Date().toISOString(),
    })
    return { id: docRef.id, ...distributor }
  } catch {
    const dists = getLocalDistributors()
    const newDist: Distributor = { ...distributor, id: 'dist-' + Date.now() }
    dists.unshift(newDist)
    saveLocalDistributors(dists)
    return newDist
  }
}

export const updateDistributor = async (id: string, updates: Partial<Distributor>): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const dists = getLocalDistributors()
    const idx = dists.findIndex((d) => d.id === id)
    if (idx !== -1) {
      dists[idx] = { ...dists[idx], ...updates }
      saveLocalDistributors(dists)
    }
    return
  }

  try {
    const docRef = doc(db, 'distributors', id)
    await updateDoc(docRef, updates)
  } catch {
    const dists = getLocalDistributors()
    const idx = dists.findIndex((d) => d.id === id)
    if (idx !== -1) {
      dists[idx] = { ...dists[idx], ...updates }
      saveLocalDistributors(dists)
    }
  }
}

export const deleteDistributor = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const dists = getLocalDistributors().filter((d) => d.id !== id)
    saveLocalDistributors(dists)
    return
  }

  try {
    const docRef = doc(db, 'distributors', id)
    await deleteDoc(docRef)
  } catch {
    const dists = getLocalDistributors().filter((d) => d.id !== id)
    saveLocalDistributors(dists)
  }
}
