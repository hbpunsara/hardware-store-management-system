# Hardware Store Management System

A comprehensive, full-stack web application designed to streamline and manage the daily operations of a modern hardware store. The system includes a robust Point of Sale (POS) interface, inventory tracking, employee management, automated payroll processing, financial oversight, and AI-driven analytics.

## 🚀 Features

- **Dashboard**: A high-level overview of total sales, transactions, average order value, and low stock alerts.
- **Point of Sale (POS) System**: Seamless checkout process with barcode/SKU search, cart management, varied payment methods, and receipt generation.
- **Product & Inventory Management**: Full CRUD capabilities for tracking hardware materials, tools, and supplies. Includes stock tracking and supplier information.
- **Employee Management**: Staff attendance tracking (check-in/check-out) and role assignments.
- **Automated Payroll**: Calculates base salaries, overtime, allowances, and deductions automatically based on employee roles, and generates digital payslips.
- **Finance & Accounting**: Track all income and expenses, categorizing them appropriately for accurate cash flow analysis.
- **AI-Driven Analytics & Reports**:
  - **Forecasting**: Predict future sales trends based on historical data.
  - **Market Basket Analysis**: Identify frequently co-purchased items to optimize product bundling.
  - **Insights & Recommendations**: Automated alerts for restocking, pricing opportunities, and staff optimization.

## 🛠️ Technology Stack

**Frontend Framework**
- React 18
- Vite for fast, modern web builds
- Tailwind CSS & Framer Motion for styling and animations
- Lucide React for consistent iconography
- Wouter for lightweight routing
- Radix UI for accessible component primitives

**Backend Server**
- Node.js & Express.js
- Drizzle ORM for type-safe database interactions
- PostgreSQL database via Neon Serverless
- Zod for comprehensive schema validation and type safety

---

## 💻 Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- A PostgreSQL Database (e.g., Neon serverless DB, or local Postgres)

### 1. Database Configuration
Create a `.env` file in the `backend` directory with your PostgreSQL connection string:
```env
DATABASE_URL=postgresql://user:password@hostname/dbname
```

### 2. Backend Setup
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```

Push the database schema using Drizzle:
```bash
npm run db:push
```

*(Optional)* Seed the database with initial data:
```bash
npm run db:seed
```

Start the backend development server:
```bash
npm run dev
```
*The backend server will run on port 5000 by default.*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd Frontend
npm install
npm run dev
```
*The frontend Vite server will run on port 5173 by default. Open `http://localhost:5173` in your browser.*

---

## 🏗️ Project Structure

```
hardware-store-app/
├── backend/       # Node.js/Express backend API
│   ├── server/    # API routes, controllers, DB storage
│   ├── shared/    # Drizzle SQL Schemas and DTOs
│   └── README.md  # Backend-specific readme
├── Frontend/      # React/Vite web application
│   ├── client/    # UI React code, UI services, context
│   └── README.md  # Frontend-specific readme
└── README.md      # Root project documentation
```

## 🤝 Contributing
1. Clone the repository
2. Create a new feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
