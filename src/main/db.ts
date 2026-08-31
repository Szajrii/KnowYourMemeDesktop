import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { AppDatabaseData, MemeItem, FolderConfig } from '../shared/types'

const defaultData: AppDatabaseData = {
  folders: [],
  memes: {},
  tags: {
    'dank': { color: '#ef4444' },
    'wholesome': { color: '#10b981' },
    'gaming': { color: '#8b5cf6' },
    'tech': { color: '#3b82f6' },
    'reaction': { color: '#f59e0b' },
    'cursed': { color: '#6b7280' },
    'polish': { color: '#ec4899' }
  },
  settings: {
    theme: 'dark',
    thumbnailSize: 'medium',
    autoPlayGifs: true,
    autoPlayVideos: false,
    defaultVolume: 0.5
  }
}

class Database {
  private filePath: string
  private data: AppDatabaseData
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    const userDataPath = app ? app.getPath('userData') : process.cwd()
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    this.filePath = path.join(userDataPath, 'memes_db.json')
    this.data = this.load()
  }

  private load(): AppDatabaseData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          ...defaultData,
          ...parsed,
          tags: { ...defaultData.tags, ...(parsed.tags || {}) },
          settings: { ...defaultData.settings, ...(parsed.settings || {}) }
        }
      }
    } catch (e) {
      console.error('Failed to load database, using defaults:', e)
    }
    return JSON.parse(JSON.stringify(defaultData))
  }

  public save() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
      } catch (e) {
        console.error('Failed to save database:', e)
      }
    }, 200)
  }

  public getData(): AppDatabaseData {
    return this.data
  }

  public getMemes(): MemeItem[] {
    return Object.values(this.data.memes)
  }

  public getMemeByPath(filePath: string): MemeItem | undefined {
    return this.data.memes[filePath]
  }

  public setMeme(meme: MemeItem) {
    this.data.memes[meme.path] = meme
    this.save()
  }

  public updateMeme(filePath: string, updates: Partial<MemeItem>): MemeItem | null {
    const existing = this.data.memes[filePath]
    if (!existing) return null

    const updated: MemeItem = {
      ...existing,
      ...updates
    }
    this.data.memes[filePath] = updated

    // Update tags dictionary if new tags are added
    if (updates.tags) {
      for (const tag of updates.tags) {
        const normalized = tag.toLowerCase().trim()
        if (normalized && !this.data.tags[normalized]) {
          this.data.tags[normalized] = { color: getRandomTagColor() }
        }
      }
    }

    this.save()
    return updated
  }

  public batchUpdateTags(paths: string[], addTags: string[], removeTags: string[]) {
    const normAdd = addTags.map(t => t.toLowerCase().trim()).filter(Boolean)
    const normRemove = removeTags.map(t => t.toLowerCase().trim()).filter(Boolean)

    for (const p of paths) {
      const meme = this.data.memes[p]
      if (meme) {
        let currentTags = new Set(meme.tags.map(t => t.toLowerCase().trim()))
        normAdd.forEach(t => currentTags.add(t))
        normRemove.forEach(t => currentTags.delete(t))
        meme.tags = Array.from(currentTags)
      }
    }

    for (const tag of normAdd) {
      if (!this.data.tags[tag]) {
        this.data.tags[tag] = { color: getRandomTagColor() }
      }
    }

    this.save()
  }

  public removeMeme(filePath: string) {
    delete this.data.memes[filePath]
    this.save()
  }

  public getFolders(): FolderConfig[] {
    return this.data.folders
  }

  public addFolder(folder: FolderConfig) {
    const exists = this.data.folders.some(f => f.path.toLowerCase() === folder.path.toLowerCase())
    if (!exists) {
      this.data.folders.push(folder)
      this.save()
    }
  }

  public removeFolder(folderPath: string) {
    this.data.folders = this.data.folders.filter(
      f => f.path.toLowerCase() !== folderPath.toLowerCase()
    )
    // Remove memes originating from this folder
    const prefix = folderPath.toLowerCase()
    for (const p of Object.keys(this.data.memes)) {
      if (p.toLowerCase().startsWith(prefix)) {
        delete this.data.memes[p]
      }
    }
    this.save()
  }

  public setTagColor(tagName: string, color: string) {
    const normalized = tagName.toLowerCase().trim()
    if (!this.data.tags[normalized]) {
      this.data.tags[normalized] = { color }
    } else {
      this.data.tags[normalized].color = color
    }
    this.save()
  }

  public deleteTag(tagName: string) {
    const normalized = tagName.toLowerCase().trim()
    delete this.data.tags[normalized]
    for (const meme of Object.values(this.data.memes)) {
      meme.tags = meme.tags.filter(t => t.toLowerCase().trim() !== normalized)
    }
    this.save()
  }

  public updateSettings(settings: Partial<AppDatabaseData['settings']>) {
    this.data.settings = {
      ...this.data.settings,
      ...settings
    }
    this.save()
  }
}

function getRandomTagColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const db = new Database()
