// electron/main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
// Use Docker if explicitly told to, or if we are in development and the Docker frontend is expected
const USE_DOCKER = process.env.USE_DOCKER === 'true' || isDev;
const SERVER_URL = USE_DOCKER ? 'http://localhost' : 'http://localhost:5173';
let backendProcess = null;

function startBackend() {
  let backendPath = isDev
    ? path.join(__dirname, '../backend/dist/index.js')
    : path.join(__dirname, 'backend/dist/index.js').replace('app.asar', 'app.asar.unpacked');

  const userDataPath = app.getPath('userData');
  const sqlitePath = path.join(userDataPath, 'hardware_store.db');

  console.log('[Electron] Starting backend at:', backendPath);
  console.log('[Electron] SQLite path:', sqlitePath);

  if (USE_DOCKER) {
    console.log('[Electron] Running in Docker Mode: Skipping local backend startup.');
    return;
  }

  if (!fs.existsSync(backendPath)) {
    console.warn('[Electron] Local backend dist not found. Ensure Docker is running or build the backend.');
    return;
  }

  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: 5000,
      SQLITE_PATH: sqlitePath
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data}`);
  });

  backendProcess.on('exit', (code) => {
    console.log(`[Electron] Backend exited with code ${code}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Hardware Store POS',
    backgroundColor: '#F5F5F5',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // Redirect /api and /uploads to the local backend
  const filter = {
    urls: ['file:///*/api/*', 'file:///*/uploads/*', 'file:///*/backend/*', 'file:///*/Frontend/*']
  };

  win.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
    const url = details.url;
    let newUrl = url;

    if (url.includes('/api/')) {
      newUrl = 'http://localhost:5000/api/' + url.split('/api/')[1];
    } else if (url.includes('/uploads/')) {
      newUrl = 'http://localhost:5000/uploads/' + url.split('/uploads/')[1];
    }

    if (newUrl !== url) {
      console.log(`[Electron] Redirecting ${url} -> ${newUrl}`);
      callback({ redirectURL: newUrl });
    } else {
      callback({});
    }
  });

  Menu.setApplicationMenu(null);

  if (USE_DOCKER) {
    console.log('[Electron] Loading frontend from Docker at:', SERVER_URL);
    win.loadURL(SERVER_URL);
  } else if (isDev) {
    win.loadURL(SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, 'Frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error('[Electron] Production index.html not found. Loading localhost fallback.');
      win.loadURL('http://localhost');
    }
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  return win;
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) backendProcess.kill();
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.on('print-receipt', (event, cartData) => {
  console.log('[Electron] Printing receipt for:', cartData);
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
      if (!success) console.log('[Electron] Print failed:', failureReason);
    });
  }
});

ipcMain.handle('save-sale-to-db', async (event, saleData) => {
  console.log('[Electron] Saving sale to local DB:', saleData);
  return { success: true };
});