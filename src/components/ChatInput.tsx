import React, { useState, useMemo } from 'react'
import { Text, Box, useInput } from 'ink'
import TextInput from 'ink-text-input'
import Spinner from 'ink-spinner'
import { CommandSuggestions } from './CommandSuggestions.js'
import { getCommandSuggestions } from '../utils/chat-commands.js'
import type { TerminalConstraints } from '../hooks/useTerminalConstraints.js'

type ChatInputProps = {
  onSubmit: (message: string) => void
  disabled: boolean
  terminalConstraints: TerminalConstraints
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled, terminalConstraints }) => {
  const [input, setInput] = useState('')
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = useMemo(() => {
    return getCommandSuggestions(input)
  }, [input])

  // Update showSuggestions when suggestions change
  React.useEffect(() => {
    // Only show suggestions if we have partial matches and input is not a complete command
    const shouldShow = suggestions.length > 0 && input.startsWith('/') && input.length > 1 && 
                      !suggestions.some(s => s.command === input)
    setShowSuggestions(shouldShow)
  }, [suggestions, input])

  const handleSubmit = (value: string) => {
    // If we have partial command with suggestions, use the selected command
    if (suggestions.length > 0 && value.startsWith('/') && value.length > 1 && 
        !suggestions.some(s => s.command === value)) {
      const selectedCommand = suggestions[selectedSuggestionIndex]?.command
      if (selectedCommand) {
        setInput(selectedCommand)
        setSelectedSuggestionIndex(0)
        return
      }
    }
    
    if (value.trim()) {
      onSubmit(value.trim())
      setInput('')
      setSelectedSuggestionIndex(0)
    }
  }

  // Handle special key navigation for command suggestions
  useInput((_, key) => {
    if (disabled) return

    // Handle suggestion navigation
    if (suggestions.length > 0 && input.startsWith('/') && !suggestions.some(s => s.command === input)) {
      if (key.upArrow) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        return
      }
      
      if (key.downArrow) {
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        return
      }
      
      if (key.tab) {
        if (suggestions.length > 0) {
          const selectedCommand = suggestions[selectedSuggestionIndex]?.command
          if (selectedCommand) {
            setInput(selectedCommand)
            setSelectedSuggestionIndex(0)
          }
        }
        return
      }
      
      if (key.escape) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(0)
        return
      }
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
    <Box flexDirection="column" width={terminalConstraints.maxChatWidth} height={terminalConstraints.inputAreaHeight}>
      <Box width="100%">
        <Box width={2}>
          <Text color="cyan">{'> '}</Text>
        </Box>
        <Box flexGrow={1}>
          <TextInput
            value={input}
            onChange={(value) => {
              setInput(value)
              setSelectedSuggestionIndex(0)
            }}
            onSubmit={handleSubmit}
            focus={!disabled}
            showCursor={true}
          />
        </Box>
      </Box>
      {showSuggestions && (
        <Box width="100%" overflow="hidden">
          <CommandSuggestions
            suggestions={suggestions}
            selectedIndex={selectedSuggestionIndex}
          />
        </Box>
      )}
    </Box>
  )
}
