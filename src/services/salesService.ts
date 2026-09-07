import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Sale } from '../types'
import { fetchMedicines, updateMedicine } from './medicineService'
import { fetchCustomers, updateCustomer } from './customerService'

const LOCAL_STORAGE_SALES = 'primecare_sales'

export const fetchSales = async (): Promise<Sale[]> => {
  if (!isFirebaseConfigured()) {
    const data = localStorage.getItem(LOCAL_STORAGE_SALES)
    return data ? JSON.parse(data) : []
  }

  try {
    const colRef = collection(db, 'sales')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) {
      const data = localStorage.getItem(LOCAL_STORAGE_SALES)
      return data ? JSON.parse(data) : []
    }
    const list: Sale[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
  } catch {
    const data = localStorage.getItem(LOCAL_STORAGE_SALES)
    return data ? JSON.parse(data) : []
  }
}

export const createSale = async (saleData: Omit<Sale, 'id' | 'invoiceNumber'>): Promise<Sale> => {
  const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)
  const fullSale: Sale = {
    ...saleData,
    id: 'sale-' + Date.now(),
    invoiceNumber,
    createdAt: new Date().toISOString(),
  }

  // 1. Deduct Stock from Medicines
  try {
    const medicines = await fetchMedicines()
    for (const item of saleData.items) {
      const med = medicines.find((m) => m.id === item.medicineId)
      if (med && med.batches) {
        let remainingToDeduct = item.quantity
        const updatedBatches = med.batches.map((b) => {
          if (remainingToDeduct <= 0) return b
          if (!item.batchNumber || b.batchNumber === item.batchNumber) {
            const deduct = Math.min(Number(b.quantity), remainingToDeduct)
            remainingToDeduct -= deduct
            return { ...b, quantity: Math.max(0, Number(b.quantity) - deduct) }
          }
          return b
        })
        await updateMedicine(med.id, { batches: updatedBatches })
      }
    }
  } catch (err) {
    console.error('Error deducting stock on sale:', err)
  }

  // 2. Update Customer Dues and Total Purchases if applicable
  if (saleData.customerId) {
    try {
      const customers = await fetchCustomers()
      const customer = customers.find((c) => c.id === saleData.customerId)
      if (customer) {
        await updateCustomer(customer.id, {
          totalSales: Number(customer.totalSales || 0) + Number(saleData.totalAmount),
          totalPaid: Number(customer.totalPaid || 0) + Number(saleData.paidAmount),
          dueAmount: Number(customer.dueAmount || 0) + Number(saleData.dueAmount),
          loyaltyPoints: Number(customer.loyaltyPoints || 0) + Math.floor(Number(saleData.totalAmount) / 100),
        })
      }
    } catch (err) {
      console.error('Error updating customer balance:', err)
    }
  }

  // 3. Save Sale Record (Firestore or LocalStorage)
  if (!isFirebaseConfigured()) {
    const currentSales = await fetchSales()
    currentSales.unshift(fullSale)
    localStorage.setItem(LOCAL_STORAGE_SALES, JSON.stringify(currentSales))
    return fullSale
  }

  try {
    const colRef = collection(db, 'sales')
    const docRef = await addDoc(colRef, fullSale)
    return { ...fullSale, id: docRef.id }
  } catch (err) {
    console.error('Firestore sale write failed, saving locally:', err)
    const currentSales = await fetchSales()
    currentSales.unshift(fullSale)
    localStorage.setItem(LOCAL_STORAGE_SALES, JSON.stringify(currentSales))
    return fullSale
  }
}
