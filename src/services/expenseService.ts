import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Expense } from '../types'
import { INITIAL_EXPENSES } from './seedService'

const LOCAL_STORAGE_EXPENSES = 'primecare_expenses'

const getLocalExpenses = (): Expense[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_EXPENSES)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_EXPENSES, JSON.stringify(INITIAL_EXPENSES))
    return INITIAL_EXPENSES
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_EXPENSES
  }
}

const saveLocalExpenses = (expenses: Expense[]) => {
  localStorage.setItem(LOCAL_STORAGE_EXPENSES, JSON.stringify(expenses))
}

export const fetchExpenses = async (): Promise<Expense[]> => {
  if (!isFirebaseConfigured()) return getLocalExpenses()

  try {
    const colRef = collection(db, 'expenses')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) return getLocalExpenses()
    const list: Expense[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
  } catch {
    return getLocalExpenses()
  }
}

export const createExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  if (!isFirebaseConfigured()) {
    const expenses = getLocalExpenses()
    const newExp: Expense = {
      ...expense,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
    }
    expenses.unshift(newExp)
    saveLocalExpenses(expenses)
    return newExp
  }

  try {
    const colRef = collection(db, 'expenses')
    const docRef = await addDoc(colRef, {
      ...expense,
      createdAt: new Date().toISOString(),
    })
    return { id: docRef.id, ...expense }
  } catch {
    const expenses = getLocalExpenses()
    const newExp: Expense = { ...expense, id: 'exp-' + Date.now() }
    expenses.unshift(newExp)
    saveLocalExpenses(expenses)
    return newExp
  }
}

export const deleteExpense = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const expenses = getLocalExpenses().filter((e) => e.id !== id)
    saveLocalExpenses(expenses)
    return
  }

  try {
    const docRef = doc(db, 'expenses', id)
    await deleteDoc(docRef)
  } catch {
    const expenses = getLocalExpenses().filter((e) => e.id !== id)
    saveLocalExpenses(expenses)
  }
}
