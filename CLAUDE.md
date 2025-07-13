# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick AI Desktop is a lightweight Electron application that provides quick access to multiple AI services (ChatGPT, Claude, Grok, Gemini, OpenRouter) through a system tray/menubar interface. The entire application is contained in a single `main.js` file with minimal complexity.

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build for current platform
npm run build

# Platform-specific builds
npm run build:mac    # macOS (dmg and zip)
npm run build:win    # Windows
npm run build:linux  # Linux
```

Note: There are no linting, testing, or type-checking commands available in this project.

## Architecture

### Single-File Structure
- **main.js** - Contains all application logic including:
  - Window management
  - Tray/menubar functionality
  - Global keyboard shortcuts
  - Context menu generation
  - Service switching logic

### Key Architectural Patterns

1. **Service Configuration**: When adding new AI services or modifying existing ones, follow the established pattern in `createWindow()` and `updateContextMenu()`:
   ```javascript
   const serviceName = currentSite.includes('service') ? 'ServiceName' : ...
   ```

2. **State Management**: Global state variables are declared at the top of main.js:
   - `mainWindow` - BrowserWindow instance
   - `currentSite` - Active AI service URL
   - `currentShortcut` - Global keyboard shortcut
   - `windowWidth/windowHeight` - Window dimensions
   - `appVisibility` - Menubar-only or menubar+dock mode

3. **Window Management**: The app uses a single BrowserWindow that loads external URLs directly. No renderer process scripts or IPC communication needed.

4. **Theme Handling**: Tray icons automatically adapt to system theme using `nativeTheme` events and template images.

## Adding New Features

### Adding a New AI Service
1. Add the service URL to the context menu in `updateContextMenu()`
2. Update the service name detection logic in `createWindow()` and `changeSite()`
3. Ensure the window title updates correctly

### Modifying Window Behavior
- Window creation logic is in `createWindow()`
- Toggle behavior is in `toggleWindow()`
- Always maintain the `skipTaskbar: true` setting for menubar app behavior

### Updating Keyboard Shortcuts
- Shortcuts are managed in `changeShortcut()`
- Available options are defined in the context menu
- Remember to unregister old shortcuts before registering new ones

## Important Considerations

1. **No Build Tools**: This is vanilla JavaScript with no transpilation, bundling (beyond Electron), or type checking.

2. **Security**: The app loads external websites. Maintain these security settings:
   - `contextIsolation: true`
   - `nodeIntegration: false`
   - Minimal preload script

3. **Platform Differences**: Currently only tested on macOS. Windows and Linux builds are available but may need platform-specific adjustments.

4. **Icon Management**: Use template images for macOS tray icons to ensure proper theme adaptation.