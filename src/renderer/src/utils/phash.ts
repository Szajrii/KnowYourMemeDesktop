import { MemeItem, SimilarityMatch, SimilarCluster } from '../../../shared/types'

/**
 * Calculates the Hamming distance between two 64-bit hex strings (16 hex chars).
 * Returns the count of differing bits (0 to 64).
 */
export function hammingDistance(hexA: string, hexB: string): number {
  if (!hexA || !hexB || hexA.length !== 16 || hexB.length !== 16) return 64
  let dist = 0
  for (let i = 0; i < 16; i += 2) {
    const bA = parseInt(hexA.slice(i, i + 2), 16)
    const bB = parseInt(hexB.slice(i, i + 2), 16)
    let xor = (bA ^ bB) & 0xff
    while (xor > 0) {
      dist += xor & 1
      xor >>= 1
    }
  }
  return dist
}

/**
 * Calculates similarity percentage between two perceptual hashes.
 * Returns integer 0 to 100%.
 */
export function calculateSimilarity(hexA: string, hexB: string): number {
  const dist = hammingDistance(hexA, hexB)
  return Math.max(0, Math.round((1 - dist / 64) * 100))
}

/**
 * Computes a 64-bit perceptual difference hash (dHash) using HTML5 Canvas.
 * Works seamlessly in both Electron desktop and in Workbench plugin (.par) mode!
 */
export async function computeCanvasDHash(
  source: string | HTMLImageElement | HTMLCanvasElement
): Promise<string> {
  return new Promise((resolve, reject) => {
    let img: HTMLImageElement

    const processImage = (imageElement: HTMLImageElement | HTMLCanvasElement) => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 9
        canvas.height = 8
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          return resolve('')
        }

        ctx.drawImage(imageElement, 0, 0, 9, 8)
        const imgData = ctx.getImageData(0, 0, 9, 8).data

        // Convert RGBA to 72 grayscale luminosity values
        const grayValues = new Uint8Array(72)
        for (let i = 0; i < 72; i++) {
          const idx = i * 4
          const r = imgData[idx]
          const g = imgData[idx + 1]
          const b = imgData[idx + 2]
          grayValues[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        }

        // Compute 64-bit difference hash
        let hash = ''
        for (let row = 0; row < 8; row++) {
          let rowByte = 0
          for (let col = 0; col < 8; col++) {
            const left = grayValues[row * 9 + col]
            const right = grayValues[row * 9 + col + 1]
            if (left > right) {
              rowByte |= 1 << (7 - col)
            }
          }
          hash += rowByte.toString(16).padStart(2, '0')
        }

        resolve(hash)
      } catch (err) {
        reject(err)
      }
    }

    if (source instanceof HTMLCanvasElement) {
      processImage(source)
    } else if (source instanceof HTMLImageElement) {
      if (source.complete && source.naturalWidth > 0) {
        processImage(source)
      } else {
        source.onload = () => processImage(source)
        source.onerror = (e) => reject(e)
      }
    } else if (typeof source === 'string') {
      img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => processImage(img)
      img.onerror = () => {
        // Fallback without crossOrigin in case local file:// or media:// blocks CORS
        const fallbackImg = new Image()
        fallbackImg.onload = () => processImage(fallbackImg)
        fallbackImg.onerror = (e) => reject(e)
        fallbackImg.src = source
      }
      img.src = source
    } else {
      resolve('')
    }
  })
}

/**
 * Finds all memes in library visually similar to targetHash.
 * minSimilarity defaults to 80% (distance <= 12).
 */
export function findSimilarMemes(
  targetHash: string,
  memes: MemeItem[],
  minSimilarity = 80,
  excludePath?: string
): SimilarityMatch[] {
  if (!targetHash || targetHash.length !== 16) return []
  const matches: SimilarityMatch[] = []

  for (const meme of memes) {
    if (excludePath && meme.path === excludePath) continue
    if (!meme.phash || meme.phash.length !== 16) continue
    // Skip audio files
    if (meme.type === 'audio') continue

    const distance = hammingDistance(targetHash, meme.phash)
    const similarity = Math.max(0, Math.round((1 - distance / 64) * 100))
    if (similarity >= minSimilarity) {
      matches.push({ meme, similarity, distance })
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Clusters an entire list of memes into visual template groups.
 * Detects clusters of 2 or more similar memes.
 */
export function clusterMemesBySimilarity(
  memes: MemeItem[],
  minSimilarity = 80
): SimilarCluster[] {
  const eligible = memes.filter(m => m.phash && m.phash.length === 16 && m.type !== 'audio')
  const visited = new Set<string>()
  const clusters: SimilarCluster[] = []

  for (let i = 0; i < eligible.length; i++) {
    const base = eligible[i]
    if (visited.has(base.path)) continue

    const clusterMembers: MemeItem[] = [base]
    visited.add(base.path)

    for (let j = i + 1; j < eligible.length; j++) {
      const candidate = eligible[j]
      if (visited.has(candidate.path)) continue

      const similarity = calculateSimilarity(base.phash!, candidate.phash!)
      if (similarity >= minSimilarity) {
        clusterMembers.push(candidate)
        visited.add(candidate.path)
      }
    }

    if (clusterMembers.length > 1) {
      // Find all unique tags used across this cluster
      const allTags = new Set<string>()
      let untaggedCount = 0
      for (const m of clusterMembers) {
        if (!m.tags || m.tags.length === 0) {
          untaggedCount++
        } else {
          for (const t of m.tags) allTags.add(t)
        }
      }

      clusters.push({
        id: base.phash!,
        leadMeme: base,
        memes: clusterMembers,
        suggestedTags: Array.from(allTags),
        untaggedCount
      })
    }
  }

  // Sort by untaggedCount desc (prioritizing groups that need tagging) then by size desc
  return clusters.sort((a, b) => {
    if (b.untaggedCount !== a.untaggedCount) {
      return b.untaggedCount - a.untaggedCount
    }
    return b.memes.length - a.memes.length
  })
}
