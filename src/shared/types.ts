export type MediaType = 'image' | 'video' | 'gif'

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
  rating?: number
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

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'size_desc'
  | 'size_asc'
  | 'random'

export interface FilterOptions {
  searchQuery: string
  selectedTags: string[]
  tagMatchMode: 'all' | 'any'
  mediaType: 'all' | 'image' | 'video' | 'gif'
  onlyFavorites: boolean
  sortBy: SortOption
  selectedFolder: string | null
}

export interface AppDatabaseData {
  folders: FolderConfig[]
  memes: Record<string, MemeItem> // keyed by path
  tags: Record<string, { color: string }> // tag name -> metadata
  settings: {
    theme: 'dark' | 'light'
    thumbnailSize: 'small' | 'medium' | 'large'
    autoPlayGifs: boolean
    autoPlayVideos: boolean
    defaultVolume: number
  }
}
