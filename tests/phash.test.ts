import { describe, it, expect } from 'vitest'
import { hammingDistance, calculateSimilarity, findSimilarMemes, clusterMemesBySimilarity } from '../src/renderer/src/utils/phash'
import { MemeItem } from '../src/shared/types'

describe('phash similarity utils', () => {
  it('should calculate hamming distance correctly', () => {
    expect(hammingDistance('0000000000000000', '0000000000000000')).toBe(0)
    expect(hammingDistance('0000000000000000', '0000000000000001')).toBe(1)
    expect(hammingDistance('ffffffffffffffff', '0000000000000000')).toBe(64)
  })

  it('should calculate similarity percentage', () => {
    expect(calculateSimilarity('0000000000000000', '0000000000000000')).toBe(100)
    expect(calculateSimilarity('ffffffffffffffff', '0000000000000000')).toBe(0)
    // 6 bits diff out of 64 => (1 - 6/64)*100 = 91%
    const h1 = '1141c58684854d23'
    const h2 = '1141c58684854d20' // diff in last nibble 3 (0011) vs 0 (0000) => 2 bits diff
    expect(calculateSimilarity(h1, h2)).toBe(97)
  })

  it('should find similar memes matching threshold', () => {
    const mockMemes: MemeItem[] = [
      {
        id: '1',
        path: '/a.jpg',
        name: 'a.jpg',
        extension: '.jpg',
        type: 'image',
        size: 100,
        createdAt: 0,
        modifiedAt: 0,
        tags: ['doge', 'classic'],
        isFavorite: false,
        folder: '/',
        phash: '1141c58684854d23'
      },
      {
        id: '2',
        path: '/b.jpg',
        name: 'b.jpg',
        extension: '.jpg',
        type: 'image',
        size: 100,
        createdAt: 0,
        modifiedAt: 0,
        tags: [],
        isFavorite: false,
        folder: '/',
        phash: '1141c58684854d20' // 2 bits diff = 97%
      },
      {
        id: '3',
        path: '/c.jpg',
        name: 'c.jpg',
        extension: '.jpg',
        type: 'image',
        size: 100,
        createdAt: 0,
        modifiedAt: 0,
        tags: ['cat'],
        isFavorite: false,
        folder: '/',
        phash: 'ffffffffffffffff' // completely different
      }
    ]

    const matches = findSimilarMemes('1141c58684854d23', mockMemes, 85, '/a.jpg')
    expect(matches.length).toBe(1)
    expect(matches[0].meme.path).toBe('/b.jpg')
    expect(matches[0].similarity).toBe(97)
  })

  it('should cluster memes and detect untagged members with suggested tags', () => {
    const mockMemes: MemeItem[] = [
      {
        id: '1',
        path: '/drake_tagged.jpg',
        name: 'drake_tagged.jpg',
        extension: '.jpg',
        type: 'image',
        size: 100,
        createdAt: 0,
        modifiedAt: 0,
        tags: ['drake', 'yes-no'],
        isFavorite: false,
        folder: '/',
        phash: 'aaaa111122223333'
      },
      {
        id: '2',
        path: '/drake_untagged.jpg',
        name: 'drake_untagged.jpg',
        extension: '.jpg',
        type: 'image',
        size: 100,
        createdAt: 0,
        modifiedAt: 0,
        tags: [],
        isFavorite: false,
        folder: '/',
        phash: 'aaaa111122223332' // very similar
      },
      {
        id: '3',
        path: '/random.jpg',
        name: 'random.jpg',
        extension: '.jpg',
        type: 'image',
        size: 100,
        createdAt: 0,
        modifiedAt: 0,
        tags: ['other'],
        isFavorite: false,
        folder: '/',
        phash: '0000000000000000'
      }
    ]

    const clusters = clusterMemesBySimilarity(mockMemes, 80)
    expect(clusters.length).toBe(1)
    expect(clusters[0].memes.length).toBe(2)
    expect(clusters[0].untaggedCount).toBe(1)
    expect(clusters[0].suggestedTags).toContain('drake')
    expect(clusters[0].suggestedTags).toContain('yes-no')
  })
})
