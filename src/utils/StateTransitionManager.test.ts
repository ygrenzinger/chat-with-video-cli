import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console.error to avoid test pollution
vi.spyOn(console, 'error').mockImplementation(() => {})
import { StateTransitionManager } from './StateTransitionManager.js'
import { ChatWithVideoState } from '../hooks/useChatState.js'
import {
  SubtitleLanguage,
  SubtitleDownloadResult
} from '../services/subtitle.js'
import { ChatService } from '../services/chat.service.js'

describe('StateTransitionManager', () => {
  let mockSubtitleService: any
  let mockOnStateChange: ReturnType<typeof vi.fn>
  let mockCreateChatService: ReturnType<typeof vi.fn>
  let mockChatService: ChatService

  const mockSubtitle: SubtitleLanguage = {
    name: 'English',
    code: 'en',
    type: 'auto'
  }

  const url = 'https://youtube.com/watch?v=test'

  beforeEach(() => {
    mockSubtitleService = {
      retrieveRawText: vi.fn()
    }
    mockOnStateChange = vi.fn()
    mockCreateChatService = vi.fn()
    mockChatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
  })

  describe('processSubtitleSelection', () => {
    it('should complete the full flow successfully', async () => {
      const transcript = 'Test transcript content'
      const successResult: SubtitleDownloadResult = {
        success: true,
        videoName: 'test',
        content: transcript
      }

      mockSubtitleService.retrieveRawText.mockResolvedValue(successResult)
      mockCreateChatService.mockResolvedValue(mockChatService)

      await StateTransitionManager.processSubtitleSelection(
        mockSubtitle,
        url,
        mockSubtitleService,
        mockOnStateChange,
        mockCreateChatService
      )

      // Verify all state transitions
      expect(mockOnStateChange).toHaveBeenCalledTimes(3)

      // First call: subtitle-selected
      expect(mockOnStateChange).toHaveBeenNthCalledWith(1, {
        status: 'subtitle-selected',
        selectedSubtitle: mockSubtitle
      })

      // Second call: chat-initializing
      expect(mockOnStateChange).toHaveBeenNthCalledWith(2, {
        status: 'chat-initializing',
        transcript,
        videoName: 'test'
      })

      // Third call: chat-ready
      expect(mockOnStateChange).toHaveBeenNthCalledWith(3, {
        status: 'chat-ready',
        transcript,
        chatService: mockChatService,
        videoName: 'test'
      })

      expect(mockSubtitleService.retrieveRawText).toHaveBeenCalledWith(
        url,
        mockSubtitle
      )
      expect(mockCreateChatService).toHaveBeenCalledWith(transcript)
    })

    it('should handle download failure', async () => {
      const errorResult: SubtitleDownloadResult = {
        success: false,
        error: 'Download failed'
      }

      mockSubtitleService.retrieveRawText.mockResolvedValue(errorResult)

      await StateTransitionManager.processSubtitleSelection(
        mockSubtitle,
        url,
        mockSubtitleService,
        mockOnStateChange,
        mockCreateChatService
      )

      expect(mockOnStateChange).toHaveBeenCalledTimes(2)

      // First call: subtitle-selected
      expect(mockOnStateChange).toHaveBeenNthCalledWith(1, {
        status: 'subtitle-selected',
        selectedSubtitle: mockSubtitle
      })

      // Second call: subtitle-downloaded with error
      expect(mockOnStateChange).toHaveBeenNthCalledWith(2, {
        selectedSubtitle: mockSubtitle,
        status: 'subtitle-downloaded',
        downloadStatus: 'finished',
        downloadResult: errorResult
      })

      expect(mockCreateChatService).not.toHaveBeenCalled()
    })

    it('should handle chat service initialization failure', async () => {
      const transcript = 'Test transcript content'
      const successResult: SubtitleDownloadResult = {
        success: true,
        videoName: 'test',
        content: transcript
      }

      mockSubtitleService.retrieveRawText.mockResolvedValue(successResult)
      const chatServiceError = new Error('Chat service initialization failed')
      mockCreateChatService.mockRejectedValue(chatServiceError)

      await StateTransitionManager.processSubtitleSelection(
        mockSubtitle,
        url,
        mockSubtitleService,
        mockOnStateChange,
        mockCreateChatService
      )

      expect(mockOnStateChange).toHaveBeenCalledTimes(3)

      // Last call should be error state
      expect(mockOnStateChange).toHaveBeenNthCalledWith(3, {
        selectedSubtitle: mockSubtitle,
        status: 'subtitle-downloaded',
        downloadStatus: 'finished',
        downloadResult: {
          success: false,
          error: 'Chat service initialization failed'
        }
      })
    })

    it('should handle subtitle service exception', async () => {
      const serviceError = new Error('Network error')
      mockSubtitleService.retrieveRawText.mockRejectedValue(serviceError)

      await StateTransitionManager.processSubtitleSelection(
        mockSubtitle,
        url,
        mockSubtitleService,
        mockOnStateChange,
        mockCreateChatService
      )

      expect(mockOnStateChange).toHaveBeenCalledTimes(2)

      // Last call should be error state
      expect(mockOnStateChange).toHaveBeenNthCalledWith(2, {
        selectedSubtitle: mockSubtitle,
        status: 'subtitle-downloaded',
        downloadStatus: 'finished',
        downloadResult: {
          success: false,
          error: 'Network error'
        }
      })
    })

    it('should handle non-Error exceptions', async () => {
      const stringError = 'String error message'
      mockSubtitleService.retrieveRawText.mockRejectedValue(stringError)

      await StateTransitionManager.processSubtitleSelection(
        mockSubtitle,
        url,
        mockSubtitleService,
        mockOnStateChange,
        mockCreateChatService
      )

      expect(mockOnStateChange).toHaveBeenNthCalledWith(2, {
        selectedSubtitle: mockSubtitle,
        status: 'subtitle-downloaded',
        downloadStatus: 'finished',
        downloadResult: {
          success: false,
          error: 'String error message'
        }
      })
    })
  })

  describe('isValidTransition', () => {
    const validCases = [
      ['started', 'subtitle-selected'],
      ['subtitle-selected', 'subtitle-downloaded'],
      ['subtitle-selected', 'chat-initializing'],
      ['subtitle-downloaded', 'subtitle-selected'],
      ['chat-initializing', 'chat-ready'],
      ['chat-ready', 'chat-active'],
      ['chat-active', 'chat-ready']
    ] as const

    const invalidCases = [
      ['started', 'chat-ready'],
      ['subtitle-selected', 'chat-active'],
      ['chat-initializing', 'subtitle-selected'],
      ['chat-ready', 'started'],
      ['chat-active', 'started']
    ] as const

    validCases.forEach(([from, to]) => {
      it(`should allow transition from ${from} to ${to}`, () => {
        expect(StateTransitionManager.isValidTransition(from, to)).toBe(true)
      })
    })

    invalidCases.forEach(([from, to]) => {
      it(`should not allow transition from ${from} to ${to}`, () => {
        expect(StateTransitionManager.isValidTransition(from, to)).toBe(false)
      })
    })
  })

  describe('getNextStates', () => {
    it('should return correct next states for each status', () => {
      expect(StateTransitionManager.getNextStates('started')).toEqual([
        'subtitle-selected'
      ])
      expect(StateTransitionManager.getNextStates('subtitle-selected')).toEqual(
        ['subtitle-downloaded', 'chat-initializing']
      )
      expect(
        StateTransitionManager.getNextStates('subtitle-downloaded')
      ).toEqual(['subtitle-selected'])
      expect(StateTransitionManager.getNextStates('chat-initializing')).toEqual(
        ['chat-ready']
      )
      expect(StateTransitionManager.getNextStates('chat-ready')).toEqual([
        'chat-active'
      ])
      expect(StateTransitionManager.getNextStates('chat-active')).toEqual([])
    })
  })

  describe('canProcessMessages', () => {
    it('should return true for chat-active and chat-ready states', () => {
      const activeState: ChatWithVideoState = {
        status: 'chat-active',
        transcript: 'test',
        chatService: mockChatService,
        videoName: 'test'
      }
      const readyState: ChatWithVideoState = {
        status: 'chat-ready',
        transcript: 'test',
        chatService: mockChatService,
        videoName: 'test'
      }

      expect(StateTransitionManager.canProcessMessages(activeState)).toBe(true)
      expect(StateTransitionManager.canProcessMessages(readyState)).toBe(true)
    })

    it('should return false for other states', () => {
      const states: ChatWithVideoState[] = [
        { status: 'started' },
        { status: 'subtitle-selected', selectedSubtitle: mockSubtitle },
        { status: 'chat-initializing', transcript: 'test', videoName: 'test' }
      ]

      states.forEach(state => {
        expect(StateTransitionManager.canProcessMessages(state)).toBe(false)
      })
    })
  })

  describe('isTerminalState', () => {
    it('should return true for terminal states', () => {
      const activeState: ChatWithVideoState = {
        status: 'chat-active',
        transcript: 'test',
        chatService: mockChatService,
        videoName: 'test'
      }
      const downloadedState: ChatWithVideoState = {
        status: 'subtitle-downloaded',
        selectedSubtitle: mockSubtitle,
        downloadStatus: 'finished',
        downloadResult: { success: true, videoName: 'test', content: 'test' }
      }

      expect(StateTransitionManager.isTerminalState(activeState)).toBe(true)
      expect(StateTransitionManager.isTerminalState(downloadedState)).toBe(true)
    })

    it('should return false for non-terminal states', () => {
      const states: ChatWithVideoState[] = [
        { status: 'started' },
        { status: 'subtitle-selected', selectedSubtitle: mockSubtitle },
        { status: 'chat-initializing', transcript: 'test', videoName: 'test' },
        {
          status: 'chat-ready',
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        expect(StateTransitionManager.isTerminalState(state)).toBe(false)
      })
    })
  })

  describe('isErrorState', () => {
    it('should return true for failed download state', () => {
      const errorState: ChatWithVideoState = {
        status: 'subtitle-downloaded',
        selectedSubtitle: mockSubtitle,
        downloadStatus: 'finished',
        downloadResult: { success: false, error: 'Download failed' }
      }

      expect(StateTransitionManager.isErrorState(errorState)).toBe(true)
    })

    it('should return false for successful download state', () => {
      const successState: ChatWithVideoState = {
        status: 'subtitle-downloaded',
        selectedSubtitle: mockSubtitle,
        downloadStatus: 'finished',
        downloadResult: { success: true, videoName: 'test', content: 'test' }
      }

      expect(StateTransitionManager.isErrorState(successState)).toBe(false)
    })

    it('should return false for non-download states', () => {
      const states: ChatWithVideoState[] = [
        { status: 'started' },
        { status: 'subtitle-selected', selectedSubtitle: mockSubtitle },
        { status: 'chat-initializing', transcript: 'test', videoName: 'test' },
        {
          status: 'chat-ready',
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        },
        {
          status: 'chat-active',
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        expect(StateTransitionManager.isErrorState(state)).toBe(false)
      })
    })
  })

  describe('getStateDescription', () => {
    it('should return appropriate descriptions for each state', () => {
      expect(
        StateTransitionManager.getStateDescription({ status: 'started' })
      ).toBe('Waiting for subtitle selection')

      expect(
        StateTransitionManager.getStateDescription({
          status: 'subtitle-selected',
          selectedSubtitle: mockSubtitle
        })
      ).toBe('Selected: English - Downloading...')

      expect(
        StateTransitionManager.getStateDescription({
          status: 'subtitle-downloaded',
          selectedSubtitle: mockSubtitle,
          downloadStatus: 'finished',
          downloadResult: { success: true, videoName: 'test', content: 'test' }
        })
      ).toBe('Subtitle downloaded successfully')

      expect(
        StateTransitionManager.getStateDescription({
          status: 'subtitle-downloaded',
          selectedSubtitle: mockSubtitle,
          downloadStatus: 'finished',
          downloadResult: { success: false, error: 'Network error' }
        })
      ).toBe('Download failed: Network error')

      expect(
        StateTransitionManager.getStateDescription({
          status: 'chat-initializing',
          transcript: 'test',
          videoName: 'test'
        })
      ).toBe('Initializing AI chat service...')

      expect(
        StateTransitionManager.getStateDescription({
          status: 'chat-ready',
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        })
      ).toBe('Ready to chat! Type your first message.')

      expect(
        StateTransitionManager.getStateDescription({
          status: 'chat-active',
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        })
      ).toBe('Chat active')
    })
  })
})
