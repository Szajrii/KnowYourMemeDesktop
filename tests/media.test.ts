import { describe, it, expect } from 'vitest'
import { getMediaUrl } from '../src/renderer/src/utils/media'

describe('getMediaUrl utility', () => {
  it('should return empty string when empty path is provided', () => {
    expect(getMediaUrl('')).toBe('')
  })

  it('should correctly encode Windows drive paths', () => {
    const windowsPath = 'P:\\Memes\\cat_funny.png'
    const result = getMediaUrl(windowsPath)
    expect(result).toBe('media://local/?path=P%3A%5CMemes%5Ccat_funny.png')

    // Verify round-trip decoding
    const parsed = new URL(result)
    expect(parsed.searchParams.get('path')).toBe(windowsPath)
  })

  it('should handle paths with spaces and special characters', () => {
    const complexPath = 'C:\\Moje Memy\\śmieszne koty #1 (2026).mp4'
    const result = getMediaUrl(complexPath)
    const parsed = new URL(result)
    expect(parsed.searchParams.get('path')).toBe(complexPath)
  })
})
