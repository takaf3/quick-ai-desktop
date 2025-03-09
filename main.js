const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let currentShortcut = 'Control+Space'; // Default shortcut
let currentSite = 'https://grok.com/'; // Default site
let updateContextMenu;

// Hide dock icon
app.dock.hide();

function createWindow() {
  const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 'Grok';
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 900,
    title: `Quick ${serviceName} Desktop`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false, // Don't show window initially
    skipTaskbar: true // Hide from taskbar
  });

  // Load the selected site
  mainWindow.loadURL(currentSite);

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
  
  updateContextMenu = () => {
    // Update tooltip based on current site
    const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 'Grok';
    tray.setToolTip(`Quick ${serviceName} Desktop`);
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: `Open ${currentSite.includes('chatgpt') ? 'ChatGPT' : 'Grok'}`, 
        click: toggleWindow 
      },
      { type: 'separator' },
      {
        label: 'AI Service',
        submenu: [
          {
            label: 'ChatGPT',
            type: 'radio',
            checked: currentSite === 'https://chatgpt.com/',
            click: () => changeSite('https://chatgpt.com/')
          },
          {
            label: 'Grok',
            type: 'radio',
            checked: currentSite === 'https://grok.com/',
            click: () => changeSite('https://grok.com/')
          }
        ]
      },
      { 
        label: 'Keyboard Shortcut',
        submenu: [
          { 
            label: 'Ctrl+Space', 
            type: 'radio',
            checked: currentShortcut === 'Control+Space',
            click: () => changeShortcut('Control+Space')
          },
          { 
            label: 'Ctrl+Shift+Space', 
            type: 'radio',
            checked: currentShortcut === 'Control+Shift+Space',
            click: () => changeShortcut('Control+Shift+Space')
          }
        ]
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setContextMenu(contextMenu);
  };
  
  updateContextMenu();
  tray.on('click', toggleWindow);

  // Register global shortcut
  globalShortcut.register(currentShortcut, toggleWindow);

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

// Function to change shortcut
function changeShortcut(newShortcut) {
  globalShortcut.unregister(currentShortcut);
  currentShortcut = newShortcut;
  globalShortcut.register(currentShortcut, toggleWindow);
  updateContextMenu(); // Update the menu to reflect the new shortcut
}

// Function to change site
function changeSite(newSite) {
  currentSite = newSite;
  const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 'Grok';
  
  if (mainWindow !== null) {
    mainWindow.loadURL(currentSite);
    mainWindow.setTitle(`Quick ${serviceName} Desktop`);
  }
  updateContextMenu(); // Update the menu to reflect the new site
}

app.on('will-quit', () => {
  // Unregister global shortcut
  globalShortcut.unregisterAll();
});