# Quick AI Desktop

A lightweight desktop application that provides quick access to ChatGPT, Claude, Grok, Gemini, and OpenRouter AI through a menubar/tray icon and global shortcut. Built with Electron. This project was entirely created using Vibe Coding's AI assistance, with no human-written code. Currently, it has only been tested on macOS.

## Features

- 🔍 Quick access to multiple AI services (ChatGPT, Claude, Grok, Gemini, OpenRouter) through menubar/tray icon
- ⌨️ Global shortcut (Ctrl+Space) to toggle the window
- 🎯 Auto-focus on chat input when window opens
- 🖥️ Clean interface without taskbar icon
- 💨 Fast and lightweight
- 📐 Configurable window sizes (Small, Medium, Large, Tall)
- ⌨️ Customizable keyboard shortcuts

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/takaf3/quick-ai-desktop.git
   cd quick-ai-desktop
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
3. Click the icon or press `Ctrl+Space` to toggle the AI window
4. Switch between AI services using the tray menu
5. Customize window size and keyboard shortcuts as needed
6. Start chatting with your preferred AI!

## Keyboard Shortcuts

- `Ctrl+Space` or `Ctrl+Shift+Space`: Toggle AI window
- Click on tray icon: Toggle AI window

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
- Supports [ChatGPT](https://chatgpt.com/), [Claude](https://claude.ai/), [Grok](https://grok.com/), [Gemini](https://gemini.google.com/app), and [OpenRouter](https://openrouter.ai/chat) AI platforms