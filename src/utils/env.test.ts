import { describe, it, expect, afterEach } from 'vitest'
import { validateEnvironment } from './env.js'

describe('Environment validation', () => {

  afterEach(() => {
      delete process.env.ANTHROPIC_API_KEY
  })

  it('should pass validation when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key'
    
    expect(() => validateEnvironment()).not.toThrow()
  })

  it('should throw error when ANTHROPIC_API_KEY is missing', () => {
    delete process.env.ANTHROPIC_API_KEY
    
    expect(() => validateEnvironment()).toThrow('ANTHROPIC_API_KEY environment variable is required')
  })

  it('should throw error when ANTHROPIC_API_KEY is empty string', () => {
    process.env.ANTHROPIC_API_KEY = ''
    
    expect(() => validateEnvironment()).toThrow('ANTHROPIC_API_KEY environment variable is required')
  })
})
