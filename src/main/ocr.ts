import fs from 'fs'
import path from 'path'
import { db } from './db'

class OcrService {
  private worker: any = null
  private isProcessing = false

  private async getWorker() {
    if (!this.worker) {
      const { createWorker } = await import('tesseract.js')
      this.worker = await createWorker('pol+eng', 1, {
        logger: () => {}
      })
    }
    return this.worker
  }

  public async scanFile(filePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) return null
      const ext = path.extname(filePath).toLowerCase()
      if (!['.jpg', '.jpeg', '.png', '.bmp', '.webp'].includes(ext)) {
        return null
      }

      const buffer = await fs.promises.readFile(filePath)
      const worker = await this.getWorker()
      const ret = await worker.recognize(buffer)
      const text = (ret?.data?.text || '').replace(/\s+/g, ' ').trim()

      if (text) {
        db.updateMeme(filePath, { ocrText: text })
      }
      return text
    } catch (e) {
      console.warn('OCR skipped file due to read error:', filePath, e)
      return null
    }
  }

  public async scanAllUnindexed(onProgress?: (current: number, total: number, file: string) => void): Promise<number> {
    if (this.isProcessing) return 0
    this.isProcessing = true
    let count = 0

    try {
      const memes = db.getMemes()
      const toScan = memes.filter(m => m.type === 'image' && !m.ocrText && fs.existsSync(m.path))
      const total = toScan.length

      for (let i = 0; i < toScan.length; i++) {
        const item = toScan[i]
        try {
          if (onProgress) onProgress(i + 1, total, item.name)
          const text = await this.scanFile(item.path)
          if (text) count++
        } catch (itemErr) {
          console.warn('Skipping unreadable meme for OCR:', item.path, itemErr)
        }
      }
    } finally {
      this.isProcessing = false
    }

    return count
  }
}

export const ocrService = new OcrService()
