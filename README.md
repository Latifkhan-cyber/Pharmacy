Live Damo : https://pharmacy-scv7.vercel.app/

# Pharmacy Management & Wholesale Distribution System

A complete web-based system for managing pharmacy inventory, sales, purchases, distribution, payments, expenses, and comprehensive reporting.

## Features

### 🏥 Core Modules
- **Medicine & Stock Management** - Track medicines, batches, stock levels, and expiry dates
- **Sales & POS** - Point of sale, invoice generation, and sales tracking
- **Purchase Management** - Supplier management, purchase orders, and stock updates
- **Customer Management** - Customer records, dues tracking, and payment history
- **Distributor Module** - Sales representatives, collections, and profit tracking
- **Payments & Expenses** - Payment recording, expense tracking, and categorization
- **Reports & Analytics** - Sales, profit/loss, inventory, and distributor reports

### 📊 Dashboard Features
- Today's sales and expenses
- Gross profit and net profit calculation
- Inventory value and stock alerts
- Low stock medicines
- Expired and expiring soon medicines
- Customer and supplier dues summary

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **PDF Generation**: jsPDF
- **Excel Export**: XLSX
- **Charts**: Recharts

```
Pharmacy/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── utils.ts          # Helper functions
│   └── types.ts          # TypeScript types
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seeder
├── public/               # Static files
└── types/                # TypeScript type definitions
```

