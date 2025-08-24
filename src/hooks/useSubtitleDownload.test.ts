import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSubtitleDownload } from './useSubtitleDownload.js'
import { SubtitleService, SubtitleLanguage } from '../services/subtitle.js'
import { ChatWithVideoState } from './useChatState.js'

describe('useSubtitleDownload', () => {
  let mockSubtitleService: SubtitleService
  let mockOnDownloadSuccess: ReturnType<typeof vi.fn>
  let mockOnDownloadError: ReturnType<typeof vi.fn>

  const flush = () => new Promise(resolve => setTimeout(resolve, 1))

  const mockSubtitle: SubtitleLanguage = {
    code: 'en',
    name: 'English',
    type: 'auto'
  }

  const url = 'https://youtube.com/watch?v=test'

  beforeEach(() => {
    mockSubtitleService = {
      isAvailable: vi.fn(),
      retrieveRawText: vi.fn(),
      getAvailableSubtitles: vi.fn()
    }
    mockOnDownloadSuccess = vi.fn()
    mockOnDownloadError = vi.fn()
  })

  const renderDownloadHook = (chatState: ChatWithVideoState) => {
    return renderHook(() =>
      useSubtitleDownload({
        chatState,
        url,
        subtitleService: mockSubtitleService,
        onDownloadSuccess: mockOnDownloadSuccess,
        onDownloadError: mockOnDownloadError
      })
    )
  }

  it('should not trigger download when status is not subtitle-selected', () => {
    const states: ChatWithVideoState[] = [
      { status: 'started' },
      { status: 'chat-initializing', transcript: 'test' },
      { status: 'chat-ready', transcript: 'test', chatService: {} as any },
      { status: 'chat-active', transcript: 'test', chatService: {} as any }
    ]

    states.forEach(state => {
      renderDownloadHook(state)
      expect(mockSubtitleService.retrieveRawText).not.toHaveBeenCalled()
    })
  })

  it('should trigger download when status is subtitle-selected', async () => {
    const chatState: ChatWithVideoState = {
      status: 'subtitle-selected',
      selectedSubtitle: mockSubtitle
    }

    vi.mocked(mockSubtitleService.retrieveRawText).mockResolvedValue({
      success: true,
      content: 'test transcript'
    })

    renderDownloadHook(chatState)

    expect(mockSubtitleService.retrieveRawText).toHaveBeenCalledWith(
      url,
      mockSubtitle
    )
  })

  it('should call onDownloadSuccess when download succeeds', async () => {
    const chatState: ChatWithVideoState = {
      status: 'subtitle-selected',
      selectedSubtitle: mockSubtitle
    }

    const transcript = 'test transcript content'
    vi.mocked(mockSubtitleService.retrieveRawText).mockResolvedValue({
      success: true,
      content: transcript
    })

    renderDownloadHook(chatState)

    // Wait for the async operation
    await flush()

    expect(mockOnDownloadSuccess).toHaveBeenCalledWith(transcript)
    expect(mockOnDownloadError).not.toHaveBeenCalled()
  })

  it('should call onDownloadError when download fails', async () => {
    const chatState: ChatWithVideoState = {
      status: 'subtitle-selected',
      selectedSubtitle: mockSubtitle
    }

    vi.mocked(mockSubtitleService.retrieveRawText).mockResolvedValue({
      success: false,
      error: 'Download failed'
    })

    renderDownloadHook(chatState)

    // Wait for the async operation
    await flush()

    expect(mockOnDownloadError).toHaveBeenCalledWith(mockSubtitle, {
      success: false,
      error: 'Download failed'
    })
    expect(mockOnDownloadSuccess).not.toHaveBeenCalled()
  })

  it('should call onDownloadError when service throws exception', async () => {
    const chatState: ChatWithVideoState = {
      status: 'subtitle-selected',
      selectedSubtitle: mockSubtitle
    }

    const error = new Error('Network error')
    vi.mocked(mockSubtitleService.retrieveRawText).mockRejectedValue(error)

    renderDownloadHook(chatState)

    // Wait for the async operation
    await flush()

    expect(mockOnDownloadError).toHaveBeenCalledWith(mockSubtitle, error)
    expect(mockOnDownloadSuccess).not.toHaveBeenCalled()
  })

  it('should re-trigger download when chatState changes', () => {
    const initialState: ChatWithVideoState = { status: 'started' }
    const { rerender } = renderDownloadHook(initialState)

    expect(mockSubtitleService.retrieveRawText).not.toHaveBeenCalled()

    const newState: ChatWithVideoState = {
      status: 'subtitle-selected',
      selectedSubtitle: mockSubtitle
    }

    vi.mocked(mockSubtitleService.retrieveRawText).mockResolvedValue({
      success: true,
      content: 'test'
    })

    rerender()
    renderDownloadHook(newState)

    expect(mockSubtitleService.retrieveRawText).toHaveBeenCalledWith(
      url,
      mockSubtitle
    )
  })
})
