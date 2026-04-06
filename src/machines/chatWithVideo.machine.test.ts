import { createActor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import { chatWithVideoMachine } from './chatWithVideo.machine.js'
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

const waitFor = async (predicate: () => boolean) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (predicate()) {
      return
    }

    await Promise.resolve()
  }

  throw new Error('Timed out waiting for machine state')
}

describe('chatWithVideoMachine', () => {
  it('follows the happy path into chatActive', async () => {
    const mockSubtitleService: SubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      retrieveRawText: vi.fn().mockResolvedValue({
        success: true,
        content: 'transcript',
        videoName: 'video'
      })
    }
    const mockChatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
    const mockChatServiceFactory: ChatServiceFactory = vi
      .fn()
      .mockResolvedValue(mockChatService)

    const actor = createActor(chatWithVideoMachine, {
      input: {
        url,
        subtitleService: mockSubtitleService,
        chatServiceFactory: mockChatServiceFactory
      }
    })
    const seenStates: string[] = []

    actor.subscribe(snapshot => {
      seenStates.push(String(snapshot.value))
    })

    actor.start()
    actor.send({ type: 'SELECT_SUBTITLE', subtitle })

    await waitFor(() => actor.getSnapshot().matches('chatActive'))

    expect(seenStates).toEqual(
      expect.arrayContaining([
        'selectingSubtitle',
        'downloadingSubtitle',
        'initializingChat',
        'chatActive'
      ])
    )
    const chatReadyState = chatWithVideoMachine.config.states?.chatReady as {
      always?: { target: string }
    }

    expect(chatReadyState.always).toEqual({
      target: 'chatActive'
    })
    expect(actor.getSnapshot().context.transcript).toBe('transcript')
    expect(actor.getSnapshot().context.videoName).toBe('video')
    expect(actor.getSnapshot().context.chatService).toBe(mockChatService)
  })

  it('enters downloadError and retries back to selectingSubtitle', async () => {
    const mockSubtitleService: SubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      retrieveRawText: vi.fn().mockResolvedValue({
        success: false,
        error: 'Download failed'
      })
    }
    const mockChatServiceFactory: ChatServiceFactory = vi.fn()

    const actor = createActor(chatWithVideoMachine, {
      input: {
        url,
        subtitleService: mockSubtitleService,
        chatServiceFactory: mockChatServiceFactory
      }
    })

    actor.start()
    actor.send({ type: 'SELECT_SUBTITLE', subtitle })

    await waitFor(() => actor.getSnapshot().matches('downloadError'))

    expect(actor.getSnapshot().context.error).toBe('Download failed')

    actor.send({ type: 'RETRY' })

    expect(actor.getSnapshot().matches('selectingSubtitle')).toBe(true)
    expect(actor.getSnapshot().context.selectedSubtitle).toBeNull()
    expect(actor.getSnapshot().context.error).toBeNull()
  })

  it('enters chatInitError when chat service initialization fails', async () => {
    const mockSubtitleService: SubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      retrieveRawText: vi.fn().mockResolvedValue({
        success: true,
        content: 'transcript',
        videoName: 'video'
      })
    }
    const mockChatServiceFactory: ChatServiceFactory = vi
      .fn()
      .mockRejectedValue(new Error('Init failed'))

    const actor = createActor(chatWithVideoMachine, {
      input: {
        url,
        subtitleService: mockSubtitleService,
        chatServiceFactory: mockChatServiceFactory
      }
    })

    actor.start()
    actor.send({ type: 'SELECT_SUBTITLE', subtitle })

    await waitFor(() => actor.getSnapshot().matches('chatInitError'))

    expect(actor.getSnapshot().context.error).toBe('Init failed')
  })
})
