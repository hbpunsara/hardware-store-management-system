window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload loaded')
})

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args))
})

// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Function to send print data to the main process
  printReceipt: (cartData) => ipcRenderer.send('print-receipt', cartData),
  
  // Function to save a sale to the local SQLite database
  saveSale: (saleData) => ipcRenderer.invoke('save-sale-to-db', saleData),

  // Listen for low stock alerts from the system
  onLowStock: (callback) => ipcRenderer.on('low-stock-alert', (_event, value) => callback(value))
});