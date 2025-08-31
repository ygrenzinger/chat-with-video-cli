import { describe, it, expect } from 'vitest'
import { parseCommand, isCommand, getCommandSuggestions, isUnknownCommand } from './chat-commands.js'

describe('Chat Commands', () => {
  describe('isCommand', () => {
    it('should identify valid commands', () => {
      expect(isCommand('/exit')).toBe(true)
      expect(isCommand('/help')).toBe(true)
      expect(isCommand('/transcript')).toBe(true)
      expect(isCommand('/clear')).toBe(true)
      expect(isCommand('/copy-last')).toBe(true)
      expect(isCommand('/copy-all')).toBe(true)
      expect(isCommand('/save-to-file')).toBe(true)
      expect(isCommand('/summary')).toBe(true)
    })

    it('should not identify invalid commands', () => {
      expect(isCommand('exit')).toBe(false)
      expect(isCommand('help me')).toBe(false)
      expect(isCommand('/invalid')).toBe(false)
      expect(isCommand('/EXIT')).toBe(false) // case sensitive
    })
  })

  describe('isUnknownCommand', () => {
    it('should identify unknown commands starting with /', () => {
      expect(isUnknownCommand('/unknown')).toBe(true)
      expect(isUnknownCommand('/test')).toBe(true)
      expect(isUnknownCommand('/xyz')).toBe(true)
      expect(isUnknownCommand('/123')).toBe(true)
    })

    it('should not identify valid commands as unknown', () => {
      expect(isUnknownCommand('/exit')).toBe(false)
      expect(isUnknownCommand('/help')).toBe(false)
      expect(isUnknownCommand('/transcript')).toBe(false)
      expect(isUnknownCommand('/clear')).toBe(false)
      expect(isUnknownCommand('/copy-last')).toBe(false)
      expect(isUnknownCommand('/copy-all')).toBe(false)
      expect(isUnknownCommand('/save-to-file')).toBe(false)
      expect(isUnknownCommand('/summary')).toBe(false)
    })

    it('should not identify regular text as unknown command', () => {
      expect(isUnknownCommand('hello')).toBe(false)
      expect(isUnknownCommand('test message')).toBe(false)
      expect(isUnknownCommand('')).toBe(false)
    })
  })

  describe('parseCommand', () => {
    it('should parse exit command', () => {
      const result = parseCommand('/exit')
      expect(result).toEqual({ type: 'exit' })
    })

    it('should parse help command', () => {
      const result = parseCommand('/help')
      expect(result).toEqual({ type: 'help' })
    })

    it('should parse transcript command', () => {
      const result = parseCommand('/transcript')
      expect(result).toEqual({ type: 'transcript' })
    })

    it('should parse clear command', () => {
      const result = parseCommand('/clear')
      expect(result).toEqual({ type: 'clear' })
    })

    it('should parse copy-last command', () => {
      const result = parseCommand('/copy-last')
      expect(result).toEqual({ type: 'copy-last' })
    })

    it('should parse copy-all command', () => {
      const result = parseCommand('/copy-all')
      expect(result).toEqual({ type: 'copy-all' })
    })

    it('should parse save-to-file command', () => {
      const result = parseCommand('/save-to-file')
      expect(result).toEqual({ type: 'save-to-file' })
    })

    it('should parse summary command', () => {
      const result = parseCommand('/summary')
      expect(result).toEqual({ type: 'summary' })
    })

    it('should parse unknown commands starting with /', () => {
      expect(parseCommand('/unknown')).toEqual({ type: 'unknown', command: '/unknown' })
      expect(parseCommand('/test')).toEqual({ type: 'unknown', command: '/test' })
      expect(parseCommand('/xyz')).toEqual({ type: 'unknown', command: '/xyz' })
    })

    it('should return null for regular text', () => {
      expect(parseCommand('invalid')).toBeNull()
      expect(parseCommand('hello world')).toBeNull()
      expect(parseCommand('')).toBeNull()
    })
  })

  describe('getCommandSuggestions', () => {
    it('should return empty array for non-slash input', () => {
      expect(getCommandSuggestions('help')).toEqual([])
      expect(getCommandSuggestions('test')).toEqual([])
      expect(getCommandSuggestions('')).toEqual([])
    })

    it('should return empty array for single slash', () => {
      expect(getCommandSuggestions('/')).toEqual([])
    })

    it('should return matching commands for partial input', () => {
      const suggestions = getCommandSuggestions('/c')
      expect(suggestions).toHaveLength(3)
      expect(suggestions[0].command).toBe('/clear')
      expect(suggestions[0].description).toBe('Clear the message history')
      expect(suggestions[1].command).toBe('/copy-last')
      expect(suggestions[1].description).toBe('Copy the last assistant message to clipboard')
      expect(suggestions[2].command).toBe('/copy-all')
      expect(suggestions[2].description).toBe('Copy the full chat history to clipboard')
    })

    it('should return single match for more specific input', () => {
      const suggestions = getCommandSuggestions('/cl')
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].command).toBe('/clear')
      expect(suggestions[0].description).toBe('Clear the message history')
    })

    it('should return single match for transcript', () => {
      const suggestions = getCommandSuggestions('/t')
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].command).toBe('/transcript')
      expect(suggestions[0].description).toBe('Show the full video transcript')
    })

    it('should return single match for help', () => {
      const suggestions = getCommandSuggestions('/h')
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].command).toBe('/help')
      expect(suggestions[0].description).toBe('Show this help message')
    })

    it('should return single match for exit', () => {
      const suggestions = getCommandSuggestions('/e')
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].command).toBe('/exit')
      expect(suggestions[0].description).toBe('Exit the chat and close the application')
    })

    it('should return matches for /s', () => {
      const suggestions = getCommandSuggestions('/s')
      expect(suggestions).toHaveLength(2)
      expect(suggestions[0].command).toBe('/save-to-file')
      expect(suggestions[1].command).toBe('/summary')
    })

    it('should return empty array for no matches', () => {
      expect(getCommandSuggestions('/z')).toEqual([])
      expect(getCommandSuggestions('/xyz')).toEqual([])
    })

    it('should be case insensitive', () => {
      const lowerSuggestions = getCommandSuggestions('/c')
      const upperSuggestions = getCommandSuggestions('/C')
      expect(lowerSuggestions).toEqual(upperSuggestions)
    })

    it('should return exact match for complete command', () => {
      const suggestions = getCommandSuggestions('/clear')
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].command).toBe('/clear')
    })
  })
})
