import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config'
import { loginUser, logoutUser, registerUser } from '../firebase/auth'
import { User } from '../types'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  isConfigured: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  isStaff: boolean
  isSalesman: boolean
  login: (email: string, pass: string) => Promise<User>
  register: (email: string, pass: string, fullName: string, role?: 'super_admin' | 'admin' | 'staff' | 'salesman') => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isConfigured, setIsConfigured] = useState<boolean>(false)

  useEffect(() => {
    const configured = isFirebaseConfigured()
    setIsConfigured(configured)

    const savedMock = localStorage.getItem('primecare_mock_user')
    if (savedMock) {
      try {
        setCurrentUser(JSON.parse(savedMock))
        setLoading(false)
        return
      } catch {
        setCurrentUser(null)
      }
    }

    if (!configured) {
      const defaultSuperAdmin: User = {
        id: 'super-admin-01',
        username: 'superadmin',
        email: 'superadmin@primecare.com',
        role: 'super_admin',
        fullName: 'Executive Super Administrator',
        isActive: true,
      }
      localStorage.setItem('primecare_mock_user', JSON.stringify(defaultSuperAdmin))
      setCurrentUser(defaultSuperAdmin)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
          if (userDoc.exists()) {
            setCurrentUser({ id: fbUser.uid, ...(userDoc.data() as any) } as User)
          } else {
            setCurrentUser({
              id: fbUser.uid,
              username: fbUser.email?.split('@')[0] || 'staff',
              email: fbUser.email || '',
              role: fbUser.email?.includes('superadmin') ? 'super_admin' : 'admin',
              fullName: fbUser.displayName || 'Pharmacy Administrator',
              isActive: true,
            })
          }
        } catch {
          setCurrentUser({
            id: fbUser.uid,
            username: fbUser.email?.split('@')[0] || 'staff',
            email: fbUser.email || '',
            role: 'admin',
            fullName: fbUser.displayName || 'Pharmacy Administrator',
            isActive: true,
          })
        }
      } else {
        // Fallback to local mock user if available
        const localUser = localStorage.getItem('primecare_mock_user')
        if (localUser) {
          try {
            setCurrentUser(JSON.parse(localUser))
          } catch {
            setCurrentUser(null)
          }
        } else {
          setCurrentUser(null)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = async (email: string, pass: string) => {
    const user = await loginUser(email, pass)
    setCurrentUser(user)
    return user
  }

  const handleRegister = async (
    email: string,
    pass: string,
    fullName: string,
    role: 'super_admin' | 'admin' | 'staff' | 'salesman' = 'admin'
  ) => {
    const user = await registerUser(email, pass, fullName, role)
    setCurrentUser(user)
    return user
  }

  const handleLogout = async () => {
    await logoutUser()
    setCurrentUser(null)
  }

  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin
  const isStaff = currentUser?.role === 'staff'
  const isSalesman = currentUser?.role === 'salesman'

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isConfigured,
        isSuperAdmin,
        isAdmin,
        isStaff,
        isSalesman,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
