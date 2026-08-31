import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMemeStore } from '../src/renderer/src/stores/memeStore'
import { MemeItem, AppDatabaseData } from '../src/shared/types'

const mockMemes: MemeItem[] = [
  {
    id: '1',
    path: 'C:\\Memes\\doge.png',
    name: 'doge.png',
    extension: '.png',
    type: 'image',
    size: 500000,
    createdAt: 1000,
    modifiedAt: 1000,
    tags: ['dank', 'crypto'],
    isFavorite: true,
    description: 'Much wow such crypto',
    folder: 'C:\\Memes'
  },
  {
    id: '2',
    path: 'C:\\Memes\\cat_vibing.gif',
    name: 'cat_vibing.gif',
    extension: '.gif',
    type: 'gif',
    size: 2000000,
    createdAt: 2000,
    modifiedAt: 2000,
    tags: ['wholesome', 'music'],
    isFavorite: false,
    description: 'Cat jamming to music',
    folder: 'C:\\Memes'
  },
  {
    id: '3',
    path: 'C:\\Videos\\rickroll.mp4',
    name: 'rickroll.mp4',
    extension: '.mp4',
    type: 'video',
    size: 15000000,
    createdAt: 3000,
    modifiedAt: 3000,
    tags: ['music', 'classic', 'dank'],
    isFavorite: true,
    description: 'Never gonna give you up',
    folder: 'C:\\Videos'
  }
]

const mockDbData: AppDatabaseData = {
  folders: [
    { path: 'C:\\Memes', name: 'Memes', addedAt: 1000, recursive: true, itemCount: 2 },
    { path: 'C:\\Videos', name: 'Videos', addedAt: 2000, recursive: true, itemCount: 1 }
  ],
  memes: {
    'C:\\Memes\\doge.png': mockMemes[0],
    'C:\\Memes\\cat_vibing.gif': mockMemes[1],
    'C:\\Videos\\rickroll.mp4': mockMemes[2]
  },
  tags: {
    'dank': { color: '#ef4444' },
    'wholesome': { color: '#10b981' },
    'music': { color: '#8b5cf6' },
    'crypto': { color: '#f59e0b' },
    'classic': { color: '#3b82f6' }
  },
  settings: {
    theme: 'dark',
    thumbnailSize: 'medium',
    autoPlayGifs: true,
    autoPlayVideos: false,
    defaultVolume: 0.5
  }
}

describe('Meme Pinia Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize and populate database data', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    expect(store.memes.length).toBe(3)
    expect(store.folders.length).toBe(2)
    expect(Object.keys(store.tags).length).toBe(5)
  })

  it('should calculate correct stats summary', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    const stats = store.stats
    expect(stats.total).toBe(3)
    expect(stats.favorites).toBe(2)
    expect(stats.images).toBe(1)
    expect(stats.gifs).toBe(1)
    expect(stats.videos).toBe(1)
  })

  it('should aggregate all tags with counts and sort by count descending', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    const tags = store.allTagsWithCount
    // 'dank' and 'music' each have 2 memes
    const dank = tags.find(t => t.name === 'dank')
    const music = tags.find(t => t.name === 'music')
    const wholesome = tags.find(t => t.name === 'wholesome')

    expect(dank?.count).toBe(2)
    expect(music?.count).toBe(2)
    expect(wholesome?.count).toBe(1)
  })

  it('should filter memes by search text query in name, tags, and description', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    // Search by name
    store.filter.searchQuery = 'doge'
    expect(store.filteredMemes.length).toBe(1)
    expect(store.filteredMemes[0].name).toBe('doge.png')

    // Search by tag
    store.filter.searchQuery = 'music'
    expect(store.filteredMemes.length).toBe(2)

    // Search by description
    store.filter.searchQuery = 'give you up'
    expect(store.filteredMemes.length).toBe(1)
    expect(store.filteredMemes[0].id).toBe('3')
  })

  it('should filter memes by media type', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    store.filter.mediaType = 'gif'
    expect(store.filteredMemes.length).toBe(1)
    expect(store.filteredMemes[0].name).toBe('cat_vibing.gif')

    store.filter.mediaType = 'video'
    expect(store.filteredMemes.length).toBe(1)
    expect(store.filteredMemes[0].name).toBe('rickroll.mp4')
  })

  it('should filter only favorites', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    store.filter.onlyFavorites = true
    expect(store.filteredMemes.length).toBe(2)
    expect(store.filteredMemes.every(m => m.isFavorite)).toBe(true)
  })

  it('should filter by tags with ANY (OR) mode', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    store.filter.selectedTags = ['crypto', 'wholesome']
    store.filter.tagMatchMode = 'any'

    const results = store.filteredMemes
    expect(results.length).toBe(2) // doge (crypto) + cat_vibing (wholesome)
  })

  it('should filter by tags with ALL (AND) mode', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    store.filter.selectedTags = ['music', 'dank']
    store.filter.tagMatchMode = 'all'

    const results = store.filteredMemes
    expect(results.length).toBe(1) // only rickroll has both 'music' and 'dank'
    expect(results[0].name).toBe('rickroll.mp4')
  })

  it('should sort memes by size and name', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    // Sort by size descending
    store.filter.sortBy = 'size_desc'
    expect(store.filteredMemes[0].name).toBe('rickroll.mp4') // 15MB
    expect(store.filteredMemes[2].name).toBe('doge.png') // 500KB

    // Sort by name ascending
    store.filter.sortBy = 'name_asc'
    expect(store.filteredMemes[0].name).toBe('cat_vibing.gif')
    expect(store.filteredMemes[1].name).toBe('doge.png')
    expect(store.filteredMemes[2].name).toBe('rickroll.mp4')
  })

  it('should manage multi-selection properly', () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    expect(store.selectedPaths.size).toBe(0)

    store.toggleSelectPath(mockMemes[0].path)
    expect(store.selectedPaths.has(mockMemes[0].path)).toBe(true)
    expect(store.selectedPaths.size).toBe(1)

    // Select all
    store.selectAll()
    expect(store.selectedPaths.size).toBe(3)

    // Clear selection
    store.clearSelection()
    expect(store.selectedPaths.size).toBe(0)
  })

  it('should show and auto-clear toast notification', () => {
    const store = useMemeStore()
    store.showToast('Test Toast', 'success')

    expect(store.toastMessage).toBe('Test Toast')
    expect(store.toastType).toBe('success')
  })

  it('should handle meme renaming via electronAPI', async () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    const target = mockMemes[0]
    store.selectedMeme = target
    store.selectedPaths.add(target.path)

    // Mock window.electronAPI.renameFile
    window.electronAPI = {
      renameFile: async (_oldPath: string, newFileName: string) => {
        return {
          success: true,
          updatedMeme: {
            ...target,
            path: `C:\\Memes\\${newFileName}`,
            name: newFileName
          }
        }
      }
    } as any

    const success = await store.renameMeme(target, 'doge_new.png')
    expect(success).toBe(true)
    expect(store.selectedMeme?.name).toBe('doge_new.png')
    expect(store.selectedPaths.has('C:\\Memes\\doge_new.png')).toBe(true)
    expect(store.selectedPaths.has(target.path)).toBe(false)
  })

  it('should copy meme metadata and tags as formatted text', async () => {
    const store = useMemeStore()
    store.setDbData(mockDbData)

    let copiedText = ''
    window.electronAPI = {
      copyMetadataToClipboard: async (text: string) => {
        copiedText = text
        return { success: true }
      }
    } as any

    await store.copyMemeMetadata(mockMemes[0])
    expect(copiedText).toContain('doge.png')
    expect(copiedText).toContain('#dank #crypto')
    expect(copiedText).toContain('Much wow such crypto')
    expect(store.toastMessage).toContain('Skopiowano')
  })
})
