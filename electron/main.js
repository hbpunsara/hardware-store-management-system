// electron/main.js
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

const SERVER_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'http://127.0.0.1';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Hardware Store POS',
    backgroundColor: '#F5F5F5',
    show: false, // Don't show until ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Hide the default menu bar for a clean POS look
  Menu.setApplicationMenu(null);

  // Load the web app
  win.loadURL(SERVER_URL).catch(() => {
    // If server isn't ready yet, show a friendly message
    win.loadURL(`data:text/html,
      <html>
        <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F5F5F5;">
          <div style="text-align:center;">
            <h2>⏳ Waiting for dev server...</h2>
            <p>Make sure the frontend is running either via Docker or locally: <code>cd Frontend &amp;&amp; npm run dev</code></p>
            <button onclick="window.location.href='${SERVER_URL}'" 
              style="margin-top:16px;padding:10px 24px;background:#E60012;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">
              Retry
            </button>
          </div>
        </body>
      </html>
    `);
  });

  // Show window gracefully once content has loaded
  win.once('ready-to-show', () => {
    win.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  return win;
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Receipt Printing
ipcMain.on('print-receipt', (event, cartData) => {
  console.log('[Electron] Printing receipt for:', cartData);
  // TODO: Add thermal printer integration here
});

// Local Database Save
ipcMain.handle('save-sale-to-db', async (event, saleData) => {
  console.log('[Electron] Saving sale to local DB:', saleData);
  // TODO: Use better-sqlite3 for offline-first saves
  return { success: true };
});