import { describe, it, expect } from 'vitest'
import {
  addYouTubeTimestampLinks,
  createYouTubeTimestampUrl,
  extractYouTubeVideoId,
  isValidYouTubeUrl
} from './youtube'

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

  it('should return true for modern YouTube URL formats', () => {
    expect(isValidYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true
    )
    expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      true
    )
    expect(
      isValidYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    ).toBe(true)
    expect(
      isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')
    ).toBe(true)
  })

  it('should return true for YouTube URLs with underscores and hyphens in video ID', () => {
    expect(
      isValidYouTubeUrl('https://www.youtube.com/watch?v=dQ_w4-w9WgX')
    ).toBe(true)
    expect(isValidYouTubeUrl('https://youtu.be/dQ_w4-w9WgX')).toBe(true)
  })

  it('should return false for invalid URLs', () => {
    expect(isValidYouTubeUrl('https://invalid-url.com')).toBe(false)
    expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false)
    expect(isValidYouTubeUrl('https://facebook.com/video')).toBe(false)
    expect(
      isValidYouTubeUrl('https://not-youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe(false)
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

  it('should extract YouTube video IDs from supported URLs', () => {
    expect(
      extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ'
    )
    expect(
      extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    ).toBe('dQw4w9WgXcQ')
    expect(
      extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')
    ).toBe('dQw4w9WgXcQ')
  })
})

describe('createYouTubeTimestampUrl', () => {
  it('should create short YouTube timestamp links from supported URLs', () => {
    expect(
      createYouTubeTimestampUrl(
        'https://www.youtube.com/watch?v=RjfbvDXpFls',
        938
      )
    ).toBe('https://youtu.be/RjfbvDXpFls?t=938')
    expect(createYouTubeTimestampUrl('https://youtu.be/RjfbvDXpFls', 1344)).toBe(
      'https://youtu.be/RjfbvDXpFls?t=1344'
    )
  })

  it('should return null for unsupported video URLs', () => {
    expect(createYouTubeTimestampUrl('https://example.com/video', 938)).toBeNull()
  })
})

describe('addYouTubeTimestampLinks', () => {
  const videoUrl = 'https://www.youtube.com/watch?v=RjfbvDXpFls'

  it('should append a YouTube link next to parenthesized MM:SS timestamps', () => {
    expect(
      addYouTubeTimestampLinks(
        '- How to know what is critical? You read the code. (22:24)',
        videoUrl
      )
    ).toBe(
      '- How to know what is critical? You read the code. (22:24) https://youtu.be/RjfbvDXpFls?t=1344'
    )
  })

  it('should append links for HH:MM:SS timestamps', () => {
    expect(addYouTubeTimestampLinks('Long video point (1:02:03)', videoUrl)).toBe(
      'Long video point (1:02:03) https://youtu.be/RjfbvDXpFls?t=3723'
    )
  })

  it('should not add duplicate links when a timestamp already has one', () => {
    const markdown =
      'Point (22:24) https://youtu.be/RjfbvDXpFls?t=1344 and another point'

    expect(addYouTubeTimestampLinks(markdown, videoUrl)).toBe(markdown)
  })

  it('should ignore invalid timestamp values', () => {
    expect(addYouTubeTimestampLinks('Invalid (22:99)', videoUrl)).toBe(
      'Invalid (22:99)'
    )
  })
})
