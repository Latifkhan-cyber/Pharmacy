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

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pharmacy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/pharmacy_db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   NODE_ENV="development"
   ```

4. **Set up the database**
   
   Create a PostgreSQL database:
   ```bash
   createdb pharmacy_db
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Seed the database** (optional - creates admin user and sample data)
   ```bash
   npm run db:seed
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Admin Credentials

After seeding the database:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default password after first login!

## Database Scripts

- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Project Structure

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

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Medicines
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details

### Purchases
- `GET /api/purchases` - Get all purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/:id` - Get purchase details

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/profit` - Profit/loss report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/distributors` - Distributor report

## Key Features Explained

### Profit Calculation

**Gross Profit** = Total Sales Revenue - Cost of Goods Sold (Purchase Cost)

**Net Profit** = Gross Profit - Operating Expenses

### Stock Management

- Automatic stock updates on purchase and sale
- Low stock alerts based on reorder level
- Expiry date tracking with alerts
- Batch-wise stock management

### Payment Tracking

- Customer dues tracking
- Supplier dues tracking
- Multiple payment methods (Cash, Bank, Online, Card)
- Payment history for all transactions

### Invoice Generation

- Automatic invoice number generation
- Print and PDF export options
- Email invoice to customers
- Professional invoice template

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm start
```

### Database Migrations

When you make changes to the Prisma schema:

```bash
npm run db:push
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Set environment variables
4. Run: `npm start`

## Security Notes

- Always change default admin password
- Use strong passwords for database
- Keep `NEXTAUTH_SECRET` secure and random
- Use HTTPS in production
- Regularly backup your database
- Keep dependencies updated

## Support

For issues and questions:
- Create an issue in the repository
- Contact: admin@pharmacy.com

## License

This project is proprietary software. All rights reserved.

## Version

Current Version: 1.0.0

---

Built with ❤️ using Next.js and TypeScript
