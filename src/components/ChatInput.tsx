import React, { useState, useMemo } from 'react'
import { Text, Box, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { CommandSuggestions } from './CommandSuggestions.js'
import { getCommandSuggestions } from '../utils/chat-commands.js'

type ChatInputProps = {
  onSubmit: (message: string) => void
  disabled: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled }) => {
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

  useInput((inputChar, key) => {
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

    if (key.return) {
      // If we have partial command with suggestions, use the selected command
      if (suggestions.length > 0 && input.startsWith('/') && input.length > 1 && 
          !suggestions.some(s => s.command === input)) {
        const selectedCommand = suggestions[selectedSuggestionIndex]?.command
        if (selectedCommand) {
          setInput(selectedCommand)
          setSelectedSuggestionIndex(0)
          return
        }
      }
      
      if (input.trim()) {
        onSubmit(input.trim())
        setInput('')
        setSelectedSuggestionIndex(0)
      }
      return
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1))
      setSelectedSuggestionIndex(0)
      return
    }

    if (inputChar && !key.ctrl) {
      setInput(prev => prev + inputChar)
      setSelectedSuggestionIndex(0)
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
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{'> '}</Text>
        <Text>{input}</Text>
      </Box>
      {showSuggestions && (
        <CommandSuggestions
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
        />
      )}
    </Box>
  )
}
