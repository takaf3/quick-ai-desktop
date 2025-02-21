# Quick Grok Desktop

A lightweight desktop application that provides quick access to Grok AI through a menubar/tray icon and global shortcut. Built with Electron.

## Features

- 🔍 Quick access to Grok AI through menubar/tray icon
- ⌨️ Global shortcut (Ctrl+Space) to toggle the window
- 🎯 Auto-focus on chat input when window opens
- 🖥️ Clean interface without taskbar icon
- 💨 Fast and lightweight

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/grok-desktop.git
   cd grok-desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the app in development mode:
```bash
npm start
```

## Building

Build for your current platform:
```bash
npm run build
```

Platform-specific builds:
- macOS: `npm run build:mac`
- Windows: `npm run build:win`
- Linux: `npm run build:linux`

The built application will be available in the `dist` directory.

## Usage

1. After installation, launch the application
2. A menubar/tray icon will appear
3. Click the icon or press `Ctrl+Space` to toggle the Grok window
4. Start chatting with Grok!

## Keyboard Shortcuts

- `Ctrl+Space`: Toggle Grok window
- Click on tray icon: Toggle Grok window

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the `package.json` file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Uses [Grok](https://grok.com/) AI platform 