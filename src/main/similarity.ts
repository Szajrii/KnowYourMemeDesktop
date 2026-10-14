import fs from 'fs'
import { BrowserWindow, nativeImage } from 'electron'
import { db } from './db'

/**
 * Computes a 64-bit dHash from raw 9x8 BGRA bitmap buffer.
 */
export function computeDHashFromBitmap(bmp: Buffer): string {
  let hash = ''
  for (let row = 0; row < 8; row++) {
    let rowByte = 0
    for (let col = 0; col < 8; col++) {
      const idxLeft = (row * 9 + col) * 4
      const idxRight = (row * 9 + col + 1) * 4

      // Electron toBitmap() returns BGRA: Blue=0, Green=1, Red=2
      const grayLeft = 0.114 * bmp[idxLeft] + 0.587 * bmp[idxLeft + 1] + 0.299 * bmp[idxLeft + 2]
      const grayRight = 0.114 * bmp[idxRight] + 0.587 * bmp[idxRight + 1] + 0.299 * bmp[idxRight + 2]

      if (grayLeft > grayRight) {
        rowByte |= 1 << (7 - col)
      }
    }
    hash += rowByte.toString(16).padStart(2, '0')
  }
  return hash
}

/**
 * Computes a 64-bit dHash for an image file using Electron's nativeImage.
 * Fast, 100% native, zero external dependencies.
 */
export async function computeFileDHash(filePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) return null
    const img = nativeImage.createFromPath(filePath)
    if (img.isEmpty()) return null
    const resized = img.resize({ width: 9, height: 8, quality: 'good' })
    const bmp = resized.toBitmap()
    if (!bmp || bmp.length < 288) return null
    return computeDHashFromBitmap(bmp)
  } catch {
    return null
  }
}

/**
 * Computes a 64-bit dHash for an in-memory buffer using nativeImage.
 */
export async function computeBufferDHash(buffer: Buffer): Promise<string | null> {
  try {
    const img = nativeImage.createFromBuffer(buffer)
    if (img.isEmpty()) return null
    const resized = img.resize({ width: 9, height: 8, quality: 'good' })
    const bmp = resized.toBitmap()
    if (!bmp || bmp.length < 288) return null
    return computeDHashFromBitmap(bmp)
  } catch {
    return null
  }
}

/**
 * Scans all memes without a phash and populates their hash in db.
 */
export async function scanAllMissingHashes(win?: BrowserWindow): Promise<{ updatedCount: number }> {
  const memes = db.getMemes().filter(m => m.type !== 'audio' && !m.phash && fs.existsSync(m.path))
  let updatedCount = 0

  for (let i = 0; i < memes.length; i++) {
    const meme = memes[i]
    const hash = await computeFileDHash(meme.path)
    if (hash) {
      db.updateMeme(meme.path, { phash: hash })
      updatedCount++
    }

    if (win && !win.isDestroyed() && (i % 10 === 0 || i === memes.length - 1)) {
      win.webContents.send('similarity:progress', {
        current: i + 1,
        total: memes.length,
        updatedCount
      })
    }
  }

  if (updatedCount > 0 && win && !win.isDestroyed()) {
    win.webContents.send('memes:updated', db.getMemes())
  }

  return { updatedCount }
}
