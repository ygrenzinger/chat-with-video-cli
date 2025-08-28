import { streamText } from 'ai'
import {
  ModelSelectionService,
  type ModelConfiguration
} from './model-selection.service.js'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  streamingComplete?: boolean
}

export class ChatService {
  private readonly transcript: string
  private readonly modelConfig: ModelConfiguration
  private readonly messages: ChatMessage[] = []

  constructor(transcript: string, modelConfig?: ModelConfiguration) {
    this.transcript = transcript
    this.modelConfig = modelConfig || ModelSelectionService.selectModel()
  }

  getSystemPrompt(): string {
    return `
You are a helpful AI that will help the user get detailed information about the transcript of this video <transcript>${this.transcript}</transcript>
Mandatory rules: all the answers must be in markdown format.

Try to answer the user's questions in a way that is relevant to the transcript.
If the user asks questions which are not related to the transcript, please inform the user this is not relative to the content of the video and propose him to extent the search outside the transcript.
If the user says yes, you can answer without focusing on the content of the transcript.
`
  }

  getMessages(): ChatMessage[] {
    return this.messages
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
      model: this.modelConfig.model,
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
