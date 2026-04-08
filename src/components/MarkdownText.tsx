import React from 'react'
import { Text } from 'ink'
import { render as renderMarkdown } from 'markdansi'

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
    codeBox: true,
    tableBorder: 'unicode'
  })

  return <Text>{rendered}</Text>
}
