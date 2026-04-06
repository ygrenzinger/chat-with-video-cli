import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useChatMachine } from './useChatMachine.js'
import {
  type SubtitleLanguage,
  type SubtitleService
} from '../services/subtitle.js'
import { type ChatService } from '../services/chat.service.js'
import { type ChatServiceFactory } from '../utils/factories.js'

const subtitle: SubtitleLanguage = {
  code: 'en',
  name: 'English',
  type: 'auto'
}

const url = 'https://youtube.com/watch?v=test'

describe('useChatMachine', () => {
  it('starts in selectingSubtitle', () => {
    const subtitleService: SubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      retrieveRawText: vi.fn()
    }
    const chatServiceFactory: ChatServiceFactory = vi.fn()

    const { result } = renderHook(() =>
      useChatMachine(url, subtitleService, chatServiceFactory)
    )

    expect(result.current.isSelectingSubtitle).toBe(true)
    expect(result.current.context.url).toBe(url)
  })

  it('reaches chatActive on a successful flow', async () => {
    const subtitleService: SubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      retrieveRawText: vi.fn().mockResolvedValue({
        success: true,
        content: 'transcript',
        videoName: 'video'
      })
    }
    const chatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
    const chatServiceFactory: ChatServiceFactory = vi
      .fn()
      .mockResolvedValue(chatService)

    const { result } = renderHook(() =>
      useChatMachine(url, subtitleService, chatServiceFactory)
    )

    act(() => {
      result.current.send({ type: 'SELECT_SUBTITLE', subtitle })
    })

    await waitFor(() => {
      expect(result.current.isChatActive).toBe(true)
    })

    expect(result.current.context.transcript).toBe('transcript')
    expect(result.current.context.chatService).toBe(chatService)
  })

  it('exposes download error state and supports retry', async () => {
    const subtitleService: SubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      retrieveRawText: vi.fn().mockResolvedValue({
        success: false,
        error: 'Download failed'
      })
    }
    const chatServiceFactory: ChatServiceFactory = vi.fn()

    const { result } = renderHook(() =>
      useChatMachine(url, subtitleService, chatServiceFactory)
    )

    act(() => {
      result.current.send({ type: 'SELECT_SUBTITLE', subtitle })
    })

    await waitFor(() => {
      expect(result.current.isDownloadError).toBe(true)
    })

    expect(result.current.context.error).toBe('Download failed')

    act(() => {
      result.current.send({ type: 'RETRY' })
    })

    expect(result.current.isSelectingSubtitle).toBe(true)
    expect(result.current.context.error).toBeNull()
  })
})
