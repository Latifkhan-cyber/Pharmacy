# Pharmacy Management System - API Documentation

## Overview

Complete REST API documentation for the Pharmacy Management & Wholesale Distribution System built with Next.js, TypeScript, and PostgreSQL.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All API endpoints (except login/register) require authentication using NextAuth session cookies.

### Auth Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints (login, logout, session)

---

## 1. User Management

### Users
- `GET /api/users` - Get all users (paginated, admin only)
- `POST /api/users` - Create new user (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Profile
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `POST /api/users/change-password` - Change password

---

## 2. Medicine & Inventory Management

### Medicines
- `GET /api/medicines` - Get all medicines (with filters)
- `POST /api/medicines` - Create new medicine
- `GET /api/medicines/:id` - Get medicine by ID
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `GET /api/medicines/categories` - Get medicine categories
- `GET /api/medicines/search?q=query` - Quick search for POS

### Batches
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create new batch
- `GET /api/batches/:id` - Get batch by ID
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch

### Inventory
- `GET /api/inventory/alerts` - Get stock alerts (low, expired, expiring soon)
- `GET /api/inventory/summary` - Get inventory summary with valuations

---

## 3. Purchase & Supplier Management

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchases
- `GET /api/purchases` - Get all purchases (with filters)
- `POST /api/purchases` - Create new purchase (auto stock update)
- `GET /api/purchases/:id` - Get purchase by ID
- `DELETE /api/purchases/:id` - Delete purchase with stock rollback (admin only)
- `POST /api/purchases/:id/payment` - Add payment to purchase
- `POST /api/purchases/return` - Handle purchase return

---

## 4. Sales & Invoice Management

### Sales
- `GET /api/sales` - Get all sales (with filters)
- `POST /api/sales` - Create new sale (POS)
- `GET /api/sales/:id` - Get sale by ID
- `DELETE /api/sales/:id` - Delete sale with stock rollback (admin only)
- `POST /api/sales/:id/payment` - Add payment to sale
- `POST /api/sales/return` - Handle sale return
- `GET /api/sales/summary` - Get sales summary with analytics

---

## 5. Customer Management

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/statement` - Get customer statement
- `POST /api/customers/:id/payment` - Add payment for customer
- `GET /api/customers/dues` - Get customers with outstanding dues
- `GET /api/customers/summary` - Get customer summary statistics

---

## 6. Distributor Management

### Distributors
- `GET /api/distributors` - Get all distributors
- `POST /api/distributors` - Create new distributor
- `GET /api/distributors/:id` - Get distributor by ID
- `PUT /api/distributors/:id` - Update distributor
- `DELETE /api/distributors/:id` - Delete distributor

### Distributor Operations
- `GET /api/distributors/:id/sales` - Get distributor sales
- `POST /api/distributors/:id/sales` - Add sale for distributor
- `GET /api/distributors/:id/expenses` - Get distributor expenses
- `POST /api/distributors/:id/expenses` - Add expense for distributor
- `GET /api/distributors/:id/report` - Get distributor performance report
- `GET /api/distributors/summary` - Get distributors summary

---

## 7. Payments & Expenses

### Payments
- `GET /api/payments` - Get all payments (with filters)
- `GET /api/payments/:id` - Get payment by ID
- `DELETE /api/payments/:id` - Delete payment with rollback (admin only)
- `GET /api/payments/summary` - Get payments summary

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/categories` - Get expense categories
- `GET /api/expenses/summary` - Get expenses summary

---

## 8. Reports & Analytics

### Reports
- `GET /api/reports/profit-loss` - Profit & loss statement
- `GET /api/reports/sales` - Detailed sales report
- `GET /api/reports/purchases` - Detailed purchases report
- `GET /api/reports/inventory` - Inventory report with valuations
- `GET /api/reports/business-overview` - Comprehensive business overview

---

## 9. Dashboard & Settings

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Create or update setting (admin only)
- `PUT /api/settings` - Bulk update settings (admin only)

### Activity Logs
- `GET /api/activity-logs` - Get activity logs
- `DELETE /api/activity-logs?days=90` - Clear old logs (admin only)

---

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)

### Date Filters
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

### Search
- `search` - Search query string

### Filters
- `isActive` - Filter by active status (true/false)
- `category` - Filter by category
- `paymentStatus` - Filter by payment status
- `paymentMethod` - Filter by payment method

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Features Implemented

### ✅ Core Features
- Complete CRUD operations for all entities
- Role-based access control (admin, staff, salesman)
- Automatic stock management with FIFO
- Batch-wise inventory tracking
- Expiry date management and alerts
- Payment tracking and dues management
- Purchase and sale returns
- Invoice generation

### ✅ Business Logic
- Automatic stock updates on purchase/sale
- FIFO stock deduction for sales
- Customer and supplier dues tracking
- Profit calculations (gross and net)
- Payment allocation to invoices
- Stock rollback on deletion

### ✅ Analytics & Reports
- Sales, purchase, and inventory reports
- Profit & loss statements
- Top-selling medicines
- Customer and supplier analysis
- Distributor performance tracking
- Business overview dashboard
- Expense analysis by category

### ✅ Alerts & Notifications
- Low stock alerts
- Expired medicine alerts
- Expiring soon alerts (90 days)
- Customer dues aging (30/60/90+ days)

---

## Security Features

- JWT-based authentication with NextAuth
- Role-based authorization
- Password hashing with bcryptjs
- Protected admin-only endpoints
- Activity logging for audit trails
- SQL injection protection (Prisma ORM)

---

## Database Schema

The system uses PostgreSQL with Prisma ORM featuring:
- 15+ database tables
- Optimized indexes for performance
- Cascade delete rules
- Decimal precision for financial data
- Transaction support for data integrity

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **Styling**: Tailwind CSS

---

## Setup Instructions

See [README.md](./README.md) for complete setup instructions.

---

## Support

For issues or questions, please create an issue in the repository.
