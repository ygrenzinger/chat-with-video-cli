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
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = useMemo(() => {
    return getCommandSuggestions(input)
  }, [input])

  // Utility functions for cursor management
  const clampCursor = (position: number, textLength: number) => {
    return Math.max(0, Math.min(position, textLength))
  }

  const findWordBoundary = (text: string, position: number, direction: 'left' | 'right') => {
    if (direction === 'left') {
      let pos = position - 1
      // Skip whitespace to the left
      while (pos >= 0 && /\s/.test(text[pos])) {
        pos--
      }
      // Skip non-whitespace to find word boundary
      while (pos >= 0 && !/\s/.test(text[pos])) {
        pos--
      }
      return pos + 1
    } else {
      let pos = position
      // Skip non-whitespace to the right
      while (pos < text.length && !/\s/.test(text[pos])) {
        pos++
      }
      // Skip whitespace to find next word
      while (pos < text.length && /\s/.test(text[pos])) {
        pos++
      }
      return pos
    }
  }

  // Keep cursor position in bounds when input changes
  React.useEffect(() => {
    setCursorPosition(prev => clampCursor(prev, input.length))
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

    // Handle cursor movement keys first
    if (key.leftArrow) {
      if (key.ctrl) {
        // Ctrl+Left: Move to previous word
        const newPosition = findWordBoundary(input, cursorPosition, 'left')
        setCursorPosition(newPosition)
      } else if (showSuggestions && cursorPosition === input.length && suggestions.length > 0 && input.startsWith('/') && !suggestions.some(s => s.command === input)) {
        // Left arrow in suggestions - don't move cursor, let suggestions handle it
        return
      } else {
        // Left arrow: Move cursor left
        setCursorPosition(prev => Math.max(0, prev - 1))
      }
      return
    }

    if (key.rightArrow) {
      if (key.ctrl) {
        // Ctrl+Right: Move to next word
        const newPosition = findWordBoundary(input, cursorPosition, 'right')
        setCursorPosition(newPosition)
      } else if (showSuggestions && cursorPosition === input.length && suggestions.length > 0 && input.startsWith('/') && !suggestions.some(s => s.command === input)) {
        // Right arrow in suggestions - don't move cursor, let suggestions handle it
        return
      } else {
        // Right arrow: Move cursor right
        setCursorPosition(prev => Math.min(input.length, prev + 1))
      }
      return
    }

    // Handle suggestion navigation (only when cursor is at end and suggestions are active)
    if (showSuggestions && cursorPosition === input.length && suggestions.length > 0 && input.startsWith('/') && !suggestions.some(s => s.command === input)) {
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
        const selectedCommand = suggestions[selectedSuggestionIndex]?.command
        if (selectedCommand) {
          setInput(selectedCommand)
          setCursorPosition(selectedCommand.length)
          setSelectedSuggestionIndex(0)
        }
        return
      }
      
      if (key.escape) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(0)
        return
      }
    }

    // Handle Enter key
    if (key.return) {
      // If we have partial command with suggestions, use the selected command
      if (showSuggestions && cursorPosition === input.length && suggestions.length > 0 && input.startsWith('/') && input.length > 1 && 
          !suggestions.some(s => s.command === input)) {
        const selectedCommand = suggestions[selectedSuggestionIndex]?.command
        if (selectedCommand) {
          setInput(selectedCommand)
          setCursorPosition(selectedCommand.length)
          setSelectedSuggestionIndex(0)
          return
        }
      }
      
      if (input.trim()) {
        onSubmit(input.trim())
        setInput('')
        setCursorPosition(0)
        setSelectedSuggestionIndex(0)
      }
      return
    }

    // Handle backspace and delete
    if (key.backspace) {
      if (cursorPosition > 0) {
        setInput(prev => prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition))
        setCursorPosition(prev => prev - 1)
        setSelectedSuggestionIndex(0)
      }
      return
    }

    if (key.delete) {
      if (cursorPosition < input.length) {
        setInput(prev => prev.slice(0, cursorPosition) + prev.slice(cursorPosition + 1))
        setSelectedSuggestionIndex(0)
      }
      return
    }

    // Handle Home/End keys (Ctrl+A/Ctrl+E) 
    if (key.ctrl && inputChar === 'a') {
      setCursorPosition(0)
      return
    }

    if (key.ctrl && inputChar === 'e') {
      setCursorPosition(input.length)
      return
    }

    // Handle character input
    if (inputChar && !key.ctrl) {
      setInput(prev => prev.slice(0, cursorPosition) + inputChar + prev.slice(cursorPosition))
      setCursorPosition(prev => prev + 1)
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

  // Render input with cursor
  const renderInputWithCursor = () => {
    if (input.length === 0) {
      return <Text inverse>_</Text>
    }
    
    const beforeCursor = input.slice(0, cursorPosition)
    const atCursor = input[cursorPosition]
    const afterCursor = input.slice(cursorPosition + 1)
    
    if (cursorPosition >= input.length) {
      // Cursor at end
      return (
        <>
          <Text>{input}</Text>
          <Text inverse>_</Text>
        </>
      )
    }
    
    // Cursor in middle
    return (
      <>
        <Text>{beforeCursor}</Text>
        <Text inverse>{atCursor}</Text>
        <Text>{afterCursor}</Text>
      </>
    )
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{'> '}</Text>
        {renderInputWithCursor()}
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
