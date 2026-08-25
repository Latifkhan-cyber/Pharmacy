import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting comprehensive database seeding...')

  // 1. Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@pharmacy.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      phone: '03001234567',
      role: 'admin',
      isActive: true,
    },
  })

  console.log('Created admin user:', admin.username)

  // 2. Create sample medicine categories
  const categories = [
    'Analgesics',
    'Antibiotics',
    'Antiseptics',
    'Antivirals',
    'Cardiovascular',
    'Dermatology',
    'Diabetes',
    'Gastrointestinal',
    'Respiratory',
    'Vitamins & Supplements',
  ]

  for (const category of categories) {
    await prisma.setting.upsert({
      where: { key: `category_${category.toLowerCase().replace(/\s+/g, '_')}` },
      update: { value: category },
      create: {
        key: `category_${category.toLowerCase().replace(/\s+/g, '_')}`,
        value: category,
        description: `Medicine category: ${category}`,
      },
    })
  }

  // 3. Create expense categories
  const expenseCategories = [
    'Rent',
    'Salary',
    'Electricity',
    'Fuel',
    'Transportation',
    'Office Supplies',
    'Maintenance',
    'Marketing',
    'Other',
  ]

  for (const expCategory of expenseCategories) {
    await prisma.setting.upsert({
      where: { key: `expense_category_${expCategory.toLowerCase().replace(/\s+/g, '_')}` },
      update: { value: expCategory },
      create: {
        key: `expense_category_${expCategory.toLowerCase().replace(/\s+/g, '_')}`,
        value: expCategory,
        description: `Expense category: ${expCategory}`,
      },
    })
  }

  // 4. Create system settings
  const settings = [
    { key: 'pharmacy_name', value: 'PrimeCare Pharmacy', description: 'Name of the pharmacy' },
    { key: 'pharmacy_address', value: '123 Health Ave, Medical City', description: 'Pharmacy address' },
    { key: 'pharmacy_phone', value: '0300-1234567', description: 'Pharmacy contact number' },
    { key: 'tax_rate', value: '5', description: 'Default tax rate percentage' },
    { key: 'low_stock_threshold', value: '15', description: 'Low stock alert threshold' },
    { key: 'expiry_alert_days', value: '90', description: 'Days before expiry to show alert' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log('Created system settings')

  // 5. Create suppliers
  const suppliersData = [
    {
      name: 'ABC Pharmaceuticals Ltd',
      contactPerson: 'John Doe',
      phone: '03001111111',
      email: 'abc@pharma.com',
      address: 'Industrial Area Phase 1',
      city: 'Karachi',
      totalPurchase: 8500,
      totalPaid: 7300,
      dueAmount: 1200,
    },
    {
      name: 'XYZ Medical Suppliers',
      contactPerson: 'Jane Smith',
      phone: '03002222222',
      email: 'xyz@medical.com',
      address: 'Commercial Zone',
      city: 'Lahore',
      totalPurchase: 4200,
      totalPaid: 3600,
      dueAmount: 600,
    },
    {
      name: 'PharmaPlus Distributors',
      contactPerson: 'Ahmed Bilal',
      phone: '03003333334',
      email: 'ahmed@pharmaplus.com',
      address: 'Plot 45, Sector 7',
      city: 'Islamabad',
      totalPurchase: 6100,
      totalPaid: 6100,
      dueAmount: 0,
    }
  ]

  const suppliers: any[] = []
  for (const s of suppliersData) {
    let supplier = await prisma.supplier.findFirst({ where: { phone: s.phone } })
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: s })
    }
    suppliers.push(supplier)
  }

  console.log('Created suppliers:', suppliers.length)

  // 6. Create customers
  const customersData = [
    {
      name: 'Ali Ahmed',
      phone: '03003333333',
      email: 'ali@example.com',
      address: 'Block A, City',
      city: 'Karachi',
      creditLimit: 5000,
      totalSales: 3400,
      totalPaid: 2980,
      dueAmount: 420,
      loyaltyPoints: 340,
    },
    {
      name: 'Sara Khan',
      phone: '03004444444',
      email: 'sara@example.com',
      address: 'Block B, City',
      city: 'Lahore',
      creditLimit: 3000,
      totalSales: 1850,
      totalPaid: 1850,
      dueAmount: 0,
      loyaltyPoints: 185,
    },
    {
      name: 'Dr. Tariq Mahmood',
      phone: '03005555555',
      email: 'tariq@clinic.com',
      address: 'Central Hospital Lane',
      city: 'Karachi',
      creditLimit: 15000,
      totalSales: 12400,
      totalPaid: 11600,
      dueAmount: 800,
      loyaltyPoints: 1240,
    }
  ]

  const customers: any[] = []
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { dueAmount: c.dueAmount, totalSales: c.totalSales },
      create: c,
    })
    customers.push(customer)
  }

  console.log('Created customers:', customers.length)

  // 7. Create Medicines & Inventory Batches
  const medicinesData = [
    {
      name: 'Panadol Extra 500mg',
      genericName: 'Paracetamol + Caffeine',
      category: 'Analgesics',
      manufacturer: 'GSK',
      unitType: 'Tablet',
      reorderLevel: 50,
      barcode: '890123456001',
      batches: [
        { batchNumber: 'PND-2024-01', quantity: 350, purchasePrice: 2.50, salePrice: 4.00, mrp: 4.50, monthsExpiry: 18 },
        { batchNumber: 'PND-2024-02', quantity: 150, purchasePrice: 2.50, salePrice: 4.00, mrp: 4.50, monthsExpiry: 2 }, // expiring in 2 months (60 days)
      ]
    },
    {
      name: 'Augmentin 625mg',
      genericName: 'Amoxicillin + Clavulanic Acid',
      category: 'Antibiotics',
      manufacturer: 'GSK',
      unitType: 'Tablet',
      reorderLevel: 40,
      barcode: '890123456002',
      batches: [
        { batchNumber: 'AUG-2024-01', quantity: 120, purchasePrice: 18.00, salePrice: 26.00, mrp: 28.00, monthsExpiry: 12 },
      ]
    },
    {
      name: 'Brufen 400mg',
      genericName: 'Ibuprofen',
      category: 'Analgesics',
      manufacturer: 'Abbott',
      unitType: 'Tablet',
      reorderLevel: 60,
      barcode: '890123456003',
      batches: [
        { batchNumber: 'BRF-2024-01', quantity: 8, purchasePrice: 3.20, salePrice: 5.50, mrp: 6.00, monthsExpiry: 14 }, // low stock (8 < 60)
      ]
    },
    {
      name: 'Omeprazole 20mg (Risek)',
      genericName: 'Omeprazole',
      category: 'Gastrointestinal',
      manufacturer: 'Getz Pharma',
      unitType: 'Capsule',
      reorderLevel: 30,
      barcode: '890123456004',
      batches: [
        { batchNumber: 'OMP-2024-01', quantity: 240, purchasePrice: 14.00, salePrice: 22.00, mrp: 24.00, monthsExpiry: 16 },
      ]
    },
    {
      name: 'Ciprobay 500mg',
      genericName: 'Ciprofloxacin',
      category: 'Antibiotics',
      manufacturer: 'Bayer',
      unitType: 'Tablet',
      reorderLevel: 25,
      barcode: '890123456005',
      batches: [
        { batchNumber: 'CIP-2023-99', quantity: 20, purchasePrice: 15.00, salePrice: 24.00, mrp: 26.00, monthsExpiry: -1 }, // expired 1 month ago
        { batchNumber: 'CIP-2024-01', quantity: 85, purchasePrice: 15.00, salePrice: 24.00, mrp: 26.00, monthsExpiry: 15 },
      ]
    },
    {
      name: 'Glucophage 500mg',
      genericName: 'Metformin HCl',
      category: 'Diabetes',
      manufacturer: 'Merck',
      unitType: 'Tablet',
      reorderLevel: 50,
      barcode: '890123456006',
      batches: [
        { batchNumber: 'GLU-2024-01', quantity: 300, purchasePrice: 5.00, salePrice: 8.50, mrp: 9.00, monthsExpiry: 20 },
      ]
    },
    {
      name: 'Zyrtec 10mg',
      genericName: 'Cetirizine DiHCl',
      category: 'Respiratory',
      manufacturer: 'GSK',
      unitType: 'Tablet',
      reorderLevel: 35,
      barcode: '890123456007',
      batches: [
        { batchNumber: 'ZYR-2024-01', quantity: 180, purchasePrice: 4.50, salePrice: 7.50, mrp: 8.00, monthsExpiry: 18 },
      ]
    },
    {
      name: 'Surbex-Z',
      genericName: 'Multivitamins + Zinc',
      category: 'Vitamins & Supplements',
      manufacturer: 'Abbott',
      unitType: 'Tablet',
      reorderLevel: 45,
      barcode: '890123456008',
      batches: [
        { batchNumber: 'SRB-2024-01', quantity: 95, purchasePrice: 8.00, salePrice: 13.00, mrp: 14.00, monthsExpiry: 10 },
      ]
    },
  ]

  const seededMedicines: any[] = []
  for (const m of medicinesData) {
    const medId = m.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const medicine = await prisma.medicine.upsert({
      where: { id: medId },
      update: {
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        manufacturer: m.manufacturer,
        unitType: m.unitType,
        reorderLevel: m.reorderLevel,
        barcode: m.barcode,
      },
      create: {
        id: medId,
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        manufacturer: m.manufacturer,
        unitType: m.unitType,
        reorderLevel: m.reorderLevel,
        barcode: m.barcode,
      },
    })

    // Seed batches for medicine
    for (const b of m.batches) {
      const expiry = new Date()
      expiry.setMonth(expiry.getMonth() + b.monthsExpiry)

      const existingBatch = await prisma.medicineBatch.findFirst({
        where: { medicineId: medicine.id, batchNumber: b.batchNumber }
      })

      if (!existingBatch) {
        await prisma.medicineBatch.create({
          data: {
            medicineId: medicine.id,
            batchNumber: b.batchNumber,
            quantity: b.quantity,
            purchasePrice: b.purchasePrice,
            salePrice: b.salePrice,
            mrp: b.mrp,
            expiryDate: expiry,
            supplierId: suppliers[0]?.id,
          }
        })
      }
    }

    seededMedicines.push(medicine)
  }

  console.log('Created medicines & batches:', seededMedicines.length)

  // 8. Create today's Expenses
  const today = new Date()
  const expensesData = [
    { category: 'Electricity', amount: 145.00, description: 'Monthly branch electricity utility', userId: admin.id },
    { category: 'Office Supplies', amount: 65.50, description: 'Thermal receipt rolls and stationery', userId: admin.id },
    { category: 'Maintenance', amount: 120.00, description: 'AC repair & chiller service', userId: admin.id },
  ]

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: {
        ...exp,
        expenseDate: today,
      }
    })
  }

  console.log('Created today expenses')

  // 9. Create today's Sales (POS Transactions)
  const panadol = seededMedicines[0]
  const augmentin = seededMedicines[1]
  const risek = seededMedicines[3]

  const salesData = [
    {
      invoiceNumber: `INV-${Date.now()}-1`,
      customerId: customers[0]?.id,
      userId: admin.id,
      saleDate: today,
      subtotal: 128.00,
      tax: 6.40,
      discount: 0,
      totalAmount: 134.40,
      paidAmount: 134.40,
      dueAmount: 0,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      items: [
        { medicineId: panadol.id, batchNumber: 'PND-2024-01', quantity: 10, salePrice: 4.00, mrp: 4.50, discount: 0, total: 40.00 },
        { medicineId: augmentin.id, batchNumber: 'AUG-2024-01', quantity: 3, salePrice: 26.00, mrp: 28.00, discount: 0, total: 78.00 },
        { medicineId: risek.id, batchNumber: 'OMP-2024-01', quantity: 1, salePrice: 22.00, mrp: 24.00, discount: 0, total: 22.00 },
      ]
    },
    {
      invoiceNumber: `INV-${Date.now()}-2`,
      customerId: customers[1]?.id,
      userId: admin.id,
      saleDate: today,
      subtotal: 260.00,
      tax: 13.00,
      discount: 10.00,
      totalAmount: 263.00,
      paidAmount: 263.00,
      dueAmount: 0,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      items: [
        { medicineId: augmentin.id, batchNumber: 'AUG-2024-01', quantity: 10, salePrice: 26.00, mrp: 28.00, discount: 10.00, total: 250.00 },
      ]
    },
    {
      invoiceNumber: `INV-${Date.now()}-3`,
      customerId: customers[2]?.id,
      userId: admin.id,
      saleDate: today,
      subtotal: 440.00,
      tax: 22.00,
      discount: 20.00,
      totalAmount: 442.00,
      paidAmount: 300.00,
      dueAmount: 142.00,
      paymentStatus: 'partial',
      paymentMethod: 'credit',
      items: [
        { medicineId: risek.id, batchNumber: 'OMP-2024-01', quantity: 20, salePrice: 22.00, mrp: 24.00, discount: 20.00, total: 420.00 },
      ]
    }
  ]

  for (const s of salesData) {
    const { items, ...saleHeader } = s
    const createdSale = await prisma.sale.create({
      data: saleHeader
    })

    for (const item of items) {
      await prisma.saleItem.create({
        data: {
          ...item,
          saleId: createdSale.id,
        }
      })
    }
  }

  console.log('Created today sales:', salesData.length)
  console.log('Comprehensive database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
