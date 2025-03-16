const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let currentShortcut = 'Control+Space'; // Default shortcut
let currentSite = 'https://grok.com/'; // Default site
let windowWidth = 1000; // Default width
let windowHeight = 900; // Default height
let updateContextMenu;

// Hide dock icon
app.dock.hide();

function createWindow() {
  const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 
                     currentSite.includes('claude') ? 'Claude' : 
                     currentSite.includes('gemini') ? 'Gemini' :
                     currentSite.includes('openrouter') ? 'OpenRouter' : 'Grok';
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
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
    const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 
                       currentSite.includes('claude') ? 'Claude' : 
                       currentSite.includes('gemini') ? 'Gemini' :
                       currentSite.includes('openrouter') ? 'OpenRouter' : 'Grok';
    tray.setToolTip(`Quick ${serviceName} Desktop`);
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: `Open ${currentSite.includes('chatgpt') ? 'ChatGPT' : 
               currentSite.includes('claude') ? 'Claude' : 
               currentSite.includes('gemini') ? 'Gemini' :
               currentSite.includes('openrouter') ? 'OpenRouter' : 'Grok'}`, 
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
            label: 'Claude',
            type: 'radio',
            checked: currentSite === 'https://claude.ai/',
            click: () => changeSite('https://claude.ai/')
          },
          {
            label: 'Grok',
            type: 'radio',
            checked: currentSite === 'https://grok.com/',
            click: () => changeSite('https://grok.com/')
          },
          {
            label: 'Gemini',
            type: 'radio',
            checked: currentSite === 'https://gemini.google.com/app',
            click: () => changeSite('https://gemini.google.com/app')
          },
          {
            label: 'OpenRouter',
            type: 'radio',
            checked: currentSite === 'https://openrouter.ai/chat',
            click: () => changeSite('https://openrouter.ai/chat')
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
      {
        label: 'Window Size',
        submenu: [
          {
            label: 'Small (800x600)',
            type: 'radio',
            checked: windowWidth === 800 && windowHeight === 600,
            click: () => changeWindowSize(800, 600)
          },
          {
            label: 'Medium (1000x900)',
            type: 'radio',
            checked: windowWidth === 1000 && windowHeight === 900,
            click: () => changeWindowSize(1000, 900)
          },
          {
            label: 'Large (1200x1000)',
            type: 'radio',
            checked: windowWidth === 1200 && windowHeight === 1000,
            click: () => changeWindowSize(1200, 1000)
          },
          {
            label: 'Tall (1000x1400)',
            type: 'radio',
            checked: windowWidth === 1000 && windowHeight === 1400,
            click: () => changeWindowSize(1000, 1400)
          }
        ]
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setContextMenu(contextMenu);
  };
  
  updateContextMenu();

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
  const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 
                     currentSite.includes('claude') ? 'Claude' : 
                     currentSite.includes('gemini') ? 'Gemini' :
                     currentSite.includes('openrouter') ? 'OpenRouter' : 'Grok';
  
  if (mainWindow !== null) {
    mainWindow.loadURL(currentSite);
    mainWindow.setTitle(`Quick ${serviceName} Desktop`);
  }
  updateContextMenu(); // Update the menu to reflect the new site
}

// Function to change window size
function changeWindowSize(width, height) {
  windowWidth = width;
  windowHeight = height;
  
  if (mainWindow !== null) {
    mainWindow.setSize(width, height);
  }
  updateContextMenu();
}

app.on('will-quit', () => {
  // Unregister global shortcut
  globalShortcut.unregisterAll();
});