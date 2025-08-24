import { describe, it, expect, beforeEach } from 'vitest'
import {
  ModelSelectionService,
  type EnvironmentKeys
} from './model-selection.service.js'

describe('ModelSelectionService', () => {
  let mockEnv: EnvironmentKeys

  beforeEach(() => {
    mockEnv = {}
  })

  describe('detectAvailableProvider', () => {
    it('should return mistral when MISTRAL_API_KEY is set', () => {
      mockEnv.MISTRAL_API_KEY = 'test-mistral-key'
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBe('mistral')
    })

    it('should return openai when OPENAI_API_KEY is set and no mistral key', () => {
      mockEnv.OPENAI_API_KEY = 'test-openai-key'
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBe('openai')
    })

    it('should return google when GOOGLE_GENERATIVE_AI_API_KEY is set and no higher priority keys', () => {
      mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBe('google')
    })

    it('should return anthropic when ANTHROPIC_API_KEY is set and no higher priority keys', () => {
      mockEnv.ANTHROPIC_API_KEY = 'test-anthropic-key'
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBe('anthropic')
    })

    it('should return null when no API keys are set', () => {
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBeNull()
    })

    it('should return null when API keys are empty strings', () => {
      mockEnv.MISTRAL_API_KEY = ''
      mockEnv.OPENAI_API_KEY = '  '
      mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = ''
      mockEnv.ANTHROPIC_API_KEY = ''
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBeNull()
    })

    it('should respect priority order when multiple keys are set', () => {
      mockEnv.ANTHROPIC_API_KEY = 'test-anthropic-key'
      mockEnv.OPENAI_API_KEY = 'test-openai-key'
      mockEnv.MISTRAL_API_KEY = 'test-mistral-key'
      const provider = ModelSelectionService.detectAvailableProvider(mockEnv)
      expect(provider).toBe('mistral')
    })
  })

  describe('createModelConfiguration', () => {
    it('should create mistral configuration', () => {
      mockEnv.MISTRAL_API_KEY = 'test-mistral-key'
      const config = ModelSelectionService.createModelConfiguration(
        'mistral',
        mockEnv
      )

      expect(config.provider).toBe('mistral')
      expect(config.modelId).toBe('mistral-small-latest')
      expect(config.providerInstance).toBeDefined()
      expect(config.model).toBeDefined()
    })

    it('should create openai configuration', () => {
      mockEnv.OPENAI_API_KEY = 'test-openai-key'
      const config = ModelSelectionService.createModelConfiguration(
        'openai',
        mockEnv
      )

      expect(config.provider).toBe('openai')
      expect(config.modelId).toBe('gpt-4o-nano')
      expect(config.providerInstance).toBeDefined()
      expect(config.model).toBeDefined()
    })

    it('should create google configuration', () => {
      mockEnv.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
      const config = ModelSelectionService.createModelConfiguration(
        'google',
        mockEnv
      )

      expect(config.provider).toBe('google')
      expect(config.modelId).toBe('gemini-2.5-flash')
      expect(config.providerInstance).toBeDefined()
      expect(config.model).toBeDefined()
    })

    it('should create anthropic configuration', () => {
      mockEnv.ANTHROPIC_API_KEY = 'test-anthropic-key'
      const config = ModelSelectionService.createModelConfiguration(
        'anthropic',
        mockEnv
      )

      expect(config.provider).toBe('anthropic')
      expect(config.modelId).toBe('claude-3-5-haiku-latest')
      expect(config.providerInstance).toBeDefined()
      expect(config.model).toBeDefined()
    })

    it('should throw error for unsupported provider', () => {
      // @ts-expect-error Testing invalid provider
      expect(() =>
        ModelSelectionService.createModelConfiguration('invalid', mockEnv)
      ).toThrow('Unsupported provider: invalid')
    })
  })

  describe('selectModel', () => {
    it('should return model configuration for available provider', () => {
      mockEnv.ANTHROPIC_API_KEY = 'test-anthropic-key'
      const config = ModelSelectionService.selectModel(mockEnv)

      expect(config.provider).toBe('anthropic')
      expect(config.modelId).toBe('claude-3-5-haiku-latest')
    })

    it('should throw error when no API keys are available', () => {
      expect(() => ModelSelectionService.selectModel(mockEnv)).toThrow(
        'No AI provider API key found. Please set one of: MISTRAL_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY'
      )
    })

    it('should select highest priority provider when multiple are available', () => {
      mockEnv.ANTHROPIC_API_KEY = 'test-anthropic-key'
      mockEnv.MISTRAL_API_KEY = 'test-mistral-key'

      const config = ModelSelectionService.selectModel(mockEnv)
      expect(config.provider).toBe('mistral')
    })
  })

  describe('utility methods', () => {
    it('should return correct provider priority order', () => {
      const priority = ModelSelectionService.getProviderPriority()
      expect(priority).toEqual(['mistral', 'openai', 'google', 'anthropic'])
    })

    it('should return supported models mapping', () => {
      const models = ModelSelectionService.getSupportedModels()
      expect(models).toEqual({
        mistral: 'mistral-small-latest',
        openai: 'gpt-4o-nano',
        google: 'gemini-2.5-flash',
        anthropic: 'claude-3-5-haiku-latest'
      })
    })
  })
})
