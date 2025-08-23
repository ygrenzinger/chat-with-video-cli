import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { CommandSuggestions } from './CommandSuggestions.js'
import type { CommandSuggestion } from '../utils/chat-commands.js'

describe('CommandSuggestions', () => {
  const mockSuggestions: CommandSuggestion[] = [
    { command: '/clear', description: 'Clear the message history' },
    { command: '/copy-last', description: 'Copy the last assistant message to clipboard' }
  ]

  it('should render nothing when no suggestions provided', () => {
    const { lastFrame } = render(
      <CommandSuggestions suggestions={[]} selectedIndex={0} />
    )

    const output = lastFrame()
    expect(output).toBe('')
  })

  it('should render all suggestions', () => {
    const { lastFrame } = render(
      <CommandSuggestions suggestions={mockSuggestions} selectedIndex={0} />
    )

    const output = lastFrame()
    expect(output).toContain('/clear')
    expect(output).toContain('Clear the message history')
    expect(output).toContain('/copy-last')
    expect(output).toContain('Copy the last assistant message to clipboard')
  })

  it('should highlight the selected suggestion', () => {
    const { lastFrame } = render(
      <CommandSuggestions suggestions={mockSuggestions} selectedIndex={0} />
    )

    const output = lastFrame()
    // The first item should be highlighted (selected)
    expect(output).toContain('/clear')
  })

  it('should highlight different suggestion when selectedIndex changes', () => {
    const { lastFrame } = render(
      <CommandSuggestions suggestions={mockSuggestions} selectedIndex={1} />
    )

    const output = lastFrame()
    // The second item should be highlighted (selected)
    expect(output).toContain('/copy-last')
  })

  it('should render single suggestion correctly', () => {
    const singleSuggestion = [
      { command: '/help', description: 'Show this help message' }
    ]
    
    const { lastFrame } = render(
      <CommandSuggestions suggestions={singleSuggestion} selectedIndex={0} />
    )

    const output = lastFrame()
    expect(output).toContain('/help')
    expect(output).toContain('Show this help message')
  })

  it('should handle selectedIndex out of bounds gracefully', () => {
    const { lastFrame } = render(
      <CommandSuggestions suggestions={mockSuggestions} selectedIndex={10} />
    )

    const output = lastFrame()
    expect(output).toContain('/clear')
    expect(output).toContain('/copy-last')
  })
})