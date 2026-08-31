import { ipcMain, dialog, shell, clipboard, nativeImage, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { db } from './db'
import { mediaScanner } from './scanner'
import { FolderConfig, MemeItem, AppDatabaseData } from '../shared/types'

export function registerIpcHandlers(win: BrowserWindow) {
  // Folder Dialog
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: 'Wybierz folder z memami',
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // Database operations
  ipcMain.handle('db:getData', async () => {
    return db.getData()
  })

  ipcMain.handle('db:updateMeme', async (_event, filePath: string, updates: Partial<MemeItem>) => {
    return db.updateMeme(filePath, updates)
  })

  ipcMain.handle('db:batchUpdateTags', async (_event, paths: string[], addTags: string[], removeTags: string[]) => {
    db.batchUpdateTags(paths, addTags, removeTags)
    return db.getData()
  })

  ipcMain.handle('db:setTagColor', async (_event, tagName: string, color: string) => {
    db.setTagColor(tagName, color)
    return db.getData().tags
  })

  ipcMain.handle('db:deleteTag', async (_event, tagName: string) => {
    db.deleteTag(tagName)
    return db.getData()
  })

  ipcMain.handle('db:updateSettings', async (_event, settings: Partial<AppDatabaseData['settings']>) => {
    db.updateSettings(settings)
    return db.getData().settings
  })

  // Folders management
  ipcMain.handle('folders:add', async (_event, folderPath: string, recursive: boolean = true) => {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder nie istnieje: ${folderPath}`)
    }
    const folderConfig: FolderConfig = {
      path: folderPath,
      name: path.basename(folderPath) || folderPath,
      addedAt: Date.now(),
      recursive
    }
    db.addFolder(folderConfig)
    await mediaScanner.scanFolder(folderPath, recursive, win)
    return db.getData()
  })

  ipcMain.handle('folders:remove', async (_event, folderPath: string) => {
    mediaScanner.removeWatcher(folderPath)
    db.removeFolder(folderPath)
    return db.getData()
  })

  ipcMain.handle('folders:rescan', async (_event, folderPath?: string) => {
    if (folderPath) {
      await mediaScanner.scanFolder(folderPath, true, win)
    } else {
      await mediaScanner.scanAllFolders(win)
    }
    return db.getData()
  })

  // System integrations
  ipcMain.handle('system:copyImageToClipboard', async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, message: 'Plik nie istnieje' }
      }

      const ext = path.extname(filePath).toLowerCase()

      if (['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.gif', '.ico'].includes(ext)) {
        try {
          const buffer = await fs.promises.readFile(filePath)
          let img = nativeImage.createFromBuffer(buffer)

          if (img.isEmpty()) {
            img = nativeImage.createFromPath(filePath)
          }

          if (!img.isEmpty()) {
            // Clear clipboard completely so apps (like Messenger/Discord) do not paste text path
            clipboard.clear()
            clipboard.writeImage(img)
            return { success: true, mode: 'image' }
          }
        } catch (readErr) {
          console.error('Failed to read image buffer, trying createFromPath:', readErr)
          const img = nativeImage.createFromPath(filePath)
          if (!img.isEmpty()) {
            clipboard.clear()
            clipboard.writeImage(img)
            return { success: true, mode: 'image' }
          }
        }
      }
      
      // Fallback for videos or other formats: write text path
      clipboard.clear()
      clipboard.writeText(filePath)
      return { success: true, mode: 'path' }
    } catch (e: any) {
      console.error('Error copying to clipboard:', e)
      return { success: false, message: e.message }
    }
  })

  ipcMain.handle('system:copyMetadataToClipboard', async (_event, text: string) => {
    clipboard.writeText(text)
    return { success: true }
  })

  ipcMain.handle('system:copyPathToClipboard', async (_event, filePath: string) => {
    clipboard.writeText(filePath)
    return { success: true }
  })

  ipcMain.handle('system:openInExplorer', async (_event, filePath: string) => {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath)
      return true
    }
    return false
  })

  ipcMain.handle('system:openExternal', async (_event, filePath: string) => {
    if (fs.existsSync(filePath)) {
      await shell.openPath(filePath)
      return true
    }
    return false
  })

  ipcMain.handle('system:deleteFile', async (_event, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) {
        await shell.trashItem(filePath)
      }
      db.removeMeme(filePath)
      return { success: true }
    } catch (e: any) {
      console.error('Failed to trash file:', e)
      return { success: false, message: e.message }
    }
  })

  ipcMain.handle('system:renameFile', async (_event, oldPath: string, newFileName: string) => {
    try {
      if (!fs.existsSync(oldPath)) {
        return { success: false, message: 'Plik źródłowy nie istnieje' }
      }

      const trimmedName = newFileName.trim()
      if (!trimmedName) {
        return { success: false, message: 'Nazwa pliku nie może być pusta' }
      }

      // Check for invalid Windows characters
      if (/[<>:"/\\|?*]/.test(trimmedName)) {
        return { success: false, message: 'Nazwa pliku zawiera niedozwolone znaki (< > : " / \\ | ? *)' }
      }

      const dir = path.dirname(oldPath)
      const oldExt = path.extname(oldPath)
      let finalName = trimmedName

      // If user did not specify extension, keep the original extension
      if (!path.extname(finalName) && oldExt) {
        finalName += oldExt
      }

      const newPath = path.join(dir, finalName)
      const newExt = path.extname(newPath).toLowerCase()

      // If destination already exists and is different from oldPath
      if (oldPath.toLowerCase() !== newPath.toLowerCase() && fs.existsSync(newPath)) {
        return { success: false, message: 'Plik o takiej nazwie już istnieje w tym folderze' }
      }

      await fs.promises.rename(oldPath, newPath)
      const updatedMeme = db.renameMemePath(oldPath, newPath, finalName, newExt)

      return { success: true, updatedMeme }
    } catch (e: any) {
      console.error('Failed to rename file:', e)
      return { success: false, message: e.message || 'Błąd podczas zmiany nazwy pliku' }
    }
  })
}
