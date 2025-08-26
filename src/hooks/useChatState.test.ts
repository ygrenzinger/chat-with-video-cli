import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatState } from './useChatState.js'
import {
  SubtitleLanguage,
  SubtitleDownloadResult
} from '../services/subtitle.js'
import { ChatService } from '../services/chat.service.js'

describe('useChatState', () => {
  const mockSubtitle: SubtitleLanguage = {
    code: 'en',
    name: 'English',
    type: 'auto'
  }

  const mockDownloadResult: SubtitleDownloadResult = {
    success: true,
    videoName: 'test',
    content: 'test transcript'
  }

  const mockChatService = {
    sendMessage: vi.fn(),
    getMessages: vi.fn(),
    getSystemPrompt: vi.fn()
  } as unknown as ChatService

  describe('initial state', () => {
    it('should start with default "started" state', () => {
      const { result } = renderHook(() => useChatState())

      expect(result.current.chatState).toEqual({ status: 'started' })
      expect(result.current.canProcessMessages()).toBe(false)
      expect(result.current.getCurrentTranscript()).toBe(null)
      expect(result.current.getCurrentChatService()).toBe(null)
    })

    it('should accept custom initial state', () => {
      const initialState = {
        status: 'subtitle-selected' as const,
        selectedSubtitle: mockSubtitle
      }
      const { result } = renderHook(() => useChatState(initialState))

      expect(result.current.chatState).toEqual(initialState)
    })
  })

  describe('state transitions', () => {
    it('should transition from started to subtitle-selected', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.transitionToSubtitleSelected(mockSubtitle)
      })

      expect(result.current.chatState).toEqual({
        status: 'subtitle-selected',
        selectedSubtitle: mockSubtitle
      })
    })

    it('should transition to subtitle-downloaded', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.transitionToSubtitleDownloaded(
          mockSubtitle,
          mockDownloadResult
        )
      })

      expect(result.current.chatState).toEqual({
        status: 'subtitle-downloaded',
        selectedSubtitle: mockSubtitle,
        downloadStatus: 'finished',
        downloadResult: mockDownloadResult
      })
    })

    it('should transition to chat-initializing', () => {
      const { result } = renderHook(() => useChatState())
      const transcript = 'test transcript'
      const videoName = 'test'

      act(() => {
        result.current.transitionToChatInitializing(transcript, videoName)
      })

      expect(result.current.chatState).toEqual({
        status: 'chat-initializing',
        transcript,
        videoName
      })
      expect(result.current.getCurrentTranscript()).toBe(transcript)
    })

    it('should transition to chat-ready', () => {
      const { result } = renderHook(() => useChatState())
      const transcript = 'test transcript'
      const videoName = 'test'

      act(() => {
        result.current.transitionToChatReady(
          transcript,
          mockChatService,
          videoName
        )
      })

      expect(result.current.chatState).toEqual({
        status: 'chat-ready',
        transcript,
        chatService: mockChatService,
        videoName
      })
      expect(result.current.canProcessMessages()).toBe(true)
      expect(result.current.getCurrentTranscript()).toBe(transcript)
      expect(result.current.getCurrentChatService()).toBe(mockChatService)
    })

    it('should transition to chat-active', () => {
      const { result } = renderHook(() => useChatState())
      const transcript = 'test transcript'
      const videoName = 'test'

      act(() => {
        result.current.transitionToChatActive(
          transcript,
          mockChatService,
          videoName
        )
      })

      expect(result.current.chatState).toEqual({
        status: 'chat-active',
        transcript,
        chatService: mockChatService,
        videoName: 'test'
      })
      expect(result.current.canProcessMessages()).toBe(true)
      expect(result.current.getCurrentTranscript()).toBe(transcript)
      expect(result.current.getCurrentChatService()).toBe(mockChatService)
    })
  })

  describe('helper methods', () => {
    it('should return false for canProcessMessages in early states', () => {
      const states = [
        { status: 'started' as const },
        {
          status: 'subtitle-selected' as const,
          selectedSubtitle: mockSubtitle
        },
        {
          status: 'chat-initializing' as const,
          transcript: 'test',
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        const { result } = renderHook(() => useChatState(state))
        expect(result.current.canProcessMessages()).toBe(false)
      })
    })

    it('should return true for canProcessMessages in chat states', () => {
      const states = [
        {
          status: 'chat-ready' as const,
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        },
        {
          status: 'chat-active' as const,
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        const { result } = renderHook(() => useChatState(state))
        expect(result.current.canProcessMessages()).toBe(true)
      })
    })

    it('should return null for transcript in early states', () => {
      const states = [
        { status: 'started' as const },
        { status: 'subtitle-selected' as const, selectedSubtitle: mockSubtitle }
      ]

      states.forEach(state => {
        const { result } = renderHook(() => useChatState(state))
        expect(result.current.getCurrentTranscript()).toBe(null)
      })
    })

    it('should return transcript in chat states', () => {
      const transcript = 'test transcript'
      const states = [
        { status: 'chat-initializing' as const, transcript, videoName: 'test' },
        {
          status: 'chat-ready' as const,
          transcript,
          chatService: mockChatService,
          videoName: 'test'
        },
        {
          status: 'chat-active' as const,
          transcript,
          chatService: mockChatService,
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        const { result } = renderHook(() => useChatState(state))
        expect(result.current.getCurrentTranscript()).toBe(transcript)
      })
    })

    it('should return null for chat service in non-chat states', () => {
      const states = [
        { status: 'started' as const },
        {
          status: 'subtitle-selected' as const,
          selectedSubtitle: mockSubtitle
        },
        {
          status: 'chat-initializing' as const,
          transcript: 'test',
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        const { result } = renderHook(() => useChatState(state))
        expect(result.current.getCurrentChatService()).toBe(null)
      })
    })

    it('should return chat service in active chat states', () => {
      const states = [
        {
          status: 'chat-ready' as const,
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        },
        {
          status: 'chat-active' as const,
          transcript: 'test',
          chatService: mockChatService,
          videoName: 'test'
        }
      ]

      states.forEach(state => {
        const { result } = renderHook(() => useChatState(state))
        expect(result.current.getCurrentChatService()).toBe(mockChatService)
      })
    })
  })
})
