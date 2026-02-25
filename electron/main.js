// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Ace Hardware POS",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // During development, load your React dev server
  win.loadURL('http://localhost:5173'); 
  
  // win.setMenuBarVisibility(false); // Optional: Hide the menu for a cleaner POS look
}

// Handle Receipt Printing
ipcMain.on('print-receipt', (event, cartData) => {
  console.log("Printing receipt for:", cartData);
  // Logic for thermal printer integration goes here
});

// Handle Local Database Saving
ipcMain.handle('save-sale-to-db', async (event, saleData) => {
  // You would use a library like 'sqlite3' or 'better-sqlite3' here
  console.log("Saving to local hardware DB:", saleData);
  return { success: true };
});

app.whenReady().then(createWindow);