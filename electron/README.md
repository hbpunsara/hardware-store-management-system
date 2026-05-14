# 📦 Hardware Store Desktop (Electron)

This package wraps the Hardware Store Management System into a native desktop application, providing a standalone experience without the need for a web browser.

---

## ⚡ Features
- **Native Window**: 1400x900 viewport-locked experience.
- **Auto-Backend Start**: The Electron main process automatically spawns the Node.js backend server on startup.
- **Production Optimized**: Serves built assets from `Frontend/dist` for maximum performance.
- **Native Receipts**: Integrated with system printing for hardware thermal printers.

---

## 🛠️ Development

### Prerequisites
1.  Ensure the **Backend** is built: `cd backend && npm run build`
2.  Ensure the **Frontend** is built: `cd Frontend && npm run build`

### Running the App
```bash
npm install
npm run dev
```

---

## 🏗️ Packaging for Distribution

To create a Windows installer (`.exe`):
```bash
npm run dist
```
The installer will be generated in the `../release` directory.

---

## ⚙️ Configuration
The Electron app can be configured to point to a local backend or a Dockerized backend via the `USE_DOCKER` environment variable in `main.js`.
