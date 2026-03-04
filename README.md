# Hardware Store Management System

A comprehensive, full-stack, and multi-platform application designed to streamline and modernize the daily operations of a hardware store. The system is built with a React frontend, Node.js backend, and packaged as an Electron desktop application. It features a robust Point of Sale (POS) interface, inventory tracking, employee management, automated payroll processing, financial oversight, and AI-driven analytics.

---

## 🚀 Features

- **Dashboard**: A high-level overview of total sales, transactions, average order value, and low stock alerts.
- **Point of Sale (POS) System**: Seamless checkout process with barcode/SKU search, cart management, varied payment methods, receipt generation, and loyalty point integration.
- **Product & Inventory Management**: Full CRUD capabilities for tracking hardware materials, tools, and supplies. Includes stock tracking, supplier information, barcode generation, and low-stock alerts.
- **Employee & Role Management (RBAC)**: Manage staff profiles, attendance tracking (check-in/check-out), and role-based access control (Admin, Cashier, Inventory Manager) to secure sensitive routes.
- **Automated Payroll**: Calculates base salaries, overtime, allowances, and deductions automatically based on employee roles, and generates digital payslips.
- **Finance & Accounting**: Track all income and expenses, categorizing them appropriately for accurate cash flow analysis.
- **Customer Loyalty Program**: Track customer purchases, award loyalty points on sale transactions, and allow point redemptions for discounts.
- **AI-Driven Analytics & Reports**:
  - **Forecasting**: Predict future sales trends based on historical data.
  - **Market Basket Analysis**: Identify frequently co-purchased items to optimize product bundling.
  - **Insights & Recommendations**: Automated alerts for restocking, pricing opportunities, and staff optimization.
- **Multi-Platform Support**: Run the application as a standard web application or as a standalone desktop application via Electron.

---

## 🛠️ Technology Stack

**Frontend Framework**
- **React 18** with **Vite** for fast, modern web builds
- **Tailwind CSS** & **Framer Motion** for styling and smooth animations
- **Lucide React** & **React Icons** for consistent iconography
- **Wouter** for lightweight routing
- **Radix UI** & **Shadcn UI** for accessible, customizable component primitives
- **React Hook Form** + **Zod** for robust form handling and validation

**Backend Server**
- **Node.js** & **Express.js**
- **Drizzle ORM** for type-safe database interactions
- **Database**: Dual setup supporting both local **SQLite (Better-SQLite3)** for offline-first development and remote **PostgreSQL (Neon Serverless/Supabase)** for production.
- **Zod** for comprehensive schema validation and type safety
- **Bcryptjs** & **JSONWebToken (JWT)** for secure authentication
- **PDFKit** for generating receipts and reports

**Desktop Application**
- **Electron** to wrap the web UI into a native desktop experience

---

## 🏗️ Project Structure

```text
hardware-store-app/
├── backend/                  # Node.js/Express backend API & Database
│   ├── server/               # API routes, controllers, services, db config
│   ├── shared/               # Drizzle SQL Schemas, DTOs, Zod Types
│   ├── package.json          # Backend dependencies
│   └── hardware_store_local.db # Auto-generated local SQLite database
├── Frontend/                 # React/Vite web application
│   ├── client/               # React UI code, contexts, pages, components
│   └── package.json          # Frontend dependencies
├── electron/                 # Electron Desktop wrapper
│   ├── main.js               # Electron main process
│   ├── preload.js            # Electron preload scripts
│   └── package.json          # Electron dependencies
├── docker/                   # Dockerfiles for containerization
├── docker-compose.yml        # Docker composition for full-stack deployment
├── DB_GUIDE.md               # Guide to database scaling and ML Service integration
└── README.md                 # Root project documentation (this file)
```

---

## 💻 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Git
- (Optional) A PostgreSQL Database (e.g., Neon serverless DB, Supabase, or local Postgres)
- (Optional) Docker & Docker Compose (for containerized deployment)

### 1. Database Configuration
By default, the backend will use a local SQLite database (`hardware_store_local.db`) allowing you to run the application entirely offline. 

To use a remote PostgreSQL database, create a `.env` file in the `backend` directory with your PostgreSQL connection string:
```env
DATABASE_URL=postgresql://user:password@hostname/dbname
```

### 2. Backend Setup
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```

Push the database schema using Drizzle ORM:
```bash
npm run db:push
```

Seed the database with initial dummy data (products, users, roles, etc.):
```bash
npm run db:seed
```

Start the backend development server:
```bash
npm run dev
```
*The backend server will run on `http://localhost:5000` by default.*

### 3. Frontend Web Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd Frontend
npm install
npm run dev
```
*The frontend Vite server will run on `http://localhost:5173` by default. Open this URL in your browser.*

### 4. Electron Desktop App Setup
If you want to run the application as a standalone desktop executable, ensure your Frontend development server is running on port 5173, then:

Open a new terminal and navigate to the electron directory:
```bash
cd electron
npm install
npm start
```

### 5. Docker Setup (Alternative)
You can launch the entire stack (Frontend + Backend) using Docker. Ensure Docker is running on your machine:

```bash
docker-compose up --build
```
- The backend will map to port `5000`.
- The frontend will map to port `80`.

---

## 📚 Technical & Architecture Notes

- **Offline-First Capabilities**: The backend is configured to work natively with SQLite. You can transition to PostgreSQL by utilizing the `DB_GUIDE.md` instructions and supplying a `DATABASE_URL` environment variable. 
- **Role-Based Access Control (RBAC)**: The system restricts POS, Inventory, and Admin features according to the connected user's assigned role.
- **ML Analytics Integration**: A separate Python-based ML service can connect to the shared database for predictions (sales forecasting, market basket analysis). Refer to `DB_GUIDE.md` for connection instructions.

---

## 🤝 Contributing
1. Clone the repository
2. Create a new feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
