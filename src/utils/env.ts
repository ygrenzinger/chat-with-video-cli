import { ModelSelectionService } from '../services/model-selection.service.js'

export const validateEnvironment = (): void => {
  const availableProvider = ModelSelectionService.detectAvailableProvider()

  if (!availableProvider) {
    throw new Error(
      'At least one AI provider API key is required. Please set one of: MISTRAL_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY'
    )
  }
}
