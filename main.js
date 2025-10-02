const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeTheme, shell } = require('electron');
const path = require('path');

// Function to get the appropriate tray icon based on theme
function getTrayIcon() {
  const iconName = nativeTheme.shouldUseDarkColors
    ? 'menubar-icon-dark'
    : 'menubar-icon-light';
  
  // Create nativeImage from path - Electron will automatically look for @2x version
  const iconPath = path.join(__dirname, `${iconName}.png`);
  const icon = require('electron').nativeImage.createFromPath(iconPath);
  
  // Mark as template image for proper theming on macOS
  icon.setTemplateImage(true);
  return icon;
}

let mainWindow = null;
let tray = null;
let currentShortcut = 'Control+Space'; // Default shortcut
let splitViewShortcut = 'Control+Shift+S'; // Default split view shortcut
let currentSite = 'https://grok.com/'; // Default site
let windowWidth = 1000; // Default width
let windowHeight = 900; // Default height
let appVisibility = 'menubar'; // Default visibility: 'menubar' or 'both'
let updateContextMenu;
let isSplitView = false;
let leftService = 'https://grok.com/';
let rightService = 'https://chatgpt.com/';

// Initially hide dock icon (for menubar-only mode)
if (appVisibility === 'menubar') {
  app.dock.hide();
}

function createWindow() {
  const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 
                     currentSite.includes('claude') ? 'Claude' : 
                     currentSite.includes('gemini') ? 'Gemini' :
                     currentSite.includes('openrouter') ? 'OpenRouter' : 
                     currentSite.includes('t3.chat') ? 'T3' : 'Grok';
  
  const width = isSplitView ? windowWidth * 2 : windowWidth;
  const title = isSplitView ? 'Quick AI Desktop - Split View' : `Quick ${serviceName} Desktop`;
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: width,
    height: windowHeight,
    title: title,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true // Enable webview tag for split view
    },
    show: false, // Don't show window initially
    skipTaskbar: true // Hide from taskbar
  });

  // Open links that would spawn a new window in the system browser instead
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load content based on view mode
  if (isSplitView) {
    loadSplitView();
  } else {
    mainWindow.loadURL(currentSite);
    // Focus on chat input when page is loaded
    mainWindow.webContents.on('did-finish-load', () => {
      focusTextInput();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    isSplitView = false;
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
    'openrouter': 'textarea[placeholder*="Type a message"], textarea[placeholder*="Send a message"], input[type="text"]',
    't3': 'textarea[placeholder*="Type a message"], textarea, input[type="text"]'
  };
  
  // Determine which service we're using
  let serviceKey = 'grok'; // default
  if (currentSite.includes('chatgpt')) serviceKey = 'chatgpt';
  else if (currentSite.includes('claude')) serviceKey = 'claude';
  else if (currentSite.includes('gemini')) serviceKey = 'gemini';
  else if (currentSite.includes('openrouter')) serviceKey = 'openrouter';
  else if (currentSite.includes('t3.chat')) serviceKey = 't3';
  
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

function toggleSplitWindow() {
  if (mainWindow === null) {
    isSplitView = true;
    createWindow();
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });
  } else {
    if (mainWindow.isVisible() && isSplitView) {
      // If split view is already visible, hide it
      mainWindow.hide();
    } else {
      // Switch to split view and show window
      if (!isSplitView) {
        toggleSplitView(true);
      }
      mainWindow.show();
      mainWindow.focus();
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
                       currentSite.includes('openrouter') ? 'OpenRouter' : 
                       currentSite.includes('t3.chat') ? 'T3' : 'Grok';
    tray.setToolTip(`Quick ${serviceName} Desktop`);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Open ${currentSite.includes('chatgpt') ? 'ChatGPT' :
               currentSite.includes('claude') ? 'Claude' :
               currentSite.includes('gemini') ? 'Gemini' :
               currentSite.includes('openrouter') ? 'OpenRouter' : 
               currentSite.includes('t3.chat') ? 'T3' : 'Grok'}`,
        click: toggleWindow
      },
      { type: 'separator' },
      {
        label: 'View Mode',
        submenu: [
          {
            label: 'Single View',
            type: 'radio',
            checked: !isSplitView,
            click: () => toggleSplitView(false)
          },
          {
            label: 'Split View',
            type: 'radio',
            checked: isSplitView,
            click: () => toggleSplitView(true)
          },
          { type: 'separator' },
          {
            label: 'Left Pane Service',
            enabled: isSplitView,
            submenu: [
              {
                label: 'ChatGPT',
                type: 'radio',
                checked: leftService === 'https://chatgpt.com/',
                click: () => changeSplitService('left', 'https://chatgpt.com/')
              },
              {
                label: 'Claude',
                type: 'radio',
                checked: leftService === 'https://claude.ai/',
                click: () => changeSplitService('left', 'https://claude.ai/')
              },
              {
                label: 'Grok',
                type: 'radio',
                checked: leftService === 'https://grok.com/',
                click: () => changeSplitService('left', 'https://grok.com/')
              },
              {
                label: 'Gemini',
                type: 'radio',
                checked: leftService === 'https://gemini.google.com/app',
                click: () => changeSplitService('left', 'https://gemini.google.com/app')
              },
              {
                label: 'OpenRouter',
                type: 'radio',
                checked: leftService === 'https://openrouter.ai/chat',
                click: () => changeSplitService('left', 'https://openrouter.ai/chat')
              },
              {
                label: 'T3',
                type: 'radio',
                checked: leftService === 'https://t3.chat/',
                click: () => changeSplitService('left', 'https://t3.chat/')
              }
            ]
          },
          {
            label: 'Right Pane Service',
            enabled: isSplitView,
            submenu: [
              {
                label: 'ChatGPT',
                type: 'radio',
                checked: rightService === 'https://chatgpt.com/',
                click: () => changeSplitService('right', 'https://chatgpt.com/')
              },
              {
                label: 'Claude',
                type: 'radio',
                checked: rightService === 'https://claude.ai/',
                click: () => changeSplitService('right', 'https://claude.ai/')
              },
              {
                label: 'Grok',
                type: 'radio',
                checked: rightService === 'https://grok.com/',
                click: () => changeSplitService('right', 'https://grok.com/')
              },
              {
                label: 'Gemini',
                type: 'radio',
                checked: rightService === 'https://gemini.google.com/app',
                click: () => changeSplitService('right', 'https://gemini.google.com/app')
              },
              {
                label: 'OpenRouter',
                type: 'radio',
                checked: rightService === 'https://openrouter.ai/chat',
                click: () => changeSplitService('right', 'https://openrouter.ai/chat')
              },
              {
                label: 'T3',
                type: 'radio',
                checked: rightService === 'https://t3.chat/',
                click: () => changeSplitService('right', 'https://t3.chat/')
              }
            ]
          }
        ]
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
          },
          {
            label: 'T3',
            type: 'radio',
            checked: currentSite === 'https://t3.chat/',
            click: () => changeSite('https://t3.chat/')
          }
        ]
      },
      {
        label: 'Keyboard Shortcuts',
        submenu: [
          {
            label: 'Single View Shortcut',
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
          {
            label: 'Split View Shortcut',
            submenu: [
              {
                label: 'Ctrl+Shift+S',
                type: 'radio',
                checked: splitViewShortcut === 'Control+Shift+S',
                click: () => changeSplitViewShortcut('Control+Shift+S')
              },
              {
                label: 'Ctrl+Alt+S',
                type: 'radio',
                checked: splitViewShortcut === 'Control+Alt+S',
                click: () => changeSplitViewShortcut('Control+Alt+S')
              },
              {
                label: 'Ctrl+Shift+D',
                type: 'radio',
                checked: splitViewShortcut === 'Control+Shift+D',
                click: () => changeSplitViewShortcut('Control+Shift+D')
              }
            ]
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

  // Register global shortcuts
  globalShortcut.register(currentShortcut, toggleWindow);
  globalShortcut.register(splitViewShortcut, toggleSplitWindow);

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

// Function to change split view shortcut
function changeSplitViewShortcut(newShortcut) {
  globalShortcut.unregister(splitViewShortcut);
  splitViewShortcut = newShortcut;
  globalShortcut.register(splitViewShortcut, toggleSplitWindow);
  updateContextMenu(); // Update the menu to reflect the new shortcut
}

// Function to change site
function changeSite(newSite) {
  currentSite = newSite;
  const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 
                     currentSite.includes('claude') ? 'Claude' : 
                     currentSite.includes('gemini') ? 'Gemini' :
                     currentSite.includes('openrouter') ? 'OpenRouter' : 
                     currentSite.includes('t3.chat') ? 'T3' : 'Grok';
  
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

// Function to load split view content
function loadSplitView() {
  if (!mainWindow) return;
  
  const leftServiceName = leftService.includes('chatgpt') ? 'ChatGPT' : 
                          leftService.includes('claude') ? 'Claude' : 
                          leftService.includes('gemini') ? 'Gemini' :
                          leftService.includes('openrouter') ? 'OpenRouter' : 
                          leftService.includes('t3.chat') ? 'T3' : 'Grok';
  
  const rightServiceName = rightService.includes('chatgpt') ? 'ChatGPT' : 
                           rightService.includes('claude') ? 'Claude' : 
                           rightService.includes('gemini') ? 'Gemini' :
                           rightService.includes('openrouter') ? 'OpenRouter' : 
                           rightService.includes('t3.chat') ? 'T3' : 'Grok';
  
  mainWindow.setTitle(`${leftServiceName} | ${rightServiceName}`);
  
  // Create HTML content with two webviews side by side
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          background: #1a1a1a; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container { 
          display: flex; 
          width: 100vw; 
          height: 100vh; 
          position: relative;
        }
        .pane { 
          height: 100%; 
          position: relative; 
          transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          overflow: hidden;
        }
        
        /* Focus mode styles */
        .pane.focused {
          position: absolute !important;
          width: 95% !important;
          z-index: 15;
          opacity: 1;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .pane.focused.left-focused {
          left: 0;
        }
        .pane.focused.right-focused {
          right: 0;
        }
        .pane.unfocused {
          position: absolute !important;
          width: 100% !important;
          opacity: 0.3;
          z-index: 10;
        }
        .pane.unfocused.left-unfocused {
          left: 0;
        }
        .pane.unfocused.right-unfocused {
          right: 0;
        }
        .pane.equal {
          flex: 1;
          opacity: 1;
          position: relative;
        }
        
        /* Click area for switching to unfocused pane */
        .switch-area {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 5%;
          cursor: pointer;
          z-index: 16;
          display: none;
          background: linear-gradient(90deg, rgba(0,0,0,0.1), transparent);
          transition: background 0.2s ease;
        }
        .switch-area:hover {
          background: linear-gradient(90deg, rgba(0,0,0,0.2), transparent);
        }
        .switch-area.left {
          left: 0;
        }
        .switch-area.right {
          right: 0;
          background: linear-gradient(-90deg, rgba(0,0,0,0.1), transparent);
        }
        .switch-area.right:hover {
          background: linear-gradient(-90deg, rgba(0,0,0,0.2), transparent);
        }
        .focus-mode .switch-area.active {
          display: block;
        }
        
        /* Tab indicators for switching panes in focus mode */
        .pane-tab {
          position: absolute;
          top: 10px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          z-index: 20;
          display: none;
          transition: all 0.2s ease;
        }
        .pane-tab:hover {
          background: rgba(0, 0, 0, 0.8);
          color: rgba(255, 255, 255, 1);
          transform: scale(1.05);
        }
        .pane-tab.left {
          left: 10px;
        }
        .pane-tab.right {
          right: 10px;
        }
        .focus-mode .pane.focused .pane-tab.inactive {
          display: block;
        }
        
        webview { 
          width: 100%; 
          height: 100%; 
        }
        
        .divider { 
          width: 3px; 
          background: #333; 
          cursor: col-resize; 
          position: relative;
          z-index: 20;
          transition: opacity 0.3s ease;
        }
        .divider:hover {
          background: #555;
        }
        .divider::after {
          content: '';
          position: absolute;
          left: -2px;
          right: -2px;
          top: 0;
          bottom: 0;
        }
        .divider.hidden {
          opacity: 0;
          pointer-events: none;
        }
        
        /* Focus mode toggle button */
        .focus-toggle {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2px 8px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
          cursor: pointer;
          z-index: 30;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.5;
        }
        .focus-toggle:hover {
          background: rgba(0, 0, 0, 0.7);
          color: rgba(255, 255, 255, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
          padding: 4px 12px;
          font-size: 11px;
          opacity: 1;
          transform: translateX(-50%) scale(1.05);
        }
        .focus-toggle.active {
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
          padding: 4px 12px;
          font-size: 11px;
          opacity: 0.9;
        }
        .focus-toggle.active:hover {
          background: rgba(255, 255, 255, 0.2);
          opacity: 1;
        }
      </style>
    </head>
    <body>
      <button class="focus-toggle" id="focus-toggle" title="Toggle Focus Mode">⎚</button>
      <div class="container" id="container">
        <div class="pane equal" id="left-pane">
          <webview src="${leftService}" id="left-webview" allowpopups></webview>
        </div>
        <div class="divider" id="divider"></div>
        <div class="pane equal" id="right-pane">
          <webview src="${rightService}" id="right-webview" allowpopups></webview>
        </div>
        <div class="switch-area left" id="switch-left"></div>
        <div class="switch-area right" id="switch-right"></div>
      </div>
      <script>
        const divider = document.getElementById('divider');
        const container = document.getElementById('container');
        const leftPane = document.getElementById('left-pane');
        const rightPane = document.getElementById('right-pane');
        const switchLeft = document.getElementById('switch-left');
        const switchRight = document.getElementById('switch-right');
        const focusToggle = document.getElementById('focus-toggle');
        const leftWebview = document.getElementById('left-webview');
        const rightWebview = document.getElementById('right-webview');
        
        let isResizing = false;
        let startX = 0;
        let startLeftWidth = 0;
        let focusMode = false;
        let focusedPane = null; // 'left', 'right', or null
        
        // Focus mode toggle
        focusToggle.addEventListener('click', () => {
          focusMode = !focusMode;
          focusToggle.innerHTML = focusMode ? '◉' : '⎚';
          focusToggle.title = focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode';
          focusToggle.classList.toggle('active', focusMode);
          container.classList.toggle('focus-mode', focusMode);
          
          if (!focusMode) {
            // Exit focus mode - return to equal split
            leftPane.className = 'pane equal';
            rightPane.className = 'pane equal';
            divider.classList.remove('hidden');
            switchLeft.classList.remove('active');
            switchRight.classList.remove('active');
            focusedPane = null;
          } else if (!focusedPane) {
            // Entering focus mode - default to left pane focused
            focusPane('left');
          }
        });
        
        // Function to focus a specific pane
        function focusPane(pane) {
          if (!focusMode) return;
          
          focusedPane = pane;
          divider.classList.add('hidden');
          
          if (pane === 'left') {
            leftPane.className = 'pane focused left-focused';
            rightPane.className = 'pane unfocused right-unfocused';
            switchLeft.classList.remove('active');
            switchRight.classList.add('active');
          } else {
            leftPane.className = 'pane unfocused left-unfocused';
            rightPane.className = 'pane focused right-focused';
            switchLeft.classList.add('active');
            switchRight.classList.remove('active');
          }
        }
        
        // Click handlers for switch areas
        switchLeft.addEventListener('click', () => {
          if (focusMode) focusPane('left');
        });
        
        switchRight.addEventListener('click', () => {
          if (focusMode) focusPane('right');
        });
        
        // Manual resize with divider (only when not in focus mode)
        divider.addEventListener('mousedown', (e) => {
          if (focusMode) return;
          isResizing = true;
          startX = e.clientX;
          startLeftWidth = leftPane.offsetWidth;
          document.body.style.cursor = 'col-resize';
          e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isResizing || focusMode) return;
          
          const containerWidth = container.offsetWidth;
          const newLeftWidth = startLeftWidth + (e.clientX - startX);
          const percentage = (newLeftWidth / containerWidth) * 100;
          
          if (percentage > 20 && percentage < 80) {
            leftPane.style.flex = percentage + '%';
            rightPane.style.flex = (100 - percentage) + '%';
          }
        });
        
        document.addEventListener('mouseup', () => {
          if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
          }
        });
        
        // Keyboard shortcuts for focus switching
        document.addEventListener('keydown', (e) => {
          if (!focusMode) return;
          
          // Tab or Arrow keys to switch focus
          if (e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            if (focusedPane === 'left') {
              focusPane('right');
            } else {
              focusPane('left');
            }
          }
          
          // Escape to exit focus mode
          if (e.key === 'Escape') {
            focusMode = false;
            focusToggle.innerHTML = '⎚';
            focusToggle.title = 'Enter Focus Mode';
            focusToggle.classList.remove('active');
            container.classList.remove('focus-mode');
            leftPane.className = 'pane equal';
            rightPane.className = 'pane equal';
            divider.classList.remove('hidden');
            focusedPane = null;
          }
        });
        
        // Handle webview events
        leftWebview.addEventListener('dom-ready', () => {
          console.log('Left webview loaded');
        });
        
        rightWebview.addEventListener('dom-ready', () => {
          console.log('Right webview loaded');
        });
        
        // Handle popup windows (links that open in new window)
        leftWebview.addEventListener('new-window', (e) => {
          e.preventDefault();
          const { shell } = require('electron');
          shell.openExternal(e.url);
        });
        
        rightWebview.addEventListener('new-window', (e) => {
          e.preventDefault();
          const { shell } = require('electron');
          shell.openExternal(e.url);
        });
      </script>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
}

// Function to toggle split view
function toggleSplitView(enableSplit) {
  isSplitView = enableSplit;
  
  if (!mainWindow) {
    createWindow();
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });
  } else {
    // Resize and reload window for the new view mode
    const width = isSplitView ? windowWidth * 2 : windowWidth;
    mainWindow.setSize(width, windowHeight);
    
    if (isSplitView) {
      loadSplitView();
    } else {
      const serviceName = currentSite.includes('chatgpt') ? 'ChatGPT' : 
                         currentSite.includes('claude') ? 'Claude' : 
                         currentSite.includes('gemini') ? 'Gemini' :
                         currentSite.includes('openrouter') ? 'OpenRouter' : 'Grok';
      mainWindow.setTitle(`Quick ${serviceName} Desktop`);
      mainWindow.loadURL(currentSite);
      mainWindow.webContents.once('did-finish-load', () => {
        focusTextInput();
      });
    }
  }
  
  updateContextMenu();
}

// Function to change service in split view
function changeSplitService(pane, service) {
  if (!isSplitView || !mainWindow) return;
  
  if (pane === 'left') {
    leftService = service;
  } else {
    rightService = service;
  }
  
  // Reload the split view with updated services
  loadSplitView();
  updateContextMenu();
}

app.on('will-quit', () => {
  // Unregister global shortcut
  globalShortcut.unregisterAll();
});
