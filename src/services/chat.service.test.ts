import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChatService } from './chat.service.js'
import { streamText } from 'ai'
import { ModelSelectionService, type ModelConfiguration } from './model-selection.service.js'

vi.mock('./model-selection.service.js', () => ({
  ModelSelectionService: {
    selectModel: vi.fn()
  }
}))

vi.mock('ai', () => ({
  streamText: vi.fn()
}))

describe('Chat Service', () => {
  const mockModelConfig: ModelConfiguration = {
    provider: 'anthropic',
    providerInstance: {} as any,
    model: {} as any,
    modelId: 'claude-3-5-haiku-latest'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ModelSelectionService.selectModel).mockReturnValue(mockModelConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should generate system prompt with transcript embedded', () => {
    const transcript = 'Video about TypeScript testing'
    const chatService = new ChatService(transcript, mockModelConfig)

    const systemPrompt = chatService.getSystemPrompt()

    expect(systemPrompt).toContain('helpful AI')
    expect(systemPrompt).toContain(
      '<transcript>Video about TypeScript testing</transcript>'
    )
    expect(systemPrompt).toContain('markdown format')
  })

  it('should use ModelSelectionService when no model config provided', () => {
    const transcript = 'Test transcript'
    new ChatService(transcript)

    expect(ModelSelectionService.selectModel).toHaveBeenCalledOnce()
  })

  it('should not call ModelSelectionService when model config is provided', () => {
    const transcript = 'Test transcript'
    new ChatService(transcript, mockModelConfig)

    expect(ModelSelectionService.selectModel).not.toHaveBeenCalled()
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

    const chatService = new ChatService('Test transcript', mockModelConfig)
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
