import { app, BrowserWindow, protocol, net, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { registerIpcHandlers } from './ipc'
import { mediaScanner } from './scanner'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
