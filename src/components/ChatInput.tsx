import React, { useState } from 'react'
import { Text, Box, useInput } from 'ink'
import Spinner from 'ink-spinner'

type ChatInputProps = {
  onSubmit: (message: string) => void
  disabled: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled }) => {
  const [input, setInput] = useState('')

  useInput((inputChar, key) => {
    if (disabled) return

    if (key.return) {
      if (input.trim()) {
        onSubmit(input.trim())
        setInput('')
      }
      return
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1))
      return
    }

    if (inputChar && !key.ctrl) {
      setInput(prev => prev + inputChar)
    }
  })

  if (disabled) {
    return (
      <Box>
        <Text color="yellow">
          <Spinner type="dots" /> Processing your message...
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text color="cyan">{'> '}</Text>
      <Text>{input}</Text>
    </Box>
  )
}
