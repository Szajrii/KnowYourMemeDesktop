import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import chokidar, { FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import { db } from './db'
import { MemeItem, MediaType } from '../shared/types'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.svg', '.avif', '.ico'])
const GIF_EXTS = new Set(['.gif'])
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.ogv'])
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'])

function getMediaType(ext: string): MediaType | null {
  const normalized = ext.toLowerCase()
  if (GIF_EXTS.has(normalized)) return 'gif'
  if (IMAGE_EXTS.has(normalized)) return 'image'
  if (VIDEO_EXTS.has(normalized)) return 'video'
  if (AUDIO_EXTS.has(normalized)) return 'audio'
  return null
}

function generateId(filePath: string): string {
  return crypto.createHash('md5').update(filePath.toLowerCase()).digest('hex')
}

export class MediaScanner {
  private watchers: Map<string, FSWatcher> = new Map()
  private scanningFolders: Set<string> = new Set()

  public async scanFolder(folderPath: string, recursive: boolean = true, win?: BrowserWindow): Promise<number> {
    if (!fs.existsSync(folderPath)) return 0
    this.scanningFolders.add(folderPath)

    if (win && !win.isDestroyed()) {
      win.webContents.send('scanner:status', { folder: folderPath, scanning: true })
    }

    let count = 0
    try {
      const items = await this.scanDirectoryRecursive(folderPath, folderPath, recursive)
      count = items.length

      // Check for removed files
      const existingMemes = db.getMemes().filter(m => m.folder.toLowerCase() === folderPath.toLowerCase())
      const currentPaths = new Set(items.map(i => i.path.toLowerCase()))

      for (const existing of existingMemes) {
        if (!currentPaths.has(existing.path.toLowerCase())) {
          if (!fs.existsSync(existing.path)) {
            db.removeMeme(existing.path)
          }
        }
      }

      // Update folder count
      const folders = db.getFolders()
      const folder = folders.find(f => f.path.toLowerCase() === folderPath.toLowerCase())
      if (folder) {
        folder.itemCount = count
        db.save()
      }

      this.setupWatcher(folderPath, win)
    } catch (e) {
      console.error(`Error scanning folder ${folderPath}:`, e)
    } finally {
      this.scanningFolders.delete(folderPath)
      if (win && !win.isDestroyed()) {
        win.webContents.send('scanner:status', { folder: folderPath, scanning: false, count })
        win.webContents.send('memes:updated', db.getMemes())
      }
    }

    return count
  }

  private async scanDirectoryRecursive(
    currentDir: string,
    rootFolder: string,
    recursive: boolean
  ): Promise<MemeItem[]> {
    const results: MemeItem[] = []
    try {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
          if (recursive && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subItems = await this.scanDirectoryRecursive(fullPath, rootFolder, recursive)
            results.push(...subItems)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          const mediaType = getMediaType(ext)

          if (mediaType) {
            try {
              const stats = await fs.promises.stat(fullPath)
              const existing = db.getMemeByPath(fullPath)

              const meme: MemeItem = {
                id: existing?.id || generateId(fullPath),
                path: fullPath,
                name: entry.name,
                extension: ext,
                type: mediaType,
                size: stats.size,
                createdAt: stats.birthtimeMs || stats.ctimeMs || Date.now(),
                modifiedAt: stats.mtimeMs || Date.now(),
                tags: existing?.tags || [],
                isFavorite: existing?.isFavorite || false,
                description: existing?.description || '',
                rating: existing?.rating || 0,
                folder: rootFolder
              }

              db.setMeme(meme)
              results.push(meme)
            } catch (err) {
              console.error(`Error reading file stats ${fullPath}:`, err)
            }
          }
        }
      }
    } catch (e) {
      console.error(`Failed to read dir ${currentDir}:`, e)
    }

    return results
  }

  public setupWatcher(folderPath: string, win?: BrowserWindow) {
    if (this.watchers.has(folderPath)) {
      return
    }

    try {
      const watcher = chokidar.watch(folderPath, {
        ignored: /(^|[\/\\])\..|node_modules/,
        persistent: true,
        ignoreInitial: true,
        depth: 5
      })

      const handleFileAddOrChange = async (filePath: string) => {
        const ext = path.extname(filePath).toLowerCase()
        const mediaType = getMediaType(ext)
        if (!mediaType) return

        try {
          const stats = await fs.promises.stat(filePath)
          const existing = db.getMemeByPath(filePath)

          const meme: MemeItem = {
            id: existing?.id || generateId(filePath),
            path: filePath,
            name: path.basename(filePath),
            extension: ext,
            type: mediaType,
            size: stats.size,
            createdAt: stats.birthtimeMs || stats.ctimeMs || Date.now(),
            modifiedAt: stats.mtimeMs || Date.now(),
            tags: existing?.tags || [],
            isFavorite: existing?.isFavorite || false,
            description: existing?.description || '',
            rating: existing?.rating || 0,
            folder: folderPath
          }

          db.setMeme(meme)
          if (win && !win.isDestroyed()) {
            win.webContents.send('memes:updated', db.getMemes())
          }
        } catch (e) {
          console.error(`Watcher error processing ${filePath}:`, e)
        }
      }

      const handleFileUnlink = (filePath: string) => {
        db.removeMeme(filePath)
        if (win && !win.isDestroyed()) {
          win.webContents.send('memes:updated', db.getMemes())
        }
      }

      watcher
        .on('add', handleFileAddOrChange)
        .on('change', handleFileAddOrChange)
        .on('unlink', handleFileUnlink)

      this.watchers.set(folderPath, watcher)
    } catch (e) {
      console.error(`Failed to create watcher for ${folderPath}:`, e)
    }
  }

  public removeWatcher(folderPath: string) {
    const watcher = this.watchers.get(folderPath)
    if (watcher) {
      watcher.close()
      this.watchers.delete(folderPath)
    }
  }

  public async scanAllFolders(win?: BrowserWindow) {
    const folders = db.getFolders()
    for (const folder of folders) {
      await this.scanFolder(folder.path, folder.recursive, win)
    }
  }
}

export const mediaScanner = new MediaScanner()
