import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { User } from '../types'

const LOCAL_STORAGE_USERS = 'primecare_users'

export const INITIAL_USERS: User[] = [
  {
    id: 'user-super-01',
    username: 'superadmin',
    email: 'superadmin@primecare.com',
    role: 'super_admin',
    fullName: 'Executive Super Administrator',
    phone: '+92 300 0000001',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin-01',
    username: 'admin',
    email: 'admin@primecare.com',
    role: 'admin',
    fullName: 'Dr. Sarah Jenkins (Pharmacy Manager)',
    phone: '+92 300 1234567',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-staff-01',
    username: 'dispenser1',
    email: 'staff@primecare.com',
    role: 'staff',
    fullName: 'Ali Raza (Counter Dispenser)',
    phone: '+92 321 4455667',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-sales-01',
    username: 'salesman1',
    email: 'sales@primecare.com',
    role: 'salesman',
    fullName: 'Usman Ghani (Sales Representative)',
    phone: '+92 333 9988776',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

const getLocalUsers = (): User[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_USERS)
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(INITIAL_USERS))
    return INITIAL_USERS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_USERS
  }
}

const saveLocalUsers = (users: User[]) => {
  localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(users))
}

export const fetchUsers = async (): Promise<User[]> => {
  if (!isFirebaseConfigured()) return getLocalUsers()

  try {
    const colRef = collection(db, 'users')
    const snapshot = await getDocs(colRef)
    if (snapshot.empty) return getLocalUsers()
    const list: User[] = []
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }))
    return list
  } catch {
    return getLocalUsers()
  }
}

export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  const newUser: User = {
    ...userData,
    id: 'user-' + Date.now(),
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  if (!isFirebaseConfigured()) {
    const users = getLocalUsers()
    users.push(newUser)
    saveLocalUsers(users)
    return newUser
  }

  try {
    const docRef = doc(db, 'users', newUser.id)
    await setDoc(docRef, newUser)
    return newUser
  } catch {
    const users = getLocalUsers()
    users.push(newUser)
    saveLocalUsers(users)
    return newUser
  }
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const users = getLocalUsers()
    const idx = users.findIndex((u) => u.id === id)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates }
      saveLocalUsers(users)
    }
    return
  }

  try {
    const docRef = doc(db, 'users', id)
    await updateDoc(docRef, updates)
  } catch {
    const users = getLocalUsers()
    const idx = users.findIndex((u) => u.id === id)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates }
      saveLocalUsers(users)
    }
  }
}

export const deleteUser = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) {
    const users = getLocalUsers().filter((u) => u.id !== id)
    saveLocalUsers(users)
    return
  }

  try {
    const docRef = doc(db, 'users', id)
    await deleteDoc(docRef)
  } catch {
    const users = getLocalUsers().filter((u) => u.id !== id)
    saveLocalUsers(users)
  }
}
