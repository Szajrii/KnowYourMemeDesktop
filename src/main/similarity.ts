import fs from 'fs'
import sharp from 'sharp'
import { BrowserWindow } from 'electron'
import { db } from './db'
import { MemeItem } from '../shared/types'

/**
 * Computes a 64-bit dHash for an image file using sharp.
 */
export async function computeFileDHash(filePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) return null
    const buffer = await sharp(filePath)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer()

    let hash = ''
    for (let row = 0; row < 8; row++) {
      let rowByte = 0
      for (let col = 0; col < 8; col++) {
        const left = buffer[row * 9 + col]
        const right = buffer[row * 9 + col + 1]
        if (left > right) {
          rowByte |= 1 << (7 - col)
        }
      }
      hash += rowByte.toString(16).padStart(2, '0')
    }
    return hash
  } catch (err) {
    return null
  }
}

/**
 * Computes a 64-bit dHash for an in-memory buffer.
 */
export async function computeBufferDHash(buffer: Buffer): Promise<string | null> {
  try {
    const rawData = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer()

    let hash = ''
    for (let row = 0; row < 8; row++) {
      let rowByte = 0
      for (let col = 0; col < 8; col++) {
        const left = rawData[row * 9 + col]
        const right = rawData[row * 9 + col + 1]
        if (left > right) {
          rowByte |= 1 << (7 - col)
        }
      }
      hash += rowByte.toString(16).padStart(2, '0')
    }
    return hash
  } catch (err) {
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
