# Quick Setup Guide - Pharmacy Management System

## Prerequisites Check
Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ npm or yarn package manager

## Step-by-Step Setup

### Step 1: Install Dependencies
Open a **new Command Prompt** (cmd) or **PowerShell as Administrator** and run:

```bash
npm install
```

**Note:** If you encounter PowerShell execution policy issues, either:
- Open Command Prompt (cmd) instead, OR
- Run PowerShell as Administrator and execute:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### Step 2: Create Environment File
Create a file named `.env` in the root directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pharmacy_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production-use-long-random-string"

# Environment
NODE_ENV="development"
```

**Important:** Replace `yourpassword` with your PostgreSQL password!

### Step 3: Create PostgreSQL Database
Open **pgAdmin** or **psql** command line and run:

```sql
CREATE DATABASE pharmacy_db;
```

Or using psql command line:
```bash
psql -U postgres
CREATE DATABASE pharmacy_db;
\q
```

### Step 4: Initialize Database Schema
Run these commands one by one:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed sample data (optional but recommended)
npx prisma db seed
```

### Step 5: Start the Development Server
```bash
npm run dev
```

### Step 6: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Step 7: Login with Default Credentials
```
Username: admin
Password: admin123
```

**⚠️ Important:** Change the default password after first login!

---

## Troubleshooting

### Issue: npm install fails
**Solution:** 
- Try running Command Prompt as Administrator
- Or use `yarn install` if you have Yarn installed

### Issue: Prisma commands not working
**Solution:**
```bash
npm install -D prisma
npx prisma generate
```

### Issue: Database connection error
**Solution:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database `pharmacy_db` exists
- Verify username and password are correct

### Issue: Port 3000 already in use
**Solution:**
```bash
# Use a different port
PORT=3001 npm run dev
```

### Issue: NEXTAUTH_SECRET error
**Solution:**
- Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- Add it to .env file

---

## Quick Test Commands

### Test Database Connection
```bash
npx prisma studio
```
This opens Prisma Studio at http://localhost:5555 to view your data

### View All Routes
Once the server is running, visit:
- http://localhost:3000 - Home page
- http://localhost:3000/login - Login page

### Test API Endpoints
You can use tools like:
- **Postman** - Import API endpoints
- **Thunder Client** (VS Code extension)
- **curl** commands

Example API test:
```bash
# After logging in, test the dashboard stats
curl http://localhost:3000/api/dashboard/stats
```

---

## Project Structure

```
Pharmacy/
├── app/
│   ├── api/          # All API endpoints
│   └── (pages)       # Frontend pages
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Sample data
├── lib/              # Utilities and helpers
├── .env              # Environment variables (create this)
└── package.json      # Dependencies
```

---

## Next Steps After Setup

1. ✅ Change default admin password
2. ✅ Add your medicines to inventory
3. ✅ Add customers and suppliers
4. ✅ Configure system settings
5. ✅ Start making sales!

---

## Need Help?

- Check [README.md](./README.md) for detailed documentation
- See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
- Review [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for feature overview

---

## Common npm Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run db:push     # Update database schema
npm run db:seed     # Seed sample data
npm run db:studio   # Open Prisma Studio
```

---

Good luck! 🚀
