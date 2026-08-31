import { contextBridge, ipcRenderer } from 'electron'
import { MemeItem, AppDatabaseData } from '../shared/types'

const api = {
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectFolder'),
  
  getDbData: (): Promise<AppDatabaseData> => ipcRenderer.invoke('db:getData'),
  updateMeme: (filePath: string, updates: Partial<MemeItem>): Promise<MemeItem | null> => 
    ipcRenderer.invoke('db:updateMeme', filePath, updates),
  batchUpdateTags: (paths: string[], addTags: string[], removeTags: string[]): Promise<AppDatabaseData> => 
    ipcRenderer.invoke('db:batchUpdateTags', paths, addTags, removeTags),
  setTagColor: (tagName: string, color: string): Promise<Record<string, { color: string }>> => 
    ipcRenderer.invoke('db:setTagColor', tagName, color),
  deleteTag: (tagName: string): Promise<AppDatabaseData> => 
    ipcRenderer.invoke('db:deleteTag', tagName),
  updateSettings: (settings: Partial<AppDatabaseData['settings']>): Promise<AppDatabaseData['settings']> => 
    ipcRenderer.invoke('db:updateSettings', settings),

  addFolder: (folderPath: string, recursive?: boolean): Promise<AppDatabaseData> => 
    ipcRenderer.invoke('folders:add', folderPath, recursive),
  removeFolder: (folderPath: string): Promise<AppDatabaseData> => 
    ipcRenderer.invoke('folders:remove', folderPath),
  rescanFolders: (folderPath?: string): Promise<AppDatabaseData> => 
    ipcRenderer.invoke('folders:rescan', folderPath),

  copyImageToClipboard: (filePath: string): Promise<{ success: boolean; mode?: string; message?: string }> => 
    ipcRenderer.invoke('system:copyImageToClipboard', filePath),
  copyPathToClipboard: (filePath: string): Promise<{ success: boolean }> => 
    ipcRenderer.invoke('system:copyPathToClipboard', filePath),
  openInExplorer: (filePath: string): Promise<boolean> => 
    ipcRenderer.invoke('system:openInExplorer', filePath),
  openExternal: (filePath: string): Promise<boolean> => 
    ipcRenderer.invoke('system:openExternal', filePath),
  deleteFile: (filePath: string): Promise<{ success: boolean; message?: string }> => 
    ipcRenderer.invoke('system:deleteFile', filePath),

  onMemesUpdated: (callback: (memes: MemeItem[]) => void) => {
    const handler = (_event: any, memes: MemeItem[]) => callback(memes)
    ipcRenderer.on('memes:updated', handler)
    return () => ipcRenderer.removeListener('memes:updated', handler)
  },
  onScannerStatus: (callback: (status: { folder: string; scanning: boolean; count?: number }) => void) => {
    const handler = (_event: any, status: any) => callback(status)
    ipcRenderer.on('scanner:status', handler)
    return () => ipcRenderer.removeListener('scanner:status', handler)
  }
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('electronAPI', api)
