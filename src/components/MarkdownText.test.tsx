import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { render as renderMarkdown } from 'markdansi'
import { MarkdownText } from './MarkdownText.js'

vi.mock('markdansi', () => ({
  render: vi.fn(() => 'rendered markdown')
}))

describe('MarkdownText', () => {
  it('forces terminal hyperlinks for markdown links', () => {
    render(
      <MarkdownText>
        {'[00:00:03](https://youtube.com/watch?v=test&t=3)'}
      </MarkdownText>
    )

    expect(renderMarkdown).toHaveBeenCalledWith(
      '[00:00:03](https://youtube.com/watch?v=test&t=3)',
      expect.objectContaining({
        hyperlinks: true
      })
    )
  })
})
