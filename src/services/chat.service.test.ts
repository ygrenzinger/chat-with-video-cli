import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChatService } from './chat.service.js'
import { streamText } from 'ai'

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn())
}))

vi.mock('ai', () => ({
  streamText: vi.fn()
}))

describe('Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should generate system prompt with transcript embedded', () => {
    const transcript = 'Video about TypeScript testing'
    const chatService = new ChatService(transcript)

    const systemPrompt = chatService.getSystemPrompt()

    expect(systemPrompt).toContain('helpful AI')
    expect(systemPrompt).toContain(
      '<transcript>Video about TypeScript testing</transcript>'
    )
    expect(systemPrompt).toContain('markdown format')
  })

  it('should add user and assistant messages when streaming completes', async () => {
    const mockStreamText = vi.mocked(streamText)

    async function* mockTextStream() {
      yield 'Hello'
      yield ' world'
      yield '!'
    }

    mockStreamText.mockReturnValue({
      textStream: mockTextStream()
    } as any)

    const chatService = new ChatService('Test transcript')
    const testMessage = 'What is this about?'

    const response = chatService.sendMessage(testMessage)
    const chunks = []
    for await (const chunk of response) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual(['Hello', ' world', '!'])
    expect(chatService.getMessages()).toHaveLength(2)

    const messages = chatService.getMessages()
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe(testMessage)
    expect(messages[1].role).toBe('assistant')
    expect(messages[1].content).toBe('Hello world!')
    expect(messages[1].streamingComplete).toBe(true)
  })
})
