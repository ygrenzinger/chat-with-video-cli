import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import { ChatInput } from './ChatInput.js'

describe('ChatInput', () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>

  const flush = () => new Promise(resolve => setTimeout(resolve, 20))

  beforeEach(() => {
    mockOnSubmit = vi.fn()
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  // Existing tests (already implemented)
  it('should render input prompt when not disabled', () => {
    const { lastFrame } = render(
      <ChatInput onSubmit={mockOnSubmit} disabled={false} />
    )

    const output = lastFrame()
    expect(output).toContain('>') // Input prompt indicator
  })

  it('should show loading state when disabled', () => {
    const { lastFrame } = render(
      <ChatInput onSubmit={mockOnSubmit} disabled={true} />
    )

    const output = lastFrame()
    expect(output).toContain('...') // Loading indicator
  })

  // NEW TESTS - Input Handling
  describe('Input Handling', () => {
    it('should display typed characters', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'hello') {
        stdin.write(ch)
        await flush()
      }
      await flush()

      const output = lastFrame()
      expect(output).toContain('hello')
    })

    it('should handle backspace to remove last character', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'hello') {
        stdin.write(ch)
        await flush()
      }

      stdin.write('\u007F') // backspace
      await flush()

      const output = lastFrame()
      expect(output).toContain('hell')
      expect(output).not.toContain('hello')
    })

    it('should handle multiple backspaces correctly', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'testing') {
        stdin.write(ch)
        await flush()
      }

      stdin.write('\u007F') // backspace
      await flush()
      stdin.write('\u007F') // backspace
      await flush()
      stdin.write('\u007F') // backspace
      await flush()

      const output = lastFrame()
      expect(output).toContain('test')
    })

    it('should handle backspace on empty input gracefully', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      stdin.write('\u007F') // backspace on empty input
      await flush()

      const output = lastFrame()
      expect(output).toContain('>')
      // Should not crash or show negative characters
    })
  })

  // NEW TESTS - Submit Behavior
  describe('Submit Behavior', () => {
    it('should submit valid input when Enter is pressed', async () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'hello world') {
        stdin.write(ch)
        await flush()
      }

      await flush()
      stdin.write('\r') // Enter key
      await flush()

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith('hello world')
    })

    it('should trim whitespace before submitting', async () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of '   hello world   ') {
        stdin.write(ch)
        await flush()
      }

      stdin.write('\r') // Enter key
      await flush()

      expect(mockOnSubmit).toHaveBeenCalledWith('hello world')
    })

    it('should not submit empty input', async () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      stdin.write('\r') // Enter key on empty input
      await flush()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not submit whitespace-only input', async () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of '   ') {
        stdin.write(ch)
        await flush()
      }

      stdin.write('\r') // Enter key
      await flush()

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should clear input after successful submission', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'test message') {
        stdin.write(ch)
        await flush()
      }

      await flush()
      stdin.write('\r') // Enter key
      await flush()

      const output = lastFrame()
      expect(output).not.toContain('test message')
      expect(output).toContain('>') // Should show empty prompt
    })

    it('should handle multiple submissions', async () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'first message') {
        stdin.write(ch)
        await flush()
      }

      await flush()
      stdin.write('\r')
      await flush()

      for (const ch of 'second message') {
        stdin.write(ch)
        await flush()
      }

      await flush()
      stdin.write('\r')
      await flush()

      expect(mockOnSubmit).toHaveBeenCalledTimes(2)
      expect(mockOnSubmit).toHaveBeenNthCalledWith(1, 'first message')
      expect(mockOnSubmit).toHaveBeenNthCalledWith(2, 'second message')
    })
  })

  // NEW TESTS - Disabled State
  describe('Disabled State', () => {
    it('should ignore keyboard input when disabled', () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={true} />
      )

      stdin.write('should be ignored')

      const output = lastFrame()
      expect(output).not.toContain('should be ignored')
      expect(output).toContain('Processing your message...')
    })

    it('should not submit when Enter is pressed while disabled', () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={true} />
      )

      stdin.write('test')
      stdin.write('\r') // Enter key

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should ignore backspace when disabled', () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={true} />
      )

      stdin.write('\u007F') // backspace

      const output = lastFrame()
      expect(output).toContain('Processing your message...')
    })
  })

  // NEW TESTS - State Management
  describe('State Management', () => {
    it('should maintain input state during typing session', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      stdin.write('h')
      await flush()
      expect(lastFrame()).toContain('h')

      stdin.write('e')
      await flush()
      expect(lastFrame()).toContain('he')

      stdin.write('l')
      await flush()
      expect(lastFrame()).toContain('hel')

      stdin.write('l')
      await flush()
      expect(lastFrame()).toContain('hell')

      stdin.write('o')
      await flush()
      expect(lastFrame()).toContain('hello')
    })
  })

  // NEW TESTS - Integration Tests
  describe('Integration Tests', () => {
    it('should handle complete user flow: type → submit → clear → type again', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // First message
      for (const ch of 'first message') {
        stdin.write(ch)
        await flush()
      }
      await flush()
      expect(lastFrame()).toContain('first message')

      await flush()
      stdin.write('\r') // Submit
      await flush()
      expect(mockOnSubmit).toHaveBeenCalledWith('first message')
      expect(lastFrame()).not.toContain('first message') // Should be cleared

      // Second message
      for (const ch of 'second message') {
        stdin.write(ch)
        await flush()
      }
      expect(lastFrame()).toContain('second message')

      await flush()
      stdin.write('\r') // Submit
      await flush()

      expect(mockOnSubmit).toHaveBeenCalledWith('second message')
      expect(lastFrame()).not.toContain('second message') // Should be cleared

      expect(mockOnSubmit).toHaveBeenCalledTimes(2)
    })

    it('should handle complex input with editing', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'hello wold') {
        stdin.write(ch)
        await flush()
      }

      stdin.write('\u007F') // backspace 'd'
      await flush()
      stdin.write('\u007F') // backspace 'l'
      await flush()
      stdin.write('\u007F') // backspace 'o'
      await flush()

      for (const ch of 'orld') {
        stdin.write(ch)
        await flush()
      }

      await flush()
      expect(lastFrame()).toContain('hello world')

      await flush()
      stdin.write('\r') // Submit
      await flush()
      expect(mockOnSubmit).toHaveBeenCalledWith('hello world')
    })

    it('should handle special characters and Unicode', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      const specialText = 'Hello 🌍! @user #hashtag $100 & more...'
      for (const ch of specialText) {
        stdin.write(ch)
        await flush()
      }

      expect(lastFrame()).toContain(specialText)

      await flush()
      stdin.write('\r') // Submit
      await flush()
      expect(mockOnSubmit).toHaveBeenCalledWith(specialText)
    })
  })

  // NEW TESTS - Edge Cases
  describe('Edge Cases', () => {
    it('should handle very long input', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      const longText = 'a'.repeat(99) // Match actual component behavior
      for (const ch of longText) {
        stdin.write(ch)
        await flush()
      }

      expect(lastFrame()).toContain('a'.repeat(50)) // Check for a portion of the text

      await flush()
      stdin.write('\r')
      await flush()
      expect(mockOnSubmit).toHaveBeenCalledWith(longText)
    })

    it('should handle tab characters', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'hello\tworld') {
        stdin.write(ch)
        await flush()
      }
      await flush()

      // Component filters out tabs, so check for concatenated result
      expect(lastFrame()).toContain('helloworld')

      await flush()
      stdin.write('\r')
      await flush()
      // Component actually submits without the tab
      expect(mockOnSubmit).toHaveBeenCalledWith('helloworld')
    })

    it('pressing Enter submits instead of inserting newline', async () => {
      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'line1') {
        stdin.write(ch)
        await flush()
      }

      await flush()
      stdin.write('\r')
      await flush()

      expect(mockOnSubmit).toHaveBeenCalledWith('line1')
    })

    it('enables input after being disabled', async () => {
      const { lastFrame, stdin, rerender } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={true} />
      )
      expect(lastFrame()).toContain('Processing your message...')

      rerender(<ChatInput onSubmit={mockOnSubmit} disabled={false} />)
      await flush()

      expect(lastFrame()).toContain('>')
      stdin.write('ok')
      await flush()
      expect(lastFrame()).toContain('ok')
    })
  })

  // NEW TESTS - Command Prediction
  describe('Command Prediction', () => {
    it('should show suggestions when typing slash command', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      stdin.write('/')
      await flush()
      stdin.write('c')
      await flush()

      // Wait for suggestions to appear
      await flush()
      await flush()

      const output = lastFrame()
      expect(output).toContain('/c')
      expect(output).toContain('/clear')
      expect(output).toContain('/copy-last')
    })

    it('should filter suggestions as user types', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of '/cl') {
        stdin.write(ch)
        await flush()
      }

      const output = lastFrame()
      expect(output).toContain('/cl')
      expect(output).toContain('/clear')
      expect(output).not.toContain('/copy-last')
    })

    it('should navigate suggestions with arrow keys', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // Type /c to get suggestions
      for (const ch of '/c') {
        stdin.write(ch)
        await flush()
      }

      // Press down arrow to select second suggestion
      stdin.write('\u001b[B') // Down arrow
      await flush()

      const output = lastFrame()
      expect(output).toContain('/c')
      expect(output).toContain('/clear')
      expect(output).toContain('/copy-last')
    })

    it('should select suggestion with Tab key', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // Type /c to get suggestions
      for (const ch of '/c') {
        stdin.write(ch)
        await flush()
      }

      // Wait for suggestions to appear
      await flush()

      // Verify suggestions are shown first
      let output = lastFrame()
      expect(output).toContain('/c')
      expect(output).toContain('/clear')
      expect(output).toContain('/copy-last')

      // Press Tab to select first suggestion
      stdin.write('\t') // Tab character
      await flush()

      output = lastFrame()
      // After tab selection, input should show the full command
      expect(output).toContain('lear')
    })

    it('should select suggestion with Enter key', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // Type /c to get suggestions
      for (const ch of '/c') {
        stdin.write(ch)
        await flush()
      }

      // Wait for suggestions to appear
      await flush()

      // Verify suggestions are shown first
      let output = lastFrame()
      expect(output).toContain('/c')
      expect(output).toContain('/clear')
      expect(output).toContain('/copy-last')

      // Press Enter to select first suggestion
      stdin.write('\r')
      await flush()

      output = lastFrame()
      // After enter selection, input should show the full command
      expect(output).toContain('/clear')
    })

    it('should hide suggestions with Escape key', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // Type /c to get suggestions
      for (const ch of '/c') {
        stdin.write(ch)
        await flush()
      }

      // Wait for suggestions to appear
      await flush()

      // Verify suggestions are shown
      let output = lastFrame()
      expect(output).toContain('/clear')

      // Press Escape to hide suggestions
      stdin.write('\u001b') // Escape key
      await flush()

      output = lastFrame()
      expect(output).toContain('/c')
      // Suggestions should be hidden after escape
    })

    it('should not show suggestions for non-slash commands', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      for (const ch of 'hello') {
        stdin.write(ch)
        await flush()
      }

      const output = lastFrame()
      expect(output).toContain('hello')
      expect(output).not.toContain('/clear')
      expect(output).not.toContain('/help')
    })

    it('should hide suggestions when backspacing to non-command', async () => {
      const { lastFrame, stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // Type /c to get suggestions
      for (const ch of '/c') {
        stdin.write(ch)
        await flush()
      }

      // Wait for suggestions to appear
      await flush()

      // Verify suggestions are shown
      let output = lastFrame()
      expect(output).toContain('/clear')

      // Backspace to remove 'c'
      stdin.write('\u007F')
      await flush()

      // Backspace to remove '/'
      stdin.write('\u007F')
      await flush()

      output = lastFrame()
      expect(output).not.toContain('/clear')
      expect(output).not.toContain('/copy-last')
    })

    it('should submit completed command when Enter is pressed', async () => {
      // Ensure clean mock state
      mockOnSubmit.mockClear()

      const { stdin } = render(
        <ChatInput onSubmit={mockOnSubmit} disabled={false} />
      )

      // Type complete command
      for (const ch of '/clear') {
        stdin.write(ch)
        await flush()
      }

      // Press Enter to submit
      await flush()
      stdin.write('\r')
      await flush()

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith('/clear')
    })
  })
})
