const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

// Hide dock icon
app.dock.hide();

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false, // Don't show window initially
    skipTaskbar: true // Hide from taskbar
  });

  // Load Grok
  mainWindow.loadURL('https://grok.com/');

  // Focus on chat input when page is loaded
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      setTimeout(() => {
        const chatInput = document.querySelector('textarea[placeholder*="chat"], input[placeholder*="chat"]');
        if (chatInput) {
          chatInput.focus();
        }
      }, 1000);
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function toggleWindow() {
  if (mainWindow === null) {
    createWindow();
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });
  } else {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
      // Refocus on chat input when showing window
      mainWindow.webContents.executeJavaScript(`
        setTimeout(() => {
          const chatInput = document.querySelector('textarea[placeholder*="chat"], input[placeholder*="chat"]');
          if (chatInput) {
            chatInput.focus();
          }
        }, 1000);
      `);
    }
  }
}

app.whenReady().then(() => {
  // Create tray icon
  tray = new Tray(path.join(__dirname, 'menubar-icon.png'));
  tray.setToolTip('Quick Grok Desktop');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Grok', click: toggleWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);

  // Register global shortcut
  globalShortcut.register('Control+Space', toggleWindow);

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister global shortcut
  globalShortcut.unregisterAll();
});