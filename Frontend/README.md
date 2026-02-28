# Frontend - Hardware Store Management System

This directory contains the user interface and client-side logic for the Hardware Store Management System.

## Architecture

The frontend is a Single-Page Application (SPA) built with **React** and powered by **Vite** for incredibly fast Hot Module Replacement (HMR) and optimized production builds.

### Key Tools & Libraries
- **React 18**: The core framework providing reactive, component-based UIs.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI styling, coupled with `tw-animate-css` for animations.
- **Wouter**: A minimalist routing library for navigating between pages without refreshing.
- **Radix UI**: Unstyled, accessible component primitives (modals, dialogs, sliders) that form the baseline of custom components.
- **Lucide React**: Clean and beautiful SVG icons.
- **TanStack React Query**: Used for data fetching, caching, and state synchronization with the backend API.

## Project Structure (Client)

```
Frontend/
├── client/
│   ├── src/
│   │   ├── components/  # Reusable UI elements (Buttons, Layout components, Cards)
│   │   ├── context/     # Application-wide React Contexts (e.g., AuthContext)
│   │   ├── pages/       # Distinct route screens (Dashboard, POS, Finance, etc.)
│   │   ├── services/    # Pure JavaScript modules wrapping native `fetch()` calls to the backend
│   │   ├── App.tsx      # Core application shell and router configuration
│   │   └── main.tsx     # React rendering entry
│   ├── public/          # Static assets
│   └── index.html       # Vite HTML entry point
├── package.json         # Frontend dependencies and scripts
└── vite.config.ts       # Vite bundler configurations
```

## Available Scripts

From the `Frontend` directory, you can run:

- `npm run dev`: Starts the Vite development server (usually on HTTP port `5173`).
- `npm run build`: Compiles and bundles the application for production deployment into the `client/dist` directory.
- `npm run check`: Runs the TypeScript compiler to check for type issues.
- `npm run preview`: Previews the compiled production build locally.

## Design Aesthetic
The dashboard components and UI cards feature a distinctive, clean red-and-white custom theme (referred to as the "Nintendo" aesthetic in the source code). This ensures high contrast and clarity for store operators out on the store floor.
