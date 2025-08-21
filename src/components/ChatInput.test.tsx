import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { ChatInput } from './ChatInput.js'

describe('ChatInput', () => {
  it('should render input prompt when not disabled', () => {
    const mockOnSubmit = vi.fn()

    const { lastFrame } = render(
      <ChatInput onSubmit={mockOnSubmit} disabled={false} />
    )

    const output = lastFrame()
    expect(output).toContain('>') // Input prompt indicator
  })

  it('should show loading state when disabled', () => {
    const mockOnSubmit = vi.fn()

    const { lastFrame } = render(
      <ChatInput onSubmit={mockOnSubmit} disabled={true} />
    )

    const output = lastFrame()
    expect(output).toContain('...') // Loading indicator
  })
})
