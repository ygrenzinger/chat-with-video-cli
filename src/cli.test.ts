import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateEnvironment } from './utils/env.js'
import { start } from './cli.js'

// Mock the validateEnvironment function
vi.mock('./utils/env.js', () => ({
  validateEnvironment: vi.fn()
}))

// Mock commander to prevent CLI from executing
vi.mock('commander', () => ({
  Command: vi.fn().mockImplementation(() => ({
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    argument: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    help: vi.fn(),
    parse: vi.fn()
  }))
}))

describe('Enhanced CLI with environment validation', () => {
  const originalEnv = process.env
  const originalArgv = process.argv

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.argv = ['node', 'cli.js', 'https://youtube.com/watch?v=test']
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called')
    })
  })

  afterEach(() => {
    process.env = originalEnv
    process.argv = originalArgv
    vi.restoreAllMocks()
  })

  it('should validate environment on startup', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'

    // Import the CLI module after setting up mocks
    start()

    expect(vi.mocked(validateEnvironment)).toHaveBeenCalled()
  })

  it('should exit gracefully when environment validation fails', () => {
    vi.mocked(validateEnvironment).mockImplementation(() => {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    })

    expect(() => {
      start()
    }).toThrow()
  })
})
