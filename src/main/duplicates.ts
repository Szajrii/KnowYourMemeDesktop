import fs from 'fs'
import crypto from 'crypto'
import { db } from './db'
import { MemeItem } from '../shared/types'

export interface DuplicateGroup {
  hash: string
  totalSize: number
  memes: MemeItem[]
}

export async function findDuplicates(): Promise<DuplicateGroup[]> {
  const memes = db.getMemes().filter(m => fs.existsSync(m.path))
  const hashMap = new Map<string, MemeItem[]>()

  for (const meme of memes) {
    try {
      const fileBuffer = await fs.promises.readFile(meme.path)
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex')

      if (!hashMap.has(hash)) {
        hashMap.set(hash, [])
      }
      hashMap.get(hash)!.push(meme)
    } catch (err) {
      console.error('Failed to hash meme for duplicate check:', meme.path, err)
    }
  }

  const duplicates: DuplicateGroup[] = []
  for (const [hash, group] of hashMap.entries()) {
    if (group.length > 1) {
      duplicates.push({
        hash,
        totalSize: group.reduce((acc, m) => acc + m.size, 0),
        memes: group
      })
    }
  }

  return duplicates.sort((a, b) => b.totalSize - a.totalSize)
}
