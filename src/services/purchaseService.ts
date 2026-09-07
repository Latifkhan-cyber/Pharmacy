import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Purchase, PurchaseItem } from '../types'
import { fetchMedicines, updateMedicine } from './medicineService'
import { fetchSuppliers, updateSupplier } from './supplierService'

const LOCAL_STORAGE_PURCHASES = 'primecare_purchases'

export const fetchPurchases = async (): Promise<Purchase[]> => {
  if (!isFirebaseConfigured()) {
    const data = localStorage.getItem(LOCAL_STORAGE_PURCHASES)
    return data ? JSON.parse(data) : []
  }

  try {
    const colRef = collection(db, 'purchases')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) {
      const data = localStorage.getItem(LOCAL_STORAGE_PURCHASES)
      return data ? JSON.parse(data) : []
    }
    const list: Purchase[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
  } catch {
    const data = localStorage.getItem(LOCAL_STORAGE_PURCHASES)
    return data ? JSON.parse(data) : []
  }
}

export const createPurchase = async (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber'>): Promise<Purchase> => {
  const invoiceNumber = 'PO-' + Date.now().toString().slice(-6)
  const fullPurchase: Purchase = {
    ...purchaseData,
    id: 'pur-' + Date.now(),
    invoiceNumber,
    createdAt: new Date().toISOString(),
  }

  // 1. Add Stock to Medicines & Batches
  try {
    const medicines = await fetchMedicines()
    if (purchaseData.items) {
      for (const item of purchaseData.items) {
        const med = medicines.find((m) => m.id === item.medicineId)
        if (med) {
          const batches = med.batches || []
          const existingBatchIdx = batches.findIndex((b) => b.batchNumber === item.batchNumber)
          if (existingBatchIdx > -1) {
            batches[existingBatchIdx].quantity = Number(batches[existingBatchIdx].quantity) + Number(item.quantity)
            batches[existingBatchIdx].purchasePrice = item.purchasePrice
            batches[existingBatchIdx].salePrice = item.salePrice
            batches[existingBatchIdx].mrp = item.mrp
            batches[existingBatchIdx].expiryDate = item.expiryDate
          } else {
            batches.push({
              id: 'b-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              medicineId: med.id,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantity: Number(item.quantity),
              purchasePrice: item.purchasePrice,
              salePrice: item.salePrice,
              mrp: item.mrp,
              supplierId: purchaseData.supplierId,
            })
          }
          await updateMedicine(med.id, { batches })
        }
      }
    }
  } catch (err) {
    console.error('Error adding stock on purchase:', err)
  }

  // 2. Update Supplier Dues and Total Purchases
  if (purchaseData.supplierId) {
    try {
      const suppliers = await fetchSuppliers()
      const supplier = suppliers.find((s) => s.id === purchaseData.supplierId)
      if (supplier) {
        await updateSupplier(supplier.id, {
          totalPurchase: Number(supplier.totalPurchase || 0) + Number(purchaseData.totalAmount),
          totalPaid: Number(supplier.totalPaid || 0) + Number(purchaseData.paidAmount),
          dueAmount: Number(supplier.dueAmount || 0) + Number(purchaseData.dueAmount),
        })
      }
    } catch (err) {
      console.error('Error updating supplier balance:', err)
    }
  }

  // 3. Save Purchase Record
  if (!isFirebaseConfigured()) {
    const current = await fetchPurchases()
    current.unshift(fullPurchase)
    localStorage.setItem(LOCAL_STORAGE_PURCHASES, JSON.stringify(current))
    return fullPurchase
  }

  try {
    const colRef = collection(db, 'purchases')
    const docRef = await addDoc(colRef, fullPurchase)
    return { ...fullPurchase, id: docRef.id }
  } catch {
    const current = await fetchPurchases()
    current.unshift(fullPurchase)
    localStorage.setItem(LOCAL_STORAGE_PURCHASES, JSON.stringify(current))
    return fullPurchase
  }
}
