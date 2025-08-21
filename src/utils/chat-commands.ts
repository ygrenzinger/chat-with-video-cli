const VALID_COMMANDS = ['/exit', '/help', '/transcript', '/clear']

export type ChatCommand =
    | { type: 'exit' }
    | { type: 'help' }
    | { type: 'transcript' }
    | { type: 'clear' }

export const isCommand = (input: string): boolean => {
  return VALID_COMMANDS.includes(input)
}

export const parseCommand = (input: string): ChatCommand | null => {
  if (!isCommand(input)) {
    return null
  }

  switch (input) {
    case '/exit':
      return { type: 'exit' }
    case '/help':
      return { type: 'help' }
    case '/transcript':
      return { type: 'transcript' }
    case '/clear':
      return { type: 'clear' }
    default:
      return null
  }
}

export const getHelpText = (): string => {
  return `Available commands:
  /help        - Show this help message
  /exit        - Exit the chat and close the application
  /transcript  - Show the full video transcript
  /clear       - Clear the message history

You can also ask questions about the video content directly.`
}
