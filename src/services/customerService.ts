import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Customer } from '../types'
import { INITIAL_CUSTOMERS } from './seedService'

const LOCAL_STORAGE_CUSTOMERS = 'primecare_customers'

const getLocalCustomers = (): Customer[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS))
    return INITIAL_CUSTOMERS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_CUSTOMERS
  }
}

const saveLocalCustomers = (custs: Customer[]) => {
  localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(custs))
}

export const fetchCustomers = async (): Promise<Customer[]> => {
  if (!isFirebaseConfigured()) {
    return getLocalCustomers()
  }

  try {
    const colRef = collection(db, 'customers')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) return getLocalCustomers()
    const list: Customer[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list
  } catch (err) {
    return getLocalCustomers()
  }
}

export const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
  if (!isFirebaseConfigured()) {
    const custs = getLocalCustomers()
    const newCust: Customer = {
      ...customer,
      id: 'cust-' + Date.now(),
      totalSales: customer.totalSales || 0,
      totalPaid: customer.totalPaid || 0,
      dueAmount: customer.dueAmount || 0,
      loyaltyPoints: customer.loyaltyPoints || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    custs.unshift(newCust)
    saveLocalCustomers(custs)
    return newCust
  }

  try {
    const colRef = collection(db, 'customers')
    const docRef = await addDoc(colRef, {
      ...customer,
      createdAt: new Date().toISOString(),
    })
    return { id: docRef.id, ...customer }
  } catch {
    const custs = getLocalCustomers()
    const newCust: Customer = { ...customer, id: 'cust-' + Date.now() }
    custs.unshift(newCust)
    saveLocalCustomers(custs)
    return newCust
  }
}

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const custs = getLocalCustomers()
    const idx = custs.findIndex((c) => c.id === id)
    if (idx !== -1) {
      custs[idx] = { ...custs[idx], ...updates }
      saveLocalCustomers(custs)
    }
    return
  }

  try {
    const docRef = doc(db, 'customers', id)
    await updateDoc(docRef, updates)
  } catch {
    const custs = getLocalCustomers()
    const idx = custs.findIndex((c) => c.id === id)
    if (idx !== -1) {
      custs[idx] = { ...custs[idx], ...updates }
      saveLocalCustomers(custs)
    }
  }
}

export const deleteCustomer = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const custs = getLocalCustomers().filter((c) => c.id !== id)
    saveLocalCustomers(custs)
    return
  }

  try {
    const docRef = doc(db, 'customers', id)
    await deleteDoc(docRef)
  } catch {
    const custs = getLocalCustomers().filter((c) => c.id !== id)
    saveLocalCustomers(custs)
  }
}
