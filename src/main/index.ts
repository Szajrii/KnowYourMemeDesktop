import { app, BrowserWindow, protocol, net, globalShortcut, Tray, Menu, nativeImage, NativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { registerIpcHandlers } from './ipc'
import { mediaScanner } from './scanner'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set Windows AppUserModelId so Taskbar displays the correct icon
app.setAppUserModelId('com.knowyourmeme.desktop')

// Single Instance Lock - prevent running multiple instances
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

// Embedded 32x32 crisp PNG meme icon fallback (yellow smiley on indigo)
const EMBEDDED_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AgfDCApW3ZfNwAAAl5JREFUWMPt1z9oU1EcB/DPubknTdo0TZu2SZqmTevfptYqtqJ1cHBwFhwdFBwdBIdSdHBwcBTp4OAgODqIIFRxEBTpoOAXODiIiqg41Kq10qZN8+f3/v7cg4MgiA7GpqXp573d8f28+33u/S3wP/57qHfgWw/Z+4H7/b0FjOlj09M714+fPj08uXlzcnR8fHJ8YmJ1bGRk75o+PjE9MzO3vLw8v7Ky8nJ2dvb5/Pz80tzc3NPJyclr09PTY9c3NgYe+v30/q/AvwzM1o3Z2e3Dw/v7BwefDA4M/tzf3//b39/f2tvbe7K3v7+9t7e3t7e/v76+vv5kdXX12crKysPV1dUnW1tbW+s3by7U9fHB+wrcy8Bs3Zqd3ds/OPj6aPvG7eHh4ff9A4Pnh4aGftjf3//f3t7evp2dnRdr6+tbq+vr6y/W1taeLK6t/ZiZmXm4urq6fHR8/OD3BTY3Zycmnp05c/7e0NDQ790bN36eOHnq3uDQ0Jv9A4O7e3t7W2u3b/84Oj6+ubq6enfl/Pmnq5OTv1fPnfu6urq6c3R8fP+eAic3Nzc33t+8eXN4aOjt3uDg21OnT7/b29v7vLKy8uT4+Pj68vLyk9XV1bfrN278PH327O/lCxe+LC8v7+wdHNxzYGlpaWltbe3lysrKg9XV1T9ra2sfVldX779cXX25uLz8eHFp6f7U7OzU7OzsvbmFhQcLc3Pv5+fnd+/eufPQ9evXT1/9B+A/xWwBqL/dAv4B00t7A8iI0EAAAAAASUVORK5CYII='

function getAppIcon(): NativeImage {
  const possiblePaths = [
    path.join(__dirname, '../../resources/icon.ico'),
    path.join(__dirname, '../../resources/icon.png'),
    path.join(__dirname, '../resources/icon.ico'),
    path.join(__dirname, '../resources/icon.png'),
    path.join(process.resourcesPath, 'resources/icon.ico'),
    path.join(process.resourcesPath, 'resources/icon.png'),
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'icon.png'),
    path.join(app.getAppPath(), 'resources/icon.ico'),
    path.join(app.getAppPath(), 'resources/icon.png')
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return nativeImage.createFromPath(p)
    }
  }
  return nativeImage.createFromBuffer(Buffer.from(EMBEDDED_ICON_BASE64, 'base64'))
}

// Register media protocol scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  }
])

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createTray() {
  if (tray) return
  const icon = getAppIcon().resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('Know Your Meme Desktop')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Otwórz bibliotekę',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Szybki Launcher (Alt+Space)',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('launcher:toggle')
        }
      }
    },
    {
      label: 'Losuj mema (Ctrl+R)',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('launcher:random')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Zamknij aplikację',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

function createWindow() {
  let preloadPath = path.join(__dirname, '../preload/index.cjs')
  if (!fs.existsSync(preloadPath)) {
    preloadPath = path.join(__dirname, '../preload/index.js')
  }

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    icon: getAppIcon(),
    backgroundColor: '#0d1117',
    title: 'Know Your Meme Desktop',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allows local media loading
    }
  })

  // Remove default menu for a clean desktop app look
  mainWindow.removeMenu()

  registerIpcHandlers(mainWindow)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Handle custom media:// protocol to serve local images/videos
  protocol.handle('media', (request) => {
    try {
      const parsedUrl = new URL(request.url)
      let filePath = parsedUrl.searchParams.get('path')

      if (!filePath) {
        // Fallback for direct path format
        filePath = decodeURIComponent(request.url.replace(/^media:\/\/+(local\/)?/i, ''))
      }

      if (!filePath || !fs.existsSync(filePath)) {
        console.warn(`[media-protocol] File not found: ${filePath}`)
        return new Response('File not found', { status: 404 })
      }

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (err) {
      console.error('[media-protocol] Failed to handle request:', request.url, err)
      return new Response('Error loading media', { status: 500 })
    }
  })

  createWindow()
  createTray()

  // Register Global Shortcuts (Ctrl+Shift+M and Alt+Space for Quick Launcher)
  try {
    const triggerLauncher = () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('launcher:toggle')
      }
    }
    globalShortcut.register('CommandOrControl+Shift+M', triggerLauncher)
    globalShortcut.register('Alt+Space', triggerLauncher)
  } catch (err) {
    console.warn('Could not register global shortcuts:', err)
  }

  // Scan existing configured folders
  if (mainWindow) {
    setTimeout(() => {
      mediaScanner.scanAllFolders(mainWindow!)
    }, 1000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
