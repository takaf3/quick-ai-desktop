const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeTheme } = require('electron');
const path = require('path');

// Function to get the appropriate tray icon based on theme
function getTrayIcon() {
  const iconPath = nativeTheme.shouldUseDarkColors
    ? path.join(__dirname, 'menubar-icon-dark.png')
    : path.join(__dirname, 'menubar-icon-light.png');
  const icon = require('electron').nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);
  return icon;
}

let mainWindow = null;
let tray = null;
let currentShortcut = 'Control+Space'; // Default shortcut
let currentSite = 'https://grok.com/'; // Default site
let windowWidth = 1000; // Default width
let windowHeight = 900; // Default height
let appVisibility = 'menubar'; // Default visibility: 'menubar' or 'both'
let updateContextMenu;

// Initially hide dock icon (for menubar-only mode)
if (appVisibility === 'menubar') {
  app.dock.hide();
}

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
    focusTextInput();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function focusTextInput() {
  if (!mainWindow || !mainWindow.webContents) return;
  
  // Service-specific selectors for input fields
  const selectors = {
    'chatgpt': 'textarea#prompt-textarea, textarea[data-id="root"], textarea[placeholder*="Message"]',
    'claude': 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"], div.ProseMirror',
    'grok': 'textarea[placeholder*="Ask anything"], textarea[placeholder*="Ask Grok"], input[type="text"]',
    'gemini': 'rich-textarea textarea, textarea[placeholder*="Enter a prompt"], div[contenteditable="true"]',
    'openrouter': 'textarea[placeholder*="Type a message"], textarea[placeholder*="Send a message"], input[type="text"]'
  };
  
  // Determine which service we're using
  let serviceKey = 'grok'; // default
  if (currentSite.includes('chatgpt')) serviceKey = 'chatgpt';
  else if (currentSite.includes('claude')) serviceKey = 'claude';
  else if (currentSite.includes('gemini')) serviceKey = 'gemini';
  else if (currentSite.includes('openrouter')) serviceKey = 'openrouter';
  
  const selector = selectors[serviceKey];
  
  mainWindow.webContents.executeJavaScript(`
    (function() {
      let attempts = 0;
      const maxAttempts = 10;
      
      function tryFocus() {
        const elements = document.querySelectorAll('${selector}');
        let focused = false;
        
        for (const element of elements) {
          if (element && !element.disabled && element.offsetParent !== null) {
            element.focus();
            element.click && element.click();
            focused = true;
            break;
          }
        }
        
        if (!focused && attempts < maxAttempts) {
          attempts++;
          setTimeout(tryFocus, 500);
        }
      }
      
      tryFocus();
    })();
  `);
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
      focusTextInput();
    }
  }
}


app.whenReady().then(async () => {
  // Create tray icon
  tray = new Tray(getTrayIcon());

  // Update tray icon when system theme changes
  nativeTheme.on('updated', () => {
    tray.setImage(getTrayIcon());
  });
  
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
      {
        label: 'App Visibility',
        submenu: [
          {
            label: 'Menu Bar Only',
            type: 'radio',
            checked: appVisibility === 'menubar',
            click: () => changeAppVisibility('menubar')
          },
          {
            label: 'Menu Bar + Dock',
            type: 'radio',
            checked: appVisibility === 'both',
            click: () => changeAppVisibility('both')
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
    // Focus input after changing sites
    mainWindow.webContents.once('did-finish-load', () => {
      focusTextInput();
    });
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

// Function to change app visibility
function changeAppVisibility(visibility) {
  appVisibility = visibility;
  
  // Handle dock visibility
  if (visibility === 'menubar') {
    if (app.dock) app.dock.hide();
  } else if (visibility === 'both') {
    if (app.dock && !app.dock.isVisible()) app.dock.show();
  }
  
  // Always ensure tray exists
  if (!tray) {
    tray = new Tray(getTrayIcon());
    tray.setToolTip(`Quick AI Desktop`);
    
    // Update tray icon when system theme changes
    nativeTheme.on('updated', () => {
      tray.setImage(getTrayIcon());
    });
  }
  
  updateContextMenu();
}

app.on('will-quit', () => {
  // Unregister global shortcut
  globalShortcut.unregisterAll();
});