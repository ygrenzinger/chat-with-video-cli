import { describe, it, expect, beforeEach } from 'vitest'
import { ChatService } from './ai.js'

// FIXME : replace with evalite test
describe('ChatService', () => {
  let chatService: ChatService

  beforeEach(() => {
    // Mock environment variable for tests
    process.env.ANTHROPIC_API_KEY = 'test-api-key'
    chatService = new ChatService('Test video transcript content')
  })

  it('should generate system prompt with transcript', () => {
    const systemPrompt = chatService.getSystemPrompt()
    
    expect(systemPrompt).toContain('Test video transcript content')
    expect(systemPrompt).toContain('transcript')
    expect(systemPrompt).toContain('helpful AI')
  })

  it('should have sendMessage method that returns async iterable', async () => {
    // This is a basic test structure - we would normally mock the AI SDK response
    expect(typeof chatService.sendMessage).toBe('function')
    
    // Test that it returns an async iterable (for streaming)
    const response = chatService.sendMessage('What is this video about?')
    expect(response).toBeDefined()
    expect(typeof response[Symbol.asyncIterator]).toBe('function')
  })
})
