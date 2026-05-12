import React from 'react'
import { Text } from 'ink'
import { render as renderMarkdown } from 'markdansi'

const URL_GREEN = '\u001B[38;2;34;197;94m'
const RESET_FOREGROUND = '\u001B[39m'
const URL_REGEX = /https?:\/\/[^\s)\]]+/g

type MarkdownTextProps = {
  children: string
  width?: number
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  width = process.stdout.columns ?? 80
}) => {
  const rendered = renderMarkdown(children, {
    width: Math.max(width - 4, 40),
    wrap: true,
    hyperlinks: false,
    codeBox: true,
    tableBorder: 'unicode'
  })

  return <Text>{colorizeUrls(rendered)}</Text>
}

function colorizeUrls(text: string): string {
  return text.replace(URL_REGEX, url => `${URL_GREEN}${url}${RESET_FOREGROUND}`)
}
