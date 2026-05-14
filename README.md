# 🛠️ Hardware Store Management System (Local-First Architecture)

A state-of-the-art, full-stack POS and ERP solution designed for hardware retail. This system leverages a **Local-First Synchronization Architecture**, ensuring zero-latency operations while maintaining real-time cloud backups via Supabase.

---

## 🌟 Premium Features

- **⚡ Zero-Latency POS**: Optimized checkout interface with barcode support, loyalty integration, and multi-method payments.
- **📦 Smart Inventory**: Real-time stock tracking with automated low-stock alerts, supplier management, and dynamic product catalogs.
- **⚖️ Dual-Database Sync**: Operations happen locally for speed and are automatically reconciled with the cloud in the background.
- **💰 Automated Payroll**: Integrated attendance tracking (QR/Manual) with automated calculation of overtime, allowances, and itemized deductions.
- **📊 AI-Powered Insights**: Built-in Python ML models for:
  - **Demand Forecasting**: Predict stock needs based on historical trends.
  - **Market Basket Analysis**: Identify product bundling opportunities.
  - **Seasonal Trends**: Optimization of stock levels for peak seasons.
- **🎨 Nintendo-Inspired UI**: A premium, high-density dashboard built for high-performance desktop and tablet use.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Electron App / Browser] -->|HTTP| B[Backend Node.js]
    B -->|SQL| C[(Local Postgres)]
    B -->|Background Sync| D[(Supabase Cloud)]
    B -->|IPC/Internal| E[Python ML Service]
    E -->|Analyze| C
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod |
| **ORM** | Drizzle ORM (Type-safe SQL queries) |
| **Database** | PostgreSQL (Primary Local Node + Remote Supabase Sync) |
| **Desktop** | Electron (Native Windows/Mac/Linux support) |
| **Analytics** | Python (Pandas, Scikit-learn) |
| **DevOps** | Docker, Docker Compose, Healthchecks |

---

## 🚀 Quick Start (Docker)

The fastest way to launch the full system is using Docker Compose.

```bash
# Clone the repository
git clone https://github.com/hbpunsara/hardware-store-management-system.git
cd hardware-store-management-system

# Build and start all services (Frontend, Backend, Postgres, Adminer)
docker compose up --build -d

# (Optional) Start the ML Analytics Pipeline
docker compose --profile ml up -d
```

- **Frontend**: [http://localhost](http://localhost) (Port 80)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Database UI**: [http://localhost:8080](http://localhost:8080) (Adminer)

---

## 💻 Local Development

### 1. Environment Configuration
Create a `.env` file in the root (and `backend/`) with:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hardware_db
REMOTE_DATABASE_URL=your_supabase_url_here
JWT_SECRET=your_secure_secret
```

### 2. Manual Setup
```bash
# Setup Backend
cd backend
npm install
npm run db:push    # Push schema to local DB
npm run db:seed    # Seed initial data (admin/admin123)
npm run dev

# Setup Frontend
cd Frontend
npm install
npm run dev
```

---

## 📑 Module Documentation

- [**Backend**](./backend/README.md): API documentation, Sync Logic, and Storage Layer.
- [**Frontend**](./Frontend/README.md): UI Components, State Management, and Design System.
- [**Electron**](./electron/README.md): Desktop packaging and native capabilities.
- [**Docker**](./docker/README.md): Deployment recipes and container orchestration.

---

## 🤝 Support
For any questions regarding deployment or custom feature requests, please contact the development team via GitHub Issues.
