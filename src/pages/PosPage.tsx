import React, { useState, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  CreditCard,
  UserPlus,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { fetchMedicines } from '../services/medicineService'
import { fetchCustomers, createCustomer } from '../services/customerService'
import { fetchSettings } from '../services/settingsService'
import { createSale } from '../services/salesService'
import { Medicine, Customer, MedicineBatch, Sale } from '../types'
import { printThermalReceipt } from '../utils/printReceipt'

interface PosCartItem {
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

export const PosPage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [cart, setCart] = useState<PosCartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [taxRate, setTaxRate] = useState<number>(0)
  const [currencySymbol, setCurrencySymbol] = useState<string>('Rs.')
  const [orderDiscount, setOrderDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online' | 'credit'>('cash')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  // Quick Customer Creation Modal
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [customerSaving, setCustomerSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [meds, custs, sets] = await Promise.all([
        fetchMedicines(),
        fetchCustomers(),
        fetchSettings(),
      ])

      setMedicines(meds)
      const cats = Array.from(new Set(meds.map((m) => m.category))).filter(Boolean)
      setCategories(cats)
      setCustomers(custs)

      const taxSet = sets.find((s) => s.key === 'tax_rate')
      if (taxSet) setTaxRate(parseFloat(taxSet.value) || 0)
      const curSet = sets.find((s) => s.key === 'currency_symbol')
      if (curSet) setCurrencySymbol(curSet.value || 'Rs.')
    } catch (err) {
      console.error('Error loading POS data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Add Item to Cart
  const addToCart = (med: Medicine, batch?: MedicineBatch) => {
    const batches = med.batches || []
    const availableBatch = batch || batches.find((b) => Number(b.quantity) > 0) || batches[0]

    if (!availableBatch || Number(availableBatch.quantity) <= 0) {
      alert(`"${med.name}" is out of stock!`)
      return
    }

    const price = Number(availableBatch.salePrice) || 0
    const mrp = Number(availableBatch.mrp) || price

    const existingIdx = cart.findIndex(
      (item) => item.medicineId === med.id && item.batchId === availableBatch.id
    )

    if (existingIdx > -1) {
      const updated = [...cart]
      if (updated[existingIdx].quantity + 1 > availableBatch.quantity) {
        alert(`Cannot add more than available stock (${availableBatch.quantity})`)
        return
      }
      updated[existingIdx].quantity += 1
      updated[existingIdx].total =
        updated[existingIdx].quantity * updated[existingIdx].salePrice - updated[existingIdx].discount
      setCart(updated)
    } else {
      const newItem: PosCartItem = {
        medicineId: med.id,
        name: med.name,
        unitType: med.unitType || 'Unit',
        batchId: availableBatch.id,
        batchNumber: availableBatch.batchNumber || 'BATCH-01',
        availableQty: availableBatch.quantity,
        quantity: 1,
        salePrice: price,
        mrp,
        discount: 0,
        total: price,
      }
      setCart((prev) => [...prev, newItem])
    }
  }

  // Quick Barcode / Search Enter Handler
  const handleBarcodeOrEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      alert(`Only ${item.availableQty} units available in stock.`)
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

  // Filter Catalog
  const filteredMedicines = medicines.filter((m) => {
    const batches = m.batches || []
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.barcode && m.barcode.includes(searchQuery)) ||
      batches.some((b) => b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory
    return matchesSearch && matchesCat
  })

  // Submit Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please select medicines first.')
      return
    }

    setSubmitting(true)
    try {
      const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

      const sale = await createSale({
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        saleDate: new Date().toISOString(),
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
          medicineName: item.name,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          salePrice: item.salePrice,
          mrp: item.mrp,
          discount: item.discount,
          total: item.total,
          unitType: item.unitType,
        })),
      })

      setCompletedSale(sale)
      clearCart()
      loadData() // refresh live stocks
    } catch (err: any) {
      alert('Checkout error: ' + err?.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) return
    setCustomerSaving(true)
    try {
      const newCust = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        creditLimit: 5000,
        totalSales: 0,
        totalPaid: 0,
        dueAmount: 0,
        loyaltyPoints: 0,
        isActive: true,
      })
      setCustomers([newCust, ...customers])
      setSelectedCustomerId(newCust.id)
      setShowNewCustomerModal(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
    } catch (err) {
      alert('Failed to create customer')
    } finally {
      setCustomerSaving(false)
    }
  }

  return (
    <AppLayout title="Rapid Point of Sale (POS)">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Medicine Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Header */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3 shadow-xl">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search medicine name, generic formula, barcode (Press Enter to quick-add)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeOrEnter}
                className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 min-h-[520px] shadow-xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-72 text-slate-400 gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading live medicine inventory...</p>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs space-y-3">
                <p>No medicines found for "{searchQuery}".</p>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-xl transition-all"
                >
                  Reload Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredMedicines.map((med) => {
                  const batches = med.batches || []
                  const totalStock = batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0)
                  const primaryBatch = batches.find((b) => Number(b.quantity) > 0) || batches[0]
                  const price = primaryBatch ? Number(primaryBatch.salePrice) : 0
                  const isOutOfStock = totalStock <= 0

                  return (
                    <div
                      key={med.id}
                      onClick={() => !isOutOfStock && addToCart(med, primaryBatch)}
                      className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                        isOutOfStock
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-800/80 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-xs leading-snug">{med.name}</h4>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-lg border border-blue-500/20">
                            {med.unitType}
                          </span>
                        </div>
                        {med.genericName && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {med.genericName}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">{med.category}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400">Price: </span>
                          <span className="text-sm font-black text-emerald-400">
                            {currencySymbol} {price.toFixed(2)}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout Terminal (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer Selection Card */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-xl">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Customer Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Walk-in Customer (General)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.dueAmount > 0 ? `• Due: ${currencySymbol}${c.dueAmount}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="mt-4 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Cart Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Active Cart</h3>
                <span className="text-xs bg-blue-600 text-white font-black px-2 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-800/60 max-h-[260px] overflow-y-auto my-3 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Cart is empty. Click medicines on the left to add.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.medicineId}-${item.batchId}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Batch: <span className="text-blue-300 font-mono">{item.batchNumber}</span> • {currencySymbol}{item.salePrice.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-black text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-black text-xs text-emerald-400">
                        {currencySymbol} {item.total.toFixed(2)}
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations and Payment Selector */}
            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">{currencySymbol} {subtotal.toFixed(2)}</span>
              </div>

              {taxRate > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({taxRate}%)</span>
                  <span className="text-white font-medium">+{currencySymbol} {taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400">
                <span>Order Discount ({currencySymbol})</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={orderDiscount || ''}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-right text-white text-xs font-bold"
                />
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Grand Total
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {currencySymbol} {grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['cash', 'card', 'online', 'credit'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 rounded-xl text-center capitalize font-semibold transition-all text-xs ${
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

              {/* Credit Entry */}
              {paymentMethod === 'credit' && (
                <div className="p-3 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Paid Amount ({currencySymbol}):</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right text-white font-bold text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-400">Customer Due Balance:</span>
                    <span className="text-purple-300 font-bold">{currencySymbol} {dueAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || submitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? 'Recording Transaction...' : `Complete Sale (${currencySymbol} ${grandTotal.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Success Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <div className="text-center pb-2 border-b border-slate-800">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-lg font-black">Sale Completed!</h3>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">
                Invoice: {completedSale.invoiceNumber}
              </p>
            </div>

            {/* Printable Preview */}
            <div id="receipt-preview" className="bg-slate-950 p-4 rounded-2xl text-xs space-y-2 border border-slate-800 font-mono">
              <div className="text-center border-b border-slate-800 pb-2">
                <p className="font-black text-sm text-white">PrimeCare Pharmacy OS</p>
                <p className="text-[10px] text-slate-400">Healthcare Boulevard • Tel: 0300-1234567</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Date: {new Date(completedSale.saleDate).toLocaleString()}</span>
                <span>INV: {completedSale.invoiceNumber}</span>
              </div>

              <table className="w-full text-left my-2 text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {completedSale.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1 text-white truncate max-w-[120px]">{item.medicineName || 'Medicine'}</td>
                      <td className="py-1 text-center text-slate-300">{item.quantity}</td>
                      <td className="py-1 text-right text-slate-300">{currencySymbol}{item.salePrice.toFixed(2)}</td>
                      <td className="py-1 text-right text-emerald-400 font-bold">{currencySymbol}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-white font-bold">{currencySymbol} {Number(completedSale.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid ({completedSale.paymentMethod}):</span>
                  <span className="text-emerald-400 font-bold">{currencySymbol} {Number(completedSale.paidAmount).toFixed(2)}</span>
                </div>
                {Number(completedSale.dueAmount) > 0 && (
                  <div className="flex justify-between text-purple-400 font-bold">
                    <span>Balance Due:</span>
                    <span>{currencySymbol} {Number(completedSale.dueAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => printThermalReceipt(completedSale, { currencySymbol })}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white space-y-4">
            <h3 className="text-base font-bold">Add New Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Asad Malik"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
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
