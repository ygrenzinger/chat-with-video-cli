export const validateEnvironment = (): void => {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }
}
