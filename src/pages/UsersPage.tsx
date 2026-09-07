import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  RefreshCw,
  Crown,
  UserCheck,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import { User } from '../types'

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentUser, isSuperAdmin } = useAuth()

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'super_admin' | 'admin' | 'staff' | 'salesman'>('staff')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenModal = (u?: User) => {
    if (u) {
      setEditingUser(u)
      setFullName(u.fullName)
      setEmail(u.email)
      setPhone(u.phone || '')
      setRole(u.role)
      setIsActive(u.isActive !== false)
    } else {
      setEditingUser(null)
      setFullName('')
      setEmail('')
      setPhone('')
      setRole('staff')
      setIsActive(true)
    }
    setShowModal(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    setSaving(true)
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          isActive,
        })
      } else {
        await createUser({
          username: email.split('@')[0],
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          isActive,
        })
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      alert('Error saving staff user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own active account.')
      return
    }
    if (!confirm(`Delete user "${name}"?`)) return
    await deleteUser(id)
    loadData()
  }

  const filtered = users.filter((u) => {
    return (
      !searchQuery.trim() ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Crown className="w-3 h-3 text-purple-400" /> Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" /> Pharmacy Admin
          </span>
        )
      case 'staff':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-400" /> Counter Staff
          </span>
        )
      case 'salesman':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <UserIcon className="w-3 h-3 text-amber-400" /> Sales Rep
          </span>
        )
      default:
        return <span className="text-slate-400">{r}</span>
    }
  }

  return (
    <AppLayout title="Staff & User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              Staff Accounts & Access Roles
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage system permissions, Super Admin privileges, and counter staff access
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Account</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by staff name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Staff Member</th>
                  <th className="py-3.5 px-4 font-bold">Access Role</th>
                  <th className="py-3.5 px-4 font-bold">Contact Phone</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      Loading staff directory...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-white">
                            {u.fullName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{u.fullName}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {u.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {u.isActive !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                            title="Edit Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.fullName)}
                            disabled={u.id === currentUser?.id}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg disabled:opacity-30"
                            title="Remove User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold">
              {editingUser ? 'Edit Staff Account' : 'Create New Staff Account'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@primecare.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Assign Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {isSuperAdmin && (
                    <option value="super_admin">👑 Super Administrator (Full Control)</option>
                  )}
                  <option value="admin">🛡️ Pharmacy Admin (Manager / Finance)</option>
                  <option value="staff">👤 Counter Staff (POS & Medicine Stock)</option>
                  <option value="salesman">🚚 Sales Representative (Field Orders)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="user-active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="user-active-toggle" className="text-slate-300 font-semibold cursor-pointer">
                  Account is Active
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
