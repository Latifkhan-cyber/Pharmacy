'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

interface Batch {
  id: string
  batchNumber: string
  quantity: number
  salePrice: number | string
  mrp: number | string
  expiryDate: string
}

interface Medicine {
  id: string
  name: string
  genericName?: string
  category: string
  unitType: string
  barcode?: string
  batches?: Batch[]
}

interface CartItem {
  medicineId: string
  name: string
  unitType: string
  batchId: string
  batchNumber: string
  availableQty: number
  quantity: number
  salePrice: number
  mrp: number
  discount: number
  total: number
}

interface Customer {
  id: string
  name: string
  phone: string
  dueAmount: number
}

export default function PosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [taxRate, setTaxRate] = useState<number>(0)
  const [orderDiscount, setOrderDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completedInvoice, setCompletedInvoice] = useState<any>(null)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [customerSaving, setCustomerSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInitialData()
    }
  }, [status])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [meds, custs, sets] = await Promise.all([
        fetch('/api/medicines?pageSize=100').then((r) => r.json()),
        fetch('/api/customers?pageSize=100').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ])

      if (meds.success && Array.isArray(meds.data)) {
        setMedicines(meds.data)
        const cats = Array.from(
          new Set(meds.data.map((m: Medicine) => m.category))
        ).filter(Boolean) as string[]
        setCategories(cats)
      }
      if (custs.success && Array.isArray(custs.data)) {
        setCustomers(custs.data)
      }
      if (sets.success && Array.isArray(sets.data)) {
        const taxSetting = sets.data.find((s: any) => s.key === 'tax_rate')
        if (taxSetting) setTaxRate(parseFloat(taxSetting.value) || 0)
      }
    } catch (err) {
      console.error('Error fetching POS data', err)
    } finally {
      setLoading(false)
    }
  }

  // Add to cart
  const addToCart = (med: Medicine, batch?: Batch) => {
    const batches = med.batches || []
    const availableBatch = batch || batches.find((b) => Number(b.quantity) > 0) || batches[0]

    if (!availableBatch || Number(availableBatch.quantity) <= 0) {
      alert(`"${med.name}" is currently out of stock.`)
      return
    }

    const price = parseFloat(availableBatch.salePrice.toString()) || 0
    const mrp = parseFloat(availableBatch.mrp.toString()) || price

    const existingIndex = cart.findIndex(
      (item) => item.medicineId === med.id && item.batchId === availableBatch.id
    )

    if (existingIndex > -1) {
      const updated = [...cart]
      if (updated[existingIndex].quantity + 1 > availableBatch.quantity) {
        alert(`Cannot add more than available stock (${availableBatch.quantity})`)
        return
      }
      updated[existingIndex].quantity += 1
      updated[existingIndex].total =
        updated[existingIndex].quantity * updated[existingIndex].salePrice -
        updated[existingIndex].discount
      setCart(updated)
    } else {
      const newItem: CartItem = {
        medicineId: med.id,
        name: med.name,
        unitType: med.unitType || 'Unit',
        batchId: availableBatch.id,
        batchNumber: availableBatch.batchNumber || 'BATCH-DEFAULT',
        availableQty: availableBatch.quantity,
        quantity: 1,
        salePrice: price,
        mrp: mrp,
        discount: 0,
        total: price,
      }
      setCart((prev) => [...prev, newItem])
    }
  }

  // Barcode / Fast Enter Key handler
  const handleBarcodeOrQuickSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      const found = medicines.find(
        (m) =>
          m.barcode === query ||
          m.name.toLowerCase() === query ||
          (m.batches || []).some((b) => b.batchNumber.toLowerCase() === query)
      )
      if (found) {
        addToCart(found)
        setSearchQuery('')
      }
    }
  }

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart]
    const item = updated[index]
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeFromCart(index)
      return
    }
    if (newQty > item.availableQty) {
      alert(`Only ${item.availableQty} units available in batch ${item.batchNumber}`)
      return
    }
    item.quantity = newQty
    item.total = item.quantity * item.salePrice - item.discount
    setCart(updated)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    setCart([])
    setOrderDiscount(0)
    setPaidAmount(0)
  }

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = Math.max(0, subtotal + taxAmount - orderDiscount)
  const dueAmount = Math.max(0, grandTotal - paidAmount)

  useEffect(() => {
    if (paymentMethod !== 'credit') {
      setPaidAmount(grandTotal)
    }
  }, [grandTotal, paymentMethod])

  // Filter medicines safely
  const filteredMedicines = medicines.filter((m) => {
    const batches = m.batches || []
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.barcode && m.barcode.includes(searchQuery)) ||
      batches.some((b) => b.batchNumber && b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Submit Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items to proceed.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customerId: selectedCustomerId ? selectedCustomerId : undefined,
        subtotal,
        tax: taxAmount,
        discount: orderDiscount,
        totalAmount: grandTotal,
        paidAmount: paymentMethod === 'credit' ? paidAmount : grandTotal,
        dueAmount: paymentMethod === 'credit' ? dueAmount : 0,
        paymentStatus: dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
        paymentMethod,
        items: cart.map((item) => ({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          salePrice: item.salePrice,
          mrp: item.mrp,
          discount: item.discount,
          total: item.total,
        })),
      }

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        setCompletedInvoice(data.data)
        clearCart()
        fetchInitialData() // refresh live stock numbers
      } else {
        alert(data.error || 'Failed to complete sale')
      }
    } catch (err: any) {
      alert(err?.message || 'Error processing transaction')
    } finally {
      setSubmitting(false)
    }
  }

  // Create new customer inline
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return
    setCustomerSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setCustomers([data.data, ...customers])
        setSelectedCustomerId(data.data.id)
        setShowNewCustomerModal(false)
        setNewCustomerName('')
        setNewCustomerPhone('')
      } else {
        alert(data.error || 'Failed to create customer')
      }
    } catch (err) {
      alert('Error creating customer')
    } finally {
      setCustomerSaving(false)
    }
  }

  return (
    <AppLayout title="POS Terminal & Rapid Billing">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Barcode Header */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search medicine name, generic name, barcode (Press Enter to quick-add)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeOrQuickSearch}
                className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[500px] shadow-xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm">Loading medicine inventory...</p>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm space-y-3">
                <p>No medicines found matching "{searchQuery}".</p>
                <button
                  onClick={fetchInitialData}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                >
                  🔄 Reload Inventory
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredMedicines.map((med) => {
                  const batches = med.batches || []
                  const totalStock = batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0)
                  const primaryBatch = batches.find((b) => Number(b.quantity) > 0) || batches[0]
                  const price = primaryBatch ? parseFloat(primaryBatch.salePrice.toString()) : 0
                  const isOutOfStock = totalStock <= 0

                  return (
                    <div
                      key={med.id}
                      onClick={() => !isOutOfStock && addToCart(med, primaryBatch)}
                      className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                        isOutOfStock
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-800/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-sm leading-snug">{med.name}</h4>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">
                            {med.unitType}
                          </span>
                        </div>
                        {med.genericName && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{med.genericName}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">Category: {med.category}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Price: </span>
                          <span className="text-sm font-black text-emerald-400">Rs. {price.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isOutOfStock
                                ? 'bg-red-500/20 text-red-400'
                                : totalStock < 20
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {isOutOfStock ? 'Out of Stock' : `${totalStock} in stock`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer Selection Card */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Select Customer (Optional)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Walk-in Customer (General)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.dueAmount > 0 ? `• Due: Rs. ${c.dueAmount}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="mt-5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-bold rounded-xl border border-slate-700 transition-all whitespace-nowrap"
            >
              + New
            </button>
          </div>

          {/* Cart Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <h3 className="font-bold text-white text-base">Cart Items</h3>
                <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 font-medium hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-800/60 max-h-[300px] overflow-y-auto my-3 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Cart is empty. Click medicines on the left to add.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.medicineId}-${item.batchId}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Batch: <span className="text-blue-300 font-mono">{item.batchNumber}</span> • Rs. {item.salePrice.toFixed(2)} / {item.unitType}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-20 text-right font-black text-sm text-emerald-400">
                        Rs. {item.total.toFixed(2)}
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout */}
            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>

              {taxRate > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({taxRate}%)</span>
                  <span className="text-white font-medium">+Rs. {taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400">
                <span>Order Discount (Rs.)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={orderDiscount || ''}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right text-white text-xs focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-white">
                <span className="text-sm font-bold">Grand Total</span>
                <span className="text-2xl font-black text-emerald-400">Rs. {grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['cash', 'card', 'online', 'credit'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 rounded-xl text-center capitalize font-semibold transition-all ${
                        paymentMethod === method
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partial / Credit Payment Entry if selected */}
              {paymentMethod === 'credit' && (
                <div className="p-3 bg-slate-950 border border-purple-500/30 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Paid Now (Rs.):</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-white font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-400">Customer Due (Udhaar):</span>
                    <span className="text-purple-300 font-bold">Rs. {dueAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Checkout Action Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || submitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 transform hover:-translate-y-0.5"
              >
                {submitting ? 'Generating Invoice...' : `Complete Sale (Rs. ${grandTotal.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Invoice Receipt Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white space-y-4 shadow-2xl">
            <div className="text-center pb-3 border-b border-slate-800">
              <span className="text-4xl">🎉</span>
              <h3 className="text-xl font-bold mt-2">Sale Completed Successfully!</h3>
              <p className="text-xs text-emerald-400 font-mono mt-1">Invoice: {completedInvoice.invoiceNumber}</p>
            </div>

            {/* Printable Receipt Preview */}
            <div id="printable-receipt" className="bg-slate-950 p-4 rounded-xl text-xs space-y-2 border border-slate-800 font-mono">
              <div className="text-center border-b border-slate-800 pb-2">
                <p className="font-bold text-sm text-white">PrimeCare Pharmacy</p>
                <p className="text-slate-400 text-[10px]">Medical City • Tel: 0300-1234567</p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Date: {new Date(completedInvoice.saleDate || Date.now()).toLocaleDateString()}</span>
                <span>Invoice: {completedInvoice.invoiceNumber}</span>
              </div>

              <table className="w-full text-left my-2">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {completedInvoice.items?.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-1 text-white truncate max-w-[120px]">
                        {item.medicine?.name || item.batchNumber || 'Item'}
                      </td>
                      <td className="py-1 text-center text-slate-300">{item.quantity}</td>
                      <td className="py-1 text-right text-slate-300">Rs. {parseFloat(item.salePrice).toFixed(2)}</td>
                      <td className="py-1 text-right text-emerald-400 font-bold">Rs. {parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-white font-bold">Rs. {parseFloat(completedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid ({completedInvoice.paymentMethod}):</span>
                  <span className="text-emerald-400 font-bold">Rs. {parseFloat(completedInvoice.paidAmount).toFixed(2)}</span>
                </div>
                {parseFloat(completedInvoice.dueAmount) > 0 && (
                  <div className="flex justify-between text-purple-400 font-bold">
                    <span>Balance Due:</span>
                    <span>Rs. {parseFloat(completedInvoice.dueAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Print Receipt
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-white space-y-4">
            <h3 className="text-lg font-bold">Add New Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Tariq Khan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customerSaving}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs"
                >
                  {customerSaving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
