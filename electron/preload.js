// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Print receipt via thermal printer
  printReceipt: (cartData) => ipcRenderer.send('print-receipt', cartData),

  // Save a sale to the local SQLite database
  saveSale: (saleData) => ipcRenderer.invoke('save-sale-to-db', saleData),

  // Listen for low stock alerts pushed from the main process
  onLowStock: (callback) => ipcRenderer.on('low-stock-alert', (_event, value) => callback(value)),

  // Generic send/receive helpers
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (_event, ...args) => func(...args)),
});