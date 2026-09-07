import { collection, doc, writeBatch, getDocs } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { Medicine, Customer, Supplier, Distributor, Expense, Setting } from '../types'

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-01',
    name: 'Panadol Extra 500mg/65mg',
    genericName: 'Paracetamol + Caffeine',
    category: 'Analgesics & Pain Relief',
    manufacturer: 'GSK Consumer Healthcare',
    unitType: 'Tablet',
    reorderLevel: 50,
    barcode: '8964000123456',
    isActive: true,
    batches: [
      {
        id: 'b-01',
        medicineId: 'med-01',
        batchNumber: 'PND-2024-A',
        expiryDate: '2026-12-31',
        quantity: 180,
        purchasePrice: 2.8,
        salePrice: 4.5,
        mrp: 5.0,
      },
      {
        id: 'b-02',
        medicineId: 'med-01',
        batchNumber: 'PND-2024-B',
        expiryDate: '2027-05-15',
        quantity: 240,
        purchasePrice: 2.9,
        salePrice: 4.5,
        mrp: 5.0,
      },
    ],
  },
  {
    id: 'med-02',
    name: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'Antibiotics',
    manufacturer: 'GlaxoSmithKline',
    unitType: 'Tablet',
    reorderLevel: 20,
    barcode: '8964000654321',
    isActive: true,
    batches: [
      {
        id: 'b-03',
        medicineId: 'med-02',
        batchNumber: 'AUG-8891',
        expiryDate: '2026-08-30',
        quantity: 45,
        purchasePrice: 28.0,
        salePrice: 36.5,
        mrp: 40.0,
      },
    ],
  },
  {
    id: 'med-03',
    name: 'Risek 20mg Capsule',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    manufacturer: 'Getz Pharma',
    unitType: 'Capsule',
    reorderLevel: 30,
    barcode: '8964000789012',
    isActive: true,
    batches: [
      {
        id: 'b-04',
        medicineId: 'med-03',
        batchNumber: 'RSK-4102',
        expiryDate: '2027-01-20',
        quantity: 120,
        purchasePrice: 15.0,
        salePrice: 22.0,
        mrp: 25.0,
      },
    ],
  },
  {
    id: 'med-04',
    name: 'Hydryllin Syrup 120ml',
    genericName: 'Aminophylline + Diphenhydramine',
    category: 'Respiratory & Cough',
    manufacturer: 'Searle Company',
    unitType: 'Syrup',
    reorderLevel: 15,
    barcode: '8964000345678',
    isActive: true,
    batches: [
      {
        id: 'b-05',
        medicineId: 'med-04',
        batchNumber: 'HYD-0921',
        expiryDate: '2026-10-15',
        quantity: 35,
        purchasePrice: 95.0,
        salePrice: 130.0,
        mrp: 140.0,
      },
    ],
  },
  {
    id: 'med-05',
    name: 'Brufen 400mg',
    genericName: 'Ibuprofen',
    category: 'Analgesics & Pain Relief',
    manufacturer: 'Abbott Laboratories',
    unitType: 'Tablet',
    reorderLevel: 25,
    barcode: '8964000987654',
    isActive: true,
    batches: [
      {
        id: 'b-06',
        medicineId: 'med-05',
        batchNumber: 'BRF-7712',
        expiryDate: '2025-11-10', // Near Expiry Test
        quantity: 12, // Low stock test
        purchasePrice: 4.5,
        salePrice: 7.0,
        mrp: 8.0,
      },
    ],
  },
  {
    id: 'med-06',
    name: 'Glucophage 500mg',
    genericName: 'Metformin HCl',
    category: 'Diabetes Care',
    manufacturer: 'Merck Serono',
    unitType: 'Tablet',
    reorderLevel: 40,
    barcode: '8964000112233',
    isActive: true,
    batches: [
      {
        id: 'b-07',
        medicineId: 'med-06',
        batchNumber: 'GLC-3019',
        expiryDate: '2027-04-01',
        quantity: 95,
        purchasePrice: 8.5,
        salePrice: 12.0,
        mrp: 14.0,
      },
    ],
  },
  {
    id: 'med-07',
    name: 'Softin 10mg (Loratadine)',
    genericName: 'Loratadine',
    category: 'Antihistamines & Allergy',
    manufacturer: 'CCL Pharmaceuticals',
    unitType: 'Tablet',
    reorderLevel: 20,
    barcode: '8964000445566',
    isActive: true,
    batches: [
      {
        id: 'b-08',
        medicineId: 'med-07',
        batchNumber: 'SFT-1092',
        expiryDate: '2026-11-25',
        quantity: 60,
        purchasePrice: 10.0,
        salePrice: 15.0,
        mrp: 17.0,
      },
    ],
  },
]

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    name: 'Mohammad Tariq',
    phone: '03001234567',
    email: 'tariq@gmail.com',
    city: 'Medical City, Block A',
    creditLimit: 5000,
    totalSales: 8450,
    totalPaid: 7000,
    dueAmount: 1450,
    loyaltyPoints: 120,
    isActive: true,
  },
  {
    id: 'cust-02',
    name: 'Ayesha Siddiqui',
    phone: '03219876543',
    email: 'ayesha.s@outlook.com',
    city: 'Gulberg Gardens',
    creditLimit: 10000,
    totalSales: 15200,
    totalPaid: 15200,
    dueAmount: 0,
    loyaltyPoints: 340,
    isActive: true,
  },
  {
    id: 'cust-03',
    name: 'Dr. Usman Farooq',
    phone: '03335554433',
    email: 'dr.usman@hospital.com',
    city: 'City Hospital Clinic',
    creditLimit: 25000,
    totalSales: 42000,
    totalPaid: 38000,
    dueAmount: 4000,
    loyaltyPoints: 890,
    isActive: true,
  },
]

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'Prime Pharma Distributors',
    contactPerson: 'Kashif Ali',
    phone: '03124455667',
    email: 'orders@primepharma.com',
    city: 'Karachi Wholesale Hub',
    totalPurchase: 145000,
    totalPaid: 125000,
    dueAmount: 20000,
    isActive: true,
  },
  {
    id: 'sup-02',
    name: 'Allied Medical Supplies',
    contactPerson: 'Zainab Noor',
    phone: '03017788990',
    email: 'zainab@alliedmed.com',
    city: 'Lahore Logistics',
    totalPurchase: 89000,
    totalPaid: 89000,
    dueAmount: 0,
    isActive: true,
  },
]

export const INITIAL_DISTRIBUTORS: Distributor[] = [
  {
    id: 'dist-01',
    name: 'Bilal Ahmed (Field Rep)',
    phone: '03456789012',
    area: 'North Sector & Clinics',
    city: 'Medical Town',
    totalSales: 34000,
    totalExpenses: 4200,
    totalProfit: 29800,
    isActive: true,
  },
  {
    id: 'dist-02',
    name: 'Hamza Malik (Distribution Lead)',
    phone: '03131122334',
    area: 'Central Hospital Belt',
    city: 'Capital Territory',
    totalSales: 68000,
    totalExpenses: 7800,
    totalProfit: 60200,
    isActive: true,
  },
]

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-01',
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'Electricity & Utilities',
    amount: 14500,
    description: 'Pharmacy air conditioning and storage refrigeration bill',
  },
  {
    id: 'exp-02',
    expenseDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    category: 'Staff Salary & Overtime',
    amount: 45000,
    description: 'Bi-weekly dispenser and inventory technician compensation',
  },
  {
    id: 'exp-03',
    expenseDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    category: 'Packaging & Bags',
    amount: 3200,
    description: 'Branded pharmacy medicine bags & thermal receipt rolls',
  },
]

export const INITIAL_SETTINGS: Setting[] = [
  { key: 'pharmacy_name', value: 'PrimeCare Pharmacy & Healthcare' },
  { key: 'pharmacy_phone', value: '+92 300 1234567' },
  { key: 'pharmacy_address', value: 'Plot 42-B, Health Boulevard, Medical District' },
  { key: 'tax_rate', value: '5' },
  { key: 'currency_symbol', value: 'Rs.' },
  { key: 'low_stock_threshold', value: '20' },
  { key: 'expiry_alert_days', value: '90' },
  { key: 'receipt_footer_text', value: 'Thank you for choosing PrimeCare! Keep medicines out of reach of children.' },
]

/**
 * Seeds initial mock data to Firestore in batch if collections are empty.
 */
export const seedFirestoreDatabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      message: 'Firebase configuration not detected. Please configure Firebase API credentials in Settings.',
    }
  }

  try {
    const batch = writeBatch(db)

    // Seed Medicines
    for (const med of INITIAL_MEDICINES) {
      const ref = doc(db, 'medicines', med.id)
      batch.set(ref, med)
    }

    // Seed Customers
    for (const cust of INITIAL_CUSTOMERS) {
      const ref = doc(db, 'customers', cust.id)
      batch.set(ref, cust)
    }

    // Seed Suppliers
    for (const sup of INITIAL_SUPPLIERS) {
      const ref = doc(db, 'suppliers', sup.id)
      batch.set(ref, sup)
    }

    // Seed Distributors
    for (const dist of INITIAL_DISTRIBUTORS) {
      const ref = doc(db, 'distributors', dist.id)
      batch.set(ref, dist)
    }

    // Seed Expenses
    for (const exp of INITIAL_EXPENSES) {
      const ref = doc(db, 'expenses', exp.id)
      batch.set(ref, exp)
    }

    // Seed Settings
    for (const set of INITIAL_SETTINGS) {
      const ref = doc(db, 'settings', set.key)
      batch.set(ref, set)
    }

    await batch.commit()
    return { success: true, message: 'All default pharmacy data successfully seeded to Firestore!' }
  } catch (err: any) {
    console.error('Error seeding Firestore:', err)
    let extra = ''
    if (err?.code === 'permission-denied') {
      extra = ' (Permission Denied: Please go to Firebase Console > Firestore Database > Rules, and set: allow read, write: if true;)'
    } else if (err?.code === 'not-found' || err?.message?.includes('database')) {
      extra = ' (Database Not Created: Please go to Firebase Console > Firestore Database > Click "Create database")'
    }
    return { success: false, message: (err?.message || 'Failed to seed Firestore collections') + extra }
  }
}
