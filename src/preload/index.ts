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
  copyMetadataToClipboard: (text: string): Promise<{ success: boolean }> => 
    ipcRenderer.invoke('system:copyMetadataToClipboard', text),
  copyPathToClipboard: (filePath: string): Promise<{ success: boolean }> => 
    ipcRenderer.invoke('system:copyPathToClipboard', filePath),
  openInExplorer: (filePath: string): Promise<boolean> => 
    ipcRenderer.invoke('system:openInExplorer', filePath),
  openExternal: (filePath: string): Promise<boolean> => 
    ipcRenderer.invoke('system:openExternal', filePath),
  deleteFile: (filePath: string): Promise<{ success: boolean; message?: string }> => 
    ipcRenderer.invoke('system:deleteFile', filePath),
  renameFile: (oldPath: string, newFileName: string): Promise<{ success: boolean; updatedMeme?: MemeItem; message?: string }> => 
    ipcRenderer.invoke('system:renameFile', oldPath, newFileName),
  readClipboardImage: (): Promise<{ hasImage: boolean; dataUrl?: string; message?: string }> => 
    ipcRenderer.invoke('system:readClipboardImage'),
  savePastedImage: (payload: { folderPath: string; fileName: string; base64Data: string; tags: string[]; description?: string }): Promise<{ success: boolean; meme?: MemeItem; message?: string }> => 
    ipcRenderer.invoke('system:savePastedImage', payload),
  startDrag: (filePath: string): Promise<void> => 
    ipcRenderer.invoke('system:startDrag', filePath),
  incrementUsedCount: (filePath: string): Promise<{ success: boolean; meme?: MemeItem }> => 
    ipcRenderer.invoke('system:incrementUsedCount', filePath),

  scanOcrMeme: (filePath: string): Promise<{ success: boolean; text: string }> => 
    ipcRenderer.invoke('ocr:scanMeme', filePath),
  scanAllOcr: (): Promise<{ success: boolean; count: number }> => 
    ipcRenderer.invoke('ocr:scanAll'),
  findDuplicates: (): Promise<{ success: boolean; duplicates: any[]; message?: string }> => 
    ipcRenderer.invoke('duplicates:find'),

  exportBackup: (): Promise<{ success: boolean; filePath?: string; message?: string }> =>
    ipcRenderer.invoke('backup:export'),
  importBackup: (): Promise<{ success: boolean; data?: AppDatabaseData; message?: string }> =>
    ipcRenderer.invoke('backup:import'),

  onMemesUpdated: (callback: (memes: MemeItem[]) => void) => {
    const handler = (_event: any, memes: MemeItem[]) => callback(memes)
    ipcRenderer.on('memes:updated', handler)
    return () => ipcRenderer.removeListener('memes:updated', handler)
  },
  onOcrProgress: (callback: (progress: { current: number; total: number; file: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('ocr:progress', handler)
    return () => ipcRenderer.removeListener('ocr:progress', handler)
  },
  onScannerStatus: (callback: (status: { folder: string; scanning: boolean; count?: number }) => void) => {
    const handler = (_event: any, status: any) => callback(status)
    ipcRenderer.on('scanner:status', handler)
    return () => ipcRenderer.removeListener('scanner:status', handler)
  },
  onLauncherToggle: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('launcher:toggle', handler)
    return () => ipcRenderer.removeListener('launcher:toggle', handler)
  }
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('electronAPI', api)
