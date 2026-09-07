export interface User {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'staff' | 'salesman'
  fullName: string
  phone?: string
  isActive?: boolean
  createdAt?: any
}

export interface MedicineBatch {
  id: string
  medicineId: string
  batchNumber: string
  expiryDate: string
  quantity: number
  purchasePrice: number
  salePrice: number
  mrp: number
  supplierId?: string
  createdAt?: any
}

export interface Medicine {
  id: string
  name: string
  genericName?: string
  category: string
  manufacturer?: string
  description?: string
  unitType: string // tablet, capsule, syrup, injection, etc.
  reorderLevel: number
  barcode?: string
  isActive: boolean
  batches?: MedicineBatch[]
  createdAt?: any
  updatedAt?: any
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  phone: string
  email?: string
  address?: string
  city?: string
  totalPurchase: number
  totalPaid: number
  dueAmount: number
  isActive: boolean
  createdAt?: any
}

export interface PurchaseItem {
  id?: string
  medicineId: string
  medicineName?: string
  batchNumber: string
  expiryDate: string
  quantity: number
  purchasePrice: number
  salePrice: number
  mrp: number
  total: number
}

export interface Purchase {
  id: string
  invoiceNumber: string
  supplierId: string
  supplierName?: string
  purchaseDate: string
  subtotal: number
  tax: number
  discount: number
  totalAmount: number
  paidAmount: number
  dueAmount: number
  paymentStatus: 'paid' | 'partial' | 'pending'
  notes?: string
  items?: PurchaseItem[]
  createdAt?: any
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  creditLimit: number
  totalSales: number
  totalPaid: number
  dueAmount: number
  loyaltyPoints: number
  isActive: boolean
  createdAt?: any
}

export interface SaleItem {
  id?: string
  medicineId: string
  medicineName?: string
  batchNumber?: string
  quantity: number
  salePrice: number
  mrp: number
  discount: number
  total: number
  unitType?: string
}

export interface Sale {
  id: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  saleDate: string
  subtotal: number
  tax: number
  discount: number
  totalAmount: number
  paidAmount: number
  dueAmount: number
  paymentStatus: 'paid' | 'partial' | 'pending'
  paymentMethod: 'cash' | 'card' | 'online' | 'credit'
  notes?: string
  items: SaleItem[]
  userId?: string
  createdAt?: any
}

export interface Distributor {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  area?: string
  totalSales: number
  totalExpenses: number
  totalProfit: number
  isActive: boolean
  createdAt?: any
}

export interface DistributorSale {
  id: string
  distributorId: string
  distributorName?: string
  saleDate: string
  amount: number
  cost: number
  profit: number
  notes?: string
  createdAt?: any
}

export interface DistributorExpense {
  id: string
  distributorId: string
  expenseDate: string
  category: string
  amount: number
  description?: string
  createdAt?: any
}

export interface Expense {
  id: string
  expenseDate: string
  category: string
  amount: number
  description?: string
  userId?: string
  createdAt?: any
}

export interface Payment {
  id: string
  paymentDate: string
  amount: number
  paymentMethod: 'cash' | 'bank' | 'online' | 'card'
  paymentType: 'customer' | 'supplier'
  referenceId?: string
  customerId?: string
  customerName?: string
  supplierId?: string
  supplierName?: string
  notes?: string
  userId?: string
  createdAt?: any
}

export interface Setting {
  id?: string
  key: string
  value: string
  description?: string
}

export interface DashboardMetrics {
  totalSales: number
  totalPurchases: number
  todaySales: number
  monthlySales: number
  totalProfit: number
  lowStockCount: number
  expiredCount: number
  totalMedicines: number
  totalCustomers: number
  totalSuppliers: number
  customerDues: number
  supplierDues: number
}
