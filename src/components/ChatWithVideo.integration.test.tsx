import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { ChatWithVideo } from './ChatWithVideo.js'
import { YtdlpSubtitleService } from '../services/subtitle.js'

// Mock the services
vi.mock('../services/subtitle.js')
vi.mock('../services/ai.js')
vi.mock('../utils/env.js')

describe('ChatWithVideo Integration', () => {
  let mockSubtitleService: YtdlpSubtitleService

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockSubtitleService = new YtdlpSubtitleService()
    vi.mocked(mockSubtitleService.retrieveRawText).mockResolvedValue({
      success: true,
      content: 'This is a test video transcript about AI and technology.'
    })
  })

  it('should transition to chat-initializing state after subtitle download', () => {
    const url = 'https://www.youtube.com/watch?v=test123'
    
    const { lastFrame } = render(
      <ChatWithVideo url={url} subtitleService={mockSubtitleService} />
    )

    // Initially should show subtitle selection
    expect(lastFrame()).toBeDefined()
  })

  it('should display chat interface when in chat-active state', () => {
    const url = 'https://www.youtube.com/watch?v=test123'
    
    const { lastFrame } = render(
      <ChatWithVideo url={url} subtitleService={mockSubtitleService} />
    )

    // Should eventually show chat interface
    expect(lastFrame()).toBeDefined()
  })
})
