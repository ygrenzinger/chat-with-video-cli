import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { ChatInterface } from './ChatInterface.js'

describe('ChatInterface', () => {
  it('should render welcome message and input prompt', () => {
    const { lastFrame } = render(<ChatInterface />)

    const output = lastFrame()
    expect(output).toContain('Chat Mode')
    expect(output).toContain(
      'You can now ask questions about the video transcript'
    )
  })

  it('should display message history', () => {
    const { lastFrame } = render(
      <ChatInterface
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

  it('should render assistant markdown content with formatting', () => {
    const { lastFrame } = render(
      <ChatInterface
        messages={[
          {
            id: '1',
            role: 'assistant',
            content: '# Title\n\nThis has **bold** and *italic* text.',
            timestamp: new Date(),
            streamingComplete: true
          }
        ]}
      />
    )

    const output = lastFrame()
    expect(output).toContain('Assistant:')
    expect(output).toContain('Title')
    expect(output).toContain('bold')
    expect(output).toContain('italic')
  })

  it('should render user messages as plain text', () => {
    const { lastFrame } = render(
      <ChatInterface
        messages={[
          {
            id: '1',
            role: 'user',
            content: 'Tell me about **this**',
            timestamp: new Date()
          }
        ]}
      />
    )

    const output = lastFrame()
    expect(output).toContain('You:')
    expect(output).toContain('Tell me about **this**')
  })
})
