import { describe, it, expect } from 'vitest'
import { isValidYouTubeUrl } from './youtube'

describe('isValidYouTubeUrl', () => {
  it('should return true for valid YouTube URLs with https', () => {
    expect(
      isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe(true)
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true
    )
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
  })

  it('should return true for valid YouTube URLs with http', () => {
    expect(
      isValidYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe(true)
    expect(isValidYouTubeUrl('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true
    )
    expect(isValidYouTubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true)
  })

  it('should return true for valid YouTube URLs without protocol', () => {
    expect(isValidYouTubeUrl('www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('youtu.be/dQw4w9WgXcQ')).toBe(true)
  })

  it('should return true for YouTube URLs with additional parameters', () => {
    expect(
      isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')
    ).toBe(true)
    expect(
      isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz')
    ).toBe(true)
    expect(
      isValidYouTubeUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=test'
      )
    ).toBe(true)
  })

  it('should return true for YouTube URLs with underscores and hyphens in video ID', () => {
    expect(
      isValidYouTubeUrl('https://www.youtube.com/watch?v=dQ_w4-w9WgX-Q')
    ).toBe(true)
    expect(isValidYouTubeUrl('https://youtu.be/dQ_w4-w9WgX-Q')).toBe(true)
  })

  it('should return false for invalid URLs', () => {
    expect(isValidYouTubeUrl('https://invalid-url.com')).toBe(false)
    expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false)
    expect(isValidYouTubeUrl('https://facebook.com/video')).toBe(false)
    expect(isValidYouTubeUrl('not-a-url-at-all')).toBe(false)
  })

  it('should return false for malformed YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://youtube.com/watch')).toBe(false)
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=')).toBe(false)
    expect(isValidYouTubeUrl('https://youtu.be/')).toBe(false)
    expect(isValidYouTubeUrl('youtube.com')).toBe(false)
  })

  it('should return false for empty string and whitespace', () => {
    expect(isValidYouTubeUrl('')).toBe(false)
    expect(isValidYouTubeUrl('   ')).toBe(false)
    expect(isValidYouTubeUrl('\n')).toBe(false)
  })

  it('should return false for YouTube URLs with invalid characters', () => {
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=invalid@id')).toBe(
      false
    )
    expect(isValidYouTubeUrl('https://youtu.be/invalid#id')).toBe(false)
    expect(isValidYouTubeUrl('https://youtube.com/watch?v=invalid id')).toBe(
      false
    )
  })
})
