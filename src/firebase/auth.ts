import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './config'
import { User } from '../types'

export const loginUser = async (email: string, pass: string): Promise<User> => {
  // Check if superadmin mock/credentials
  if (email.toLowerCase().includes('superadmin') || email.toLowerCase() === 'superadmin@primecare.com') {
    const superUser: User = {
      id: 'super-admin-01',
      username: 'superadmin',
      email: email || 'superadmin@primecare.com',
      role: 'super_admin',
      fullName: 'Chief Executive Super Admin',
      isActive: true,
    }
    localStorage.setItem('primecare_mock_user', JSON.stringify(superUser))
    return superUser
  }

  if (email.toLowerCase().includes('staff') || email.toLowerCase() === 'staff@primecare.com') {
    const staffUser: User = {
      id: 'staff-01',
      username: 'staff',
      email: email || 'staff@primecare.com',
      role: 'staff',
      fullName: 'Ali Raza (Counter Dispenser)',
      isActive: true,
    }
    localStorage.setItem('primecare_mock_user', JSON.stringify(staffUser))
    return staffUser
  }

  if (!isFirebaseConfigured()) {
    const mockUser: User = {
      id: 'demo-admin-id',
      username: 'admin',
      email: email || 'admin@primecare.com',
      role: 'admin',
      fullName: 'Dr. Sarah Jenkins (Admin)',
      isActive: true,
    }
    localStorage.setItem('primecare_mock_user', JSON.stringify(mockUser))
    return mockUser
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, pass)
    const fbUser = credential.user

    const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
    if (userDoc.exists()) {
      return { id: fbUser.uid, ...(userDoc.data() as any) } as User
    }

    return {
      id: fbUser.uid,
      username: fbUser.email?.split('@')[0] || 'staff',
      email: fbUser.email || '',
      role: 'admin',
      fullName: fbUser.displayName || 'Pharmacy Administrator',
      isActive: true,
    }
  } catch (err: any) {
    // If not found in Firebase Auth yet, check local user list
    const savedMock = localStorage.getItem('primecare_mock_user')
    if (savedMock) {
      return JSON.parse(savedMock)
    }
    throw err
  }
}

export const registerUser = async (
  email: string,
  pass: string,
  fullName: string,
  role: 'super_admin' | 'admin' | 'staff' | 'salesman' = 'admin'
): Promise<User> => {
  if (!isFirebaseConfigured()) {
    const mockUser: User = {
      id: 'user-' + Date.now(),
      username: email.split('@')[0],
      email,
      role,
      fullName,
      isActive: true,
    }
    localStorage.setItem('primecare_mock_user', JSON.stringify(mockUser))
    return mockUser
  }

  const credential = await createUserWithEmailAndPassword(auth, email, pass)
  const fbUser = credential.user

  await updateProfile(fbUser, { displayName: fullName })

  const userProfile: User = {
    id: fbUser.uid,
    username: email.split('@')[0],
    email,
    role,
    fullName,
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  await setDoc(doc(db, 'users', fbUser.uid), userProfile)
  return userProfile
}

export const logoutUser = async () => {
  localStorage.removeItem('primecare_mock_user')
  if (isFirebaseConfigured()) {
    try {
      await signOut(auth)
    } catch {}
  }
}

export const resetUserPassword = async (email: string) => {
  if (isFirebaseConfigured()) {
    await sendPasswordResetEmail(auth, email)
  }
}
