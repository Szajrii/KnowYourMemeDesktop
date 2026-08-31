import { defineStore } from 'pinia'
import { MemeItem, FolderConfig, FilterOptions, TagInfo, AppDatabaseData, AppTheme } from '../../../shared/types'

export const useMemeStore = defineStore('meme', {
  state: () => ({
    memes: [] as MemeItem[],
    folders: [] as FolderConfig[],
    tags: {} as Record<string, { color: string }>,
    settings: {
      theme: 'dark' as AppTheme,
      thumbnailSize: 'medium' as 'small' | 'medium' | 'large',
      autoPlayGifs: true,
      autoPlayVideos: false,
      defaultVolume: 0.5
    } as AppDatabaseData['settings'],
    filter: {
      searchQuery: '',
      selectedTags: [] as string[],
      tagMatchMode: 'any' as const,
      mediaType: 'all' as const,
      onlyFavorites: false,
      sortBy: 'date_desc' as const,
      selectedFolder: null as string | null
    } as FilterOptions,
    selectedMeme: null as MemeItem | null,
    selectedPaths: new Set<string>(),
    isScanning: false,
    scannerStatusText: '',
    isOcrScanning: false,
    ocrProgressText: '',
    isFindingDuplicates: false,
    duplicateGroups: [] as any[],
    studioMeme: null as MemeItem | null,
    showStudioModal: false,
    toastMessage: null as string | null,
    toastType: 'info' as 'info' | 'success' | 'error',
    toastTimeout: null as any
  }),

  getters: {
    allTagsWithCount(state): TagInfo[] {
      const counts: Record<string, number> = {}
      for (const meme of state.memes) {
        for (const tag of meme.tags) {
          const norm = tag.toLowerCase().trim()
          if (norm) {
            counts[norm] = (counts[norm] || 0) + 1
          }
        }
      }

      const list: TagInfo[] = []
      // Include all registered tags even with 0 count
      for (const [name, meta] of Object.entries(state.tags)) {
        list.push({
          name,
          color: meta.color || '#6366f1',
          count: counts[name] || 0
        })
      }

      // Add any tags found on memes not in registered tags list
      for (const [name, count] of Object.entries(counts)) {
        if (!state.tags[name]) {
          list.push({
            name,
            color: '#6366f1',
            count
          })
        }
      }

      return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    },

    filteredMemes(state): MemeItem[] {
      const query = state.filter.searchQuery.toLowerCase().trim()
      const selectedTags = state.filter.selectedTags.map(t => t.toLowerCase())
      const isMatchAllTags = state.filter.tagMatchMode === 'all'
      const folderFilter = state.filter.selectedFolder?.toLowerCase()

      let result = state.memes.filter(meme => {
        // Folder filter
        if (folderFilter && meme.folder.toLowerCase() !== folderFilter) {
          return false
        }

        // Favorites filter
        if (state.filter.onlyFavorites && !meme.isFavorite) {
          return false
        }

        // Media type filter
        if (state.filter.mediaType !== 'all' && meme.type !== state.filter.mediaType) {
          return false
        }

        // Tags filter
        if (selectedTags.length > 0) {
          const memeTags = meme.tags.map(t => t.toLowerCase())
          if (isMatchAllTags) {
            const hasAll = selectedTags.every(t => memeTags.includes(t))
            if (!hasAll) return false
          } else {
            const hasAny = selectedTags.some(t => memeTags.includes(t))
            if (!hasAny) return false
          }
        }

        // Text search query (name, tags, description, OCR recognized text)
        if (query) {
          const inName = meme.name.toLowerCase().includes(query)
          const inTags = meme.tags.some(t => t.toLowerCase().includes(query))
          const inDesc = meme.description ? meme.description.toLowerCase().includes(query) : false
          const inOcr = meme.ocrText ? meme.ocrText.toLowerCase().includes(query) : false
          if (!inName && !inTags && !inDesc && !inOcr) {
            return false
          }
        }

        return true
      })

      // Sorting
      switch (state.filter.sortBy) {
        case 'date_desc':
          result.sort((a, b) => b.modifiedAt - a.modifiedAt)
          break
        case 'date_asc':
          result.sort((a, b) => a.modifiedAt - b.modifiedAt)
          break
        case 'name_asc':
          result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
          break
        case 'name_desc':
          result.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }))
          break
        case 'size_desc':
          result.sort((a, b) => b.size - a.size)
          break
        case 'size_asc':
          result.sort((a, b) => a.size - b.size)
          break
        case 'used_desc':
          result.sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
          break
        case 'rating_desc':
          result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case 'random':
          result.sort(() => Math.random() - 0.5)
          break
      }

      return result
    },

    stats(state) {
      const total = state.memes.length
      const favorites = state.memes.filter(m => m.isFavorite).length
      const images = state.memes.filter(m => m.type === 'image').length
      const gifs = state.memes.filter(m => m.type === 'gif').length
      const videos = state.memes.filter(m => m.type === 'video').length
      return { total, favorites, images, gifs, videos }
    }
  },

  actions: {
    showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
      this.toastMessage = message
      this.toastType = type
      if (this.toastTimeout) clearTimeout(this.toastTimeout)
      this.toastTimeout = setTimeout(() => {
        this.toastMessage = null
      }, 3000)
    },

    async init() {
      if (!window.electronAPI) return

      try {
        const data = await window.electronAPI.getDbData()
        this.setDbData(data)

        // Listen for live updates from scanner/watcher
        window.electronAPI.onMemesUpdated((memes) => {
          this.memes = memes
          if (this.selectedMeme) {
            const updated = memes.find(m => m.path === this.selectedMeme?.path)
            if (updated) this.selectedMeme = updated
          }
        })

        window.electronAPI.onScannerStatus((status) => {
          this.isScanning = status.scanning
          if (status.scanning) {
            this.scannerStatusText = `Skanowanie folderu: ${status.folder}...`
          } else {
            this.scannerStatusText = ''
            if (status.count !== undefined) {
              this.showToast(`Zindeksowano ${status.count} plików`, 'success')
            }
          }
        })

        if (window.electronAPI.onOcrProgress) {
          window.electronAPI.onOcrProgress((prog) => {
            this.ocrProgressText = `OCR (${prog.current}/${prog.total}): ${prog.file}`
          })
        }
      } catch (err) {
        console.error('Failed to initialize meme store:', err)
      }
    },

    async scanMemeOcr(meme: MemeItem): Promise<string | null> {
      if (!window.electronAPI) return null
      try {
        this.showToast('Rozpoznawanie tekstu (OCR)...', 'info')
        const res = await window.electronAPI.scanOcrMeme(meme.path)
        if (res.success && res.text) {
          meme.ocrText = res.text
          if (this.selectedMeme && this.selectedMeme.path === meme.path) {
            this.selectedMeme.ocrText = res.text
          }
          this.showToast('Odczytano tekst z mema!', 'success')
          return res.text
        } else {
          this.showToast('Nie wykryto tekstu na obrazie', 'info')
          return null
        }
      } catch (e: any) {
        this.showToast(`Błąd OCR: ${e.message}`, 'error')
        return null
      }
    },

    async scanAllOcr() {
      if (!window.electronAPI || this.isOcrScanning) return
      try {
        this.isOcrScanning = true
        this.showToast('Rozpoczęto skanowanie OCR w tle...', 'info')
        const res = await window.electronAPI.scanAllOcr()
        this.isOcrScanning = false
        this.ocrProgressText = ''
        if (res.success) {
          this.showToast(`OCR zakończone! Zindeksowano ${res.count} memów.`, 'success')
        }
      } catch (e: any) {
        this.isOcrScanning = false
        this.ocrProgressText = ''
        this.showToast(`Błąd OCR: ${e.message}`, 'error')
      }
    },

    async findDuplicates() {
      if (!window.electronAPI) return []
      try {
        this.isFindingDuplicates = true
        const res = await window.electronAPI.findDuplicates()
        this.isFindingDuplicates = false
        if (res.success) {
          this.duplicateGroups = res.duplicates || []
          return this.duplicateGroups
        } else {
          this.showToast(res.message || 'Błąd wyszukiwania duplikatów', 'error')
          return []
        }
      } catch (e: any) {
        this.isFindingDuplicates = false
        this.showToast(`Błąd: ${e.message}`, 'error')
        return []
      }
    },

    openStudio(meme?: MemeItem | null) {
      this.studioMeme = meme || null
      this.showStudioModal = true
    },

    closeStudio() {
      this.showStudioModal = false
      this.studioMeme = null
    },

    setDbData(data: AppDatabaseData) {
      this.folders = data.folders || []
      this.memes = Object.values(data.memes || {})
      this.tags = data.tags || {}
      this.settings = { ...this.settings, ...(data.settings || {}) }
      if (this.settings.theme) {
        this.applyTheme(this.settings.theme as any)
      }
    },

    applyTheme(theme: string) {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme)
        if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          document.documentElement.classList.add('dark')
        }
      }
    },

    async setTheme(theme: AppTheme) {
      this.settings.theme = theme
      this.applyTheme(theme)
      if (window.electronAPI) {
        try {
          await window.electronAPI.updateSettings({ theme })
          const names: Record<AppTheme, string> = {
            dark: 'Ciemny (Grafit)',
            light: 'Klasyczny Jasny',
            sakura: 'Sakura Pastel',
            coffee: 'Ciepłe Latte',
            matcha: 'Matcha Herbata',
            ocean: 'Morski Błękit',
            sunset: 'Złoty Zachód',
            cyberpunk: 'Cyberpunk Neon',
            dracula: 'Dracula',
            nord: 'Nord Arktyczny',
            synthwave: 'Synthwave'
          }
          this.showToast(`Zmieniono motyw: ${names[theme] || theme}`, 'info')
        } catch (err: any) {
          console.error('Failed to update theme setting:', err)
        }
      }
    },

    async chooseAndAddFolder() {
      if (!window.electronAPI) return
      try {
        const path = await window.electronAPI.selectFolder()
        if (path) {
          this.showToast(`Dodawanie i skanowanie: ${path}...`, 'info')
          const updatedData = await window.electronAPI.addFolder(path, true)
          this.setDbData(updatedData)
          this.showToast('Folder dodany pomyślnie!', 'success')
        }
      } catch (e: any) {
        this.showToast(`Błąd dodawania folderu: ${e.message}`, 'error')
      }
    },

    async removeFolder(folderPath: string) {
      if (!window.electronAPI) return
      try {
        const data = await window.electronAPI.removeFolder(folderPath)
        this.setDbData(data)
        if (this.filter.selectedFolder === folderPath) {
          this.filter.selectedFolder = null
        }
        this.showToast('Folder usunięty z biblioteki', 'info')
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async rescan(folderPath?: string) {
      if (!window.electronAPI) return
      try {
        this.showToast('Ponowne skanowanie...', 'info')
        const data = await window.electronAPI.rescanFolders(folderPath)
        this.setDbData(data)
      } catch (e: any) {
        this.showToast(`Błąd skanowania: ${e.message}`, 'error')
      }
    },

    async toggleFavorite(meme: MemeItem) {
      if (!window.electronAPI) return
      const newFav = !meme.isFavorite
      meme.isFavorite = newFav
      try {
        await window.electronAPI.updateMeme(meme.path, { isFavorite: newFav })
        if (this.selectedMeme && this.selectedMeme.path === meme.path) {
          this.selectedMeme.isFavorite = newFav
        }
      } catch (e) {
        meme.isFavorite = !newFav
      }
    },

    async updateMemeTags(meme: MemeItem, tags: string[]) {
      if (!window.electronAPI) return
      try {
        const updated = await window.electronAPI.updateMeme(meme.path, { tags })
        if (updated) {
          const index = this.memes.findIndex(m => m.path === meme.path)
          if (index !== -1) this.memes[index] = updated
          if (this.selectedMeme && this.selectedMeme.path === meme.path) {
            this.selectedMeme = updated
          }
          // Refresh tags list
          const data = await window.electronAPI.getDbData()
          this.tags = data.tags
        }
      } catch (e: any) {
        this.showToast(`Błąd zapisu tagów: ${e.message}`, 'error')
      }
    },

    async updateMemeDescription(meme: MemeItem, description: string) {
      if (!window.electronAPI) return
      try {
        const updated = await window.electronAPI.updateMeme(meme.path, { description })
        if (updated) {
          const index = this.memes.findIndex(m => m.path === meme.path)
          if (index !== -1) this.memes[index] = updated
          if (this.selectedMeme && this.selectedMeme.path === meme.path) {
            this.selectedMeme.description = description
          }
        }
      } catch (e: any) {
        this.showToast(`Błąd zapisu opisu: ${e.message}`, 'error')
      }
    },

    async batchAddTags(tags: string[]) {
      if (!window.electronAPI || this.selectedPaths.size === 0) return
      try {
        const paths = Array.from(this.selectedPaths)
        const updatedData = await window.electronAPI.batchUpdateTags(paths, tags, [])
        this.setDbData(updatedData)
        this.showToast(`Dodano tagi do ${paths.length} memów`, 'success')
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async batchRemoveTags(tags: string[]) {
      if (!window.electronAPI || this.selectedPaths.size === 0) return
      try {
        const paths = Array.from(this.selectedPaths)
        const updatedData = await window.electronAPI.batchUpdateTags(paths, [], tags)
        this.setDbData(updatedData)
        this.showToast(`Usunięto tagi z ${paths.length} memów`, 'info')
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async setTagColor(tagName: string, color: string) {
      if (!window.electronAPI) return
      try {
        const tags = await window.electronAPI.setTagColor(tagName, color)
        this.tags = tags
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async deleteTag(tagName: string) {
      if (!window.electronAPI) return
      try {
        const data = await window.electronAPI.deleteTag(tagName)
        this.setDbData(data)
        this.filter.selectedTags = this.filter.selectedTags.filter(t => t !== tagName)
        this.showToast(`Tag "${tagName}" usunięty`, 'info')
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async incrementUsed(meme: MemeItem) {
      meme.usedCount = (meme.usedCount || 0) + 1
      if (this.selectedMeme && this.selectedMeme.path === meme.path) {
        this.selectedMeme.usedCount = meme.usedCount
      }
      if (window.electronAPI) {
        await window.electronAPI.incrementUsedCount(meme.path)
      }
    },

    async setMemeRating(meme: MemeItem, rating: number) {
      meme.rating = rating
      if (this.selectedMeme && this.selectedMeme.path === meme.path) {
        this.selectedMeme.rating = rating
      }
      if (window.electronAPI) {
        await window.electronAPI.updateMeme(meme.path, { rating })
        this.showToast(`Ustawiono ocenę: ${rating} ⭐`, 'success')
      }
    },

    pickRandomMeme() {
      const list = this.filteredMemes
      if (list.length === 0) {
        this.showToast('Brak memów do wylosowania', 'info')
        return
      }
      const randomIndex = Math.floor(Math.random() * list.length)
      this.selectedMeme = list[randomIndex]
      this.showToast(`Wylosowano mema: ${this.selectedMeme.name} 🎲`, 'info')
    },

    startDrag(meme: MemeItem) {
      if (window.electronAPI) {
        window.electronAPI.startDrag(meme.path)
      }
    },

    async savePastedMeme(payload: { folderPath: string; fileName: string; base64Data: string; tags: string[]; description?: string }): Promise<boolean> {
      if (!window.electronAPI) return false
      try {
        const res = await window.electronAPI.savePastedImage(payload)
        if (res.success && res.meme) {
          this.memes.unshift(res.meme)
          this.showToast('Nowy mem zapisany ze schowka!', 'success')
          return true
        } else {
          this.showToast(res.message || 'Błąd zapisu pliku ze schowka', 'error')
          return false
        }
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
        return false
      }
    },

    async copyMemeToClipboard(meme: MemeItem) {
      if (!window.electronAPI) return
      try {
        const res = await window.electronAPI.copyImageToClipboard(meme.path)
        if (res.success) {
          this.incrementUsed(meme)
          this.showToast(
            res.mode === 'image'
              ? 'Obraz skopiowany do schowka! Wklej go (Ctrl+V) w Messengerze / Discordzie.'
              : 'Ścieżka pliku skopiowana do schowka!',
            'success'
          )
        } else {
          this.showToast(res.message || 'Nie udało się skopiować', 'error')
        }
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async copyPathToClipboard(meme: MemeItem) {
      if (!window.electronAPI) return
      try {
        await window.electronAPI.copyPathToClipboard(meme.path)
        this.showToast('Ścieżka skopiowana do schowka', 'success')
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async copyMemeMetadata(meme: MemeItem) {
      if (!window.electronAPI) return
      try {
        const tagLine = meme.tags.length > 0 ? meme.tags.map(t => `#${t}`).join(' ') : ''
        const parts = [meme.name]
        if (tagLine) parts.push(tagLine)
        if (meme.description) parts.push(meme.description)
        const formatted = parts.join('\n')

        await window.electronAPI.copyMetadataToClipboard(formatted)
        this.incrementUsed(meme)
        this.showToast('Skopiowano tekst i tagi do schowka!', 'success')
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
      }
    },

    async openInExplorer(meme: MemeItem) {
      if (!window.electronAPI) return
      await window.electronAPI.openInExplorer(meme.path)
    },

    async openExternal(meme: MemeItem) {
      if (!window.electronAPI) return
      await window.electronAPI.openExternal(meme.path)
    },

    async deleteMeme(meme: MemeItem) {
      if (!window.electronAPI) return
      try {
        await window.electronAPI.deleteFile(meme.path)
        this.memes = this.memes.filter(m => m.path !== meme.path)
        this.selectedPaths.delete(meme.path)
        if (this.selectedMeme?.path === meme.path) {
          this.selectedMeme = null
        }
        this.showToast('Plik przeniesiony do kosza', 'info')
      } catch (e: any) {
        this.showToast(`Błąd usuwania: ${e.message}`, 'error')
      }
    },

    async renameMeme(meme: MemeItem, newFileName: string): Promise<boolean> {
      if (!window.electronAPI) return false
      try {
        const res = await window.electronAPI.renameFile(meme.path, newFileName)
        if (res.success && res.updatedMeme) {
          const oldPath = meme.path
          const index = this.memes.findIndex(m => m.path === oldPath)
          if (index !== -1) {
            this.memes[index] = res.updatedMeme
          }
          if (this.selectedMeme?.path === oldPath) {
            this.selectedMeme = res.updatedMeme
          }
          if (this.selectedPaths.has(oldPath)) {
            this.selectedPaths.delete(oldPath)
            this.selectedPaths.add(res.updatedMeme.path)
          }
          this.showToast('Zmieniono nazwę pliku', 'success')
          return true
        } else {
          this.showToast(res.message || 'Nie udało się zmienić nazwy pliku', 'error')
          return false
        }
      } catch (e: any) {
        this.showToast(`Błąd: ${e.message}`, 'error')
        return false
      }
    },

    toggleTagFilter(tagName: string) {
      const idx = this.filter.selectedTags.indexOf(tagName)
      if (idx !== -1) {
        this.filter.selectedTags.splice(idx, 1)
      } else {
        this.filter.selectedTags.push(tagName)
      }
    },

    clearFilters() {
      this.filter.searchQuery = ''
      this.filter.selectedTags = []
      this.filter.mediaType = 'all'
      this.filter.onlyFavorites = false
      this.filter.selectedFolder = null
    },

    toggleSelectPath(path: string) {
      if (this.selectedPaths.has(path)) {
        this.selectedPaths.delete(path)
      } else {
        this.selectedPaths.add(path)
      }
    },

    clearSelection() {
      this.selectedPaths.clear()
    },

    selectAll() {
      for (const meme of this.filteredMemes) {
        this.selectedPaths.add(meme.path)
      }
    }
  }
})
