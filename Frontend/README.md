# 🎨 Hardware Store Frontend

A high-performance, premium user interface built with **React** and **Vite**. The design follows a high-density, "Nintendo-inspired" aesthetic, optimized for professional hardware store environments.

---

## ✨ UI Design System

### 1. Aesthetics
- **High Contrast**: Vibrant reds and deep dark modes for maximum legibility.
- **Glassmorphism**: Subtle translucency and blurred backgrounds for a modern, layered feel.
- **Interactive Micro-animations**: Powered by **Framer Motion** for a responsive, "alive" experience.
- **Responsive Layout**: Designed for 1400x900 viewport but fully responsive for tablets and smaller screens.

### 2. Core Components
- **Sidebar**: Viewport-locked navigation with active state tracking.
- **POS Terminal**: A heavy-duty checkout interface with dynamic cart logic and keyboard shortcut support.
- **Dashboard Stats**: Real-time KPI tracking using custom SVG icons and data visualization.

---

## 🛠️ Technical Implementation

- **State Management**: React Context API for Global Auth and Theme state.
- **Routing**: `wouter` for lightweight, fast page transitions.
- **Styling**: **Tailwind CSS** with custom configuration for the "Nintendo" design tokens.
- **Form Handling**: **React Hook Form** + **Zod** for real-time validation.
- **Icons**: **Lucide React** for consistent, stroke-based iconography.

---

## 🚀 Running the Frontend

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 📂 Key Folders
- `/src/components`: Reusable UI primitives (Buttons, Modals, Cards).
- `/src/pages`: Main application views (Dashboard, POS, Inventory, Payroll).
- `/src/context`: Global application state providers.
- `/src/lib`: Axios configurations and utility functions.
- `/src/services`: API abstraction layer.
