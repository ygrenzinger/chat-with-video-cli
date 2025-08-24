import { describe, it, expect, afterEach } from 'vitest'
import { validateEnvironment } from './env.js'

describe('Environment validation', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.MISTRAL_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  })

  it('should pass validation when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key'

    expect(() => validateEnvironment()).not.toThrow()
  })

  it('should pass validation when MISTRAL_API_KEY is set', () => {
    process.env.MISTRAL_API_KEY = 'test-api-key'

    expect(() => validateEnvironment()).not.toThrow()
  })

  it('should pass validation when OPENAI_API_KEY is set', () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    expect(() => validateEnvironment()).not.toThrow()
  })

  it('should pass validation when GOOGLE_GENERATIVE_AI_API_KEY is set', () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key'

    expect(() => validateEnvironment()).not.toThrow()
  })

  it('should throw error when no API keys are set', () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.MISTRAL_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY

    expect(() => validateEnvironment()).toThrow(
      'At least one AI provider API key is required. Please set one of: MISTRAL_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY'
    )
  })

  it('should throw error when API keys are empty strings', () => {
    process.env.ANTHROPIC_API_KEY = ''
    process.env.MISTRAL_API_KEY = '  '
    process.env.OPENAI_API_KEY = ''
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = ''

    expect(() => validateEnvironment()).toThrow(
      'At least one AI provider API key is required. Please set one of: MISTRAL_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY'
    )
  })

  it('should pass validation when multiple API keys are set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    process.env.MISTRAL_API_KEY = 'test-mistral-key'

    expect(() => validateEnvironment()).not.toThrow()
  })
})
