import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { ChatInterface } from './ChatInterface.js'
import { ChatService } from '../services/chat.service.js'

describe('ChatInterface', () => {
  it('should render welcome message and input prompt', () => {
    const mockChatService = {} as ChatService
    const mockOnExit = vi.fn()
    const transcript = 'Test video transcript'

    const { lastFrame } = render(
      <ChatInterface
        transcript={transcript}
        chatService={mockChatService}
        onExit={mockOnExit}
      />
    )

    const output = lastFrame()
    expect(output).toContain('Chat Mode')
    expect(output).toContain(
      'You can now ask questions about the video transcript'
    )
  })

  it('should display message history', () => {
    const mockChatService = {} as ChatService
    const mockOnExit = vi.fn()
    const transcript = 'Test video transcript'

    const { lastFrame } = render(
      <ChatInterface
        transcript={transcript}
        chatService={mockChatService}
        onExit={mockOnExit}
        messages={[
          {
            id: '1',
            role: 'user',
            content: 'What is this video about?',
            timestamp: new Date()
          },
          {
            id: '2',
            role: 'assistant',
            content: 'This video is about...',
            timestamp: new Date(),
            streamingComplete: true
          }
        ]}
      />
    )

    const output = lastFrame()
    expect(output).toContain('What is this video about?')
    expect(output).toContain('This video is about...')
  })
})
