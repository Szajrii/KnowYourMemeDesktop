import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
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
  const preloadPath = path.join(__dirname, '../preload/index.js')

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
      // URL format: media://P:/folder/image.png or media:///P:/folder/image.png
      let filePath = decodeURIComponent(request.url.replace(/^media:\/\/+/i, ''))
      // On Windows fix drive letters like p:/ or C:/
      if (/^[a-zA-Z]:/.test(filePath)) {
        // already good
      } else if (/^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.substring(1)
      }

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (err) {
      console.error('Failed to handle media protocol:', err)
      return new Response('File not found', { status: 404 })
    }
  })

  createWindow()

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
