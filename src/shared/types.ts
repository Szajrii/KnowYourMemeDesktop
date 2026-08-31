export type MediaType = 'image' | 'video' | 'gif' | 'audio'

export interface MemeItem {
  id: string
  path: string
  name: string
  extension: string
  type: MediaType
  size: number
  createdAt: number
  modifiedAt: number
  tags: string[]
  isFavorite: boolean
  description?: string
  rating?: number // 1-5 stars
  usedCount?: number // times copied or shared
  ocrText?: string // text extracted via OCR
  width?: number
  height?: number
  duration?: number
  folder: string
}

export interface TagInfo {
  name: string
  color: string
  count: number
}

export interface FolderConfig {
  path: string
  name: string
  addedAt: number
  recursive: boolean
  itemCount?: number
}

export interface SmartCollection {
  id: string
  name: string
  icon?: string
  tags: string[]
  minRating?: number
  onlyFavorites?: boolean
}

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'size_desc'
  | 'size_asc'
  | 'used_desc'
  | 'rating_desc'
  | 'random'

export interface FilterOptions {
  searchQuery: string
  selectedTags: string[]
  tagMatchMode: 'all' | 'any'
  mediaType: 'all' | 'image' | 'video' | 'gif' | 'audio'
  onlyFavorites: boolean
  sortBy: SortOption
  selectedFolder: string | null
  selectedCollectionId?: string | null
}

export type AppTheme =
  | 'dark'
  | 'light'
  | 'sakura'
  | 'coffee'
  | 'matcha'
  | 'ocean'
  | 'sunset'
  | 'cyberpunk'
  | 'dracula'
  | 'nord'
  | 'synthwave'

export interface AppDatabaseData {
  folders: FolderConfig[]
  memes: Record<string, MemeItem> // keyed by path
  tags: Record<string, { color: string }> // tag name -> metadata
  collections?: SmartCollection[]
  settings: {
    theme: AppTheme
    thumbnailSize: 'small' | 'medium' | 'large'
    autoPlayGifs: boolean
    autoPlayVideos: boolean
    defaultVolume: number
    minimizeToTray?: boolean
    autoStart?: boolean
  }
}
