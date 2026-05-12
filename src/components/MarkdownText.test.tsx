import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { render as renderMarkdown } from 'markdansi'
import { MarkdownText } from './MarkdownText.js'

vi.mock('markdansi', () => ({
  render: vi.fn(() => 'rendered markdown')
}))

describe('MarkdownText', () => {
  it('does not emit OSC 8 terminal hyperlinks', () => {
    render(
      <MarkdownText>
        {'https://youtube.com/watch?v=abc&t=42'}
      </MarkdownText>
    )

    expect(renderMarkdown).toHaveBeenCalledWith(
      'https://youtube.com/watch?v=abc&t=42',
      expect.objectContaining({
        hyperlinks: false
      })
    )
  })
})
