const VALID_COMMANDS = ['/exit', '/help', '/transcript', '/clear', '/copy-last', '/copy-all']

export type CommandSuggestion = {
  command: string
  description: string
}

export type ChatCommand =
  | { type: 'exit' }
  | { type: 'help' }
  | { type: 'transcript' }
  | { type: 'clear' }
  | { type: 'copy-last' }
  | { type: 'copy-all' }

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
    case '/copy-last':
      return { type: 'copy-last' }
    case '/copy-all':
      return { type: 'copy-all' }
    default:
      return null
  }
}

const COMMAND_DESCRIPTIONS: Record<string, string> = {
  '/help': 'Show this help message',
  '/exit': 'Exit the chat and close the application',
  '/transcript': 'Show the full video transcript',
  '/clear': 'Clear the message history',
  '/copy-last': 'Copy the last assistant message to clipboard',
  '/copy-all': 'Copy the full chat history to clipboard'
}

export const getCommandSuggestions = (input: string): CommandSuggestion[] => {
  if (!input.startsWith('/') || input.length < 2) {
    return []
  }

  const searchTerm = input.toLowerCase()
  return VALID_COMMANDS
    .filter(command => command.toLowerCase().startsWith(searchTerm))
    .map(command => ({
      command,
      description: COMMAND_DESCRIPTIONS[command]
    }))
}

export const getHelpText = (): string => {
  return `Available commands:
  /help        - Show this help message
  /exit        - Exit the chat and close the application
  /transcript  - Show the full video transcript
  /clear       - Clear the message history
  /copy-last   - Copy the last assistant message to clipboard
  /copy-all    - Copy the full chat history to clipboard

You can also ask questions about the video content directly.`
}
