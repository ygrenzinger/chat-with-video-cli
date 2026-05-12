import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { render as renderMarkdown } from 'markdansi'
import { MarkdownText } from './MarkdownText.js'

vi.mock('markdansi', () => ({
  render: vi.fn(() => 'rendered markdown')
}))

describe('MarkdownText', () => {
  it('colors rendered URLs green', () => {
    vi.mocked(renderMarkdown).mockReturnValueOnce(
      'See https://youtu.be/RjfbvDXpFls?t=946'
    )

    const { lastFrame } = render(<MarkdownText>{'See (15:46)'}</MarkdownText>)

    expect(lastFrame()).toContain(
      'See \u001B[38;2;34;197;94mhttps://youtu.be/RjfbvDXpFls?t=946\u001B[39m'
    )
  })

  it('does not emit OSC 8 terminal hyperlinks', () => {
    render(
      <MarkdownText>{'https://youtube.com/watch?v=abc&t=42'}</MarkdownText>
    )

    expect(renderMarkdown).toHaveBeenCalledWith(
      'https://youtube.com/watch?v=abc&t=42',
      expect.objectContaining({
        hyperlinks: false
      })
    )
  })
})
