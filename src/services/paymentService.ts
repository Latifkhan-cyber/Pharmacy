import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Payment } from '../types'
import { fetchCustomers, updateCustomer } from './customerService'
import { fetchSuppliers, updateSupplier } from './supplierService'

const LOCAL_STORAGE_PAYMENTS = 'primecare_payments'

export const fetchPayments = async (): Promise<Payment[]> => {
  if (!isFirebaseConfigured()) {
    const data = localStorage.getItem(LOCAL_STORAGE_PAYMENTS)
    return data ? JSON.parse(data) : []
  }

  try {
    const colRef = collection(db, 'payments')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) {
      const data = localStorage.getItem(LOCAL_STORAGE_PAYMENTS)
      return data ? JSON.parse(data) : []
    }
    const list: Payment[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  } catch {
    const data = localStorage.getItem(LOCAL_STORAGE_PAYMENTS)
    return data ? JSON.parse(data) : []
  }
}

export const createPayment = async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
  const newPayment: Payment = {
    ...payment,
    id: 'pay-' + Date.now(),
    createdAt: new Date().toISOString(),
  }

  // 1. Adjust customer or supplier ledger
  if (payment.paymentType === 'customer' && payment.customerId) {
    try {
      const customers = await fetchCustomers()
      const cust = customers.find((c) => c.id === payment.customerId)
      if (cust) {
        await updateCustomer(cust.id, {
          totalPaid: Number(cust.totalPaid || 0) + Number(payment.amount),
          dueAmount: Math.max(0, Number(cust.dueAmount || 0) - Number(payment.amount)),
        })
      }
    } catch (err) {
      console.error('Error updating customer payment ledger:', err)
    }
  } else if (payment.paymentType === 'supplier' && payment.supplierId) {
    try {
      const suppliers = await fetchSuppliers()
      const sup = suppliers.find((s) => s.id === payment.supplierId)
      if (sup) {
        await updateSupplier(sup.id, {
          totalPaid: Number(sup.totalPaid || 0) + Number(payment.amount),
          dueAmount: Math.max(0, Number(sup.dueAmount || 0) - Number(payment.amount)),
        })
      }
    } catch (err) {
      console.error('Error updating supplier payment ledger:', err)
    }
  }

  // 2. Save Payment record
  if (!isFirebaseConfigured()) {
    const payments = await fetchPayments()
    payments.unshift(newPayment)
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS, JSON.stringify(payments))
    return newPayment
  }

  try {
    const colRef = collection(db, 'payments')
    const docRef = await addDoc(colRef, newPayment)
    return { ...newPayment, id: docRef.id }
  } catch {
    const payments = await fetchPayments()
    payments.unshift(newPayment)
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS, JSON.stringify(payments))
    return newPayment
  }
}
