import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic'
import { MistralProvider, createMistral } from '@ai-sdk/mistral'
import { OpenAIProvider, createOpenAI } from '@ai-sdk/openai'
import {
  GoogleGenerativeAIProvider,
  createGoogleGenerativeAI
} from '@ai-sdk/google'

export type SupportedProvider = 'mistral' | 'openai' | 'google' | 'anthropic'

export interface ModelConfiguration {
  provider: SupportedProvider
  providerInstance:
    | AnthropicProvider
    | MistralProvider
    | OpenAIProvider
    | GoogleGenerativeAIProvider
  model: any
  modelId: string
}

export interface EnvironmentKeys {
  MISTRAL_API_KEY?: string
  OPENAI_API_KEY?: string
  GOOGLE_GENERATIVE_AI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
}

export class ModelSelectionService {
  private static readonly MODEL_MAPPING = {
    mistral: 'mistral-small-latest',
    openai: 'gpt-4o-nano',
    google: 'gemini-2.5-flash',
    anthropic: 'claude-3-5-haiku-latest'
  } as const

  static detectAvailableProvider(
    env: EnvironmentKeys = process.env as EnvironmentKeys
  ): SupportedProvider | null {
    if (env.MISTRAL_API_KEY?.trim()) return 'mistral'
    if (env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) return 'google'
    if (env.ANTHROPIC_API_KEY?.trim()) return 'anthropic'
    if (env.OPENAI_API_KEY?.trim()) return 'openai'

    return null
  }

  static createModelConfiguration(
    provider: SupportedProvider,
    env: EnvironmentKeys = process.env as EnvironmentKeys
  ): ModelConfiguration {
    const modelId = this.MODEL_MAPPING[provider]

    switch (provider) {
      case 'mistral': {
        const providerInstance = createMistral({
          apiKey: env.MISTRAL_API_KEY
        })
        return {
          provider,
          providerInstance,
          model: providerInstance(modelId),
          modelId
        }
      }

      case 'openai': {
        const providerInstance = createOpenAI({
          apiKey: env.OPENAI_API_KEY
        })
        return {
          provider,
          providerInstance,
          model: providerInstance(modelId),
          modelId
        }
      }

      case 'google': {
        const providerInstance = createGoogleGenerativeAI({
          apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY
        })
        return {
          provider,
          providerInstance,
          model: providerInstance(modelId),
          modelId
        }
      }

      case 'anthropic': {
        const providerInstance = createAnthropic({
          apiKey: env.ANTHROPIC_API_KEY
        })
        return {
          provider,
          providerInstance,
          model: providerInstance(modelId),
          modelId
        }
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  static selectModel(
    env: EnvironmentKeys = process.env as EnvironmentKeys
  ): ModelConfiguration {
    const availableProvider = this.detectAvailableProvider(env)

    if (!availableProvider) {
      throw new Error(
        'No AI provider API key found. Please set one of: MISTRAL_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY'
      )
    }

    return this.createModelConfiguration(availableProvider, env)
  }

  static getProviderPriority(): readonly SupportedProvider[] {
    return ['mistral', 'openai', 'google', 'anthropic'] as const
  }

  static getSupportedModels(): Record<SupportedProvider, string> {
    return { ...this.MODEL_MAPPING }
  }
}
