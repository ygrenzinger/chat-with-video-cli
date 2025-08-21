import { describe, it, expect } from 'vitest'
import { parseCommand, isCommand } from './chat-commands.js'

describe('Chat Commands', () => {
  describe('isCommand', () => {
    it('should identify valid commands', () => {
      expect(isCommand('/exit')).toBe(true)
      expect(isCommand('/help')).toBe(true)
      expect(isCommand('/transcript')).toBe(true)
      expect(isCommand('/clear')).toBe(true)
    })

    it('should not identify invalid commands', () => {
      expect(isCommand('exit')).toBe(false)
      expect(isCommand('help me')).toBe(false)
      expect(isCommand('/invalid')).toBe(false)
      expect(isCommand('/EXIT')).toBe(false) // case sensitive
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

    it('should return null for invalid commands', () => {
      expect(parseCommand('invalid')).toBeNull()
      expect(parseCommand('/invalid')).toBeNull()
    })
  })
})
