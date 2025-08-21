import {AnthropicProvider, createAnthropic} from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    streamingComplete?: boolean;
}

export class ChatService {
  private readonly transcript: string
  private readonly anthropic: AnthropicProvider
  private readonly messages: ChatMessage[] = []

  constructor(transcript: string) {
    this.transcript = transcript
    this.anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  getSystemPrompt(): string {
    return `You are a helpful AI that will help the user get detailed information about the transcript of this video <transcript>${this.transcript}</transcript>
All the answer should be in markdown format.`
  }

  async *sendMessage(message: string): AsyncIterable<string> {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    this.messages.push(userMessage)

    const result = streamText({
      model: this.anthropic('claude-3-5-sonnet-20241022'),
      system: this.getSystemPrompt(),
      messages: this.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    let assistantContent = ''
    for await (const textPart of result.textStream) {
      assistantContent += textPart
      yield textPart
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
      streamingComplete: true
    }

    this.messages.push(assistantMessage)
  }
}
