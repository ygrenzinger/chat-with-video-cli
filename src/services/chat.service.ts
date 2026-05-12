import { randomUUID } from 'node:crypto'
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
  private readonly videoUrl: string
  private readonly transcript: string
  private readonly modelConfig: ModelConfiguration
  private readonly messages: ChatMessage[] = []

  constructor(
    videoUrl: string,
    transcript: string,
    modelConfig?: ModelConfiguration
  ) {
    this.videoUrl = videoUrl
    this.transcript = transcript
    this.modelConfig = modelConfig || ModelSelectionService.selectModel()
  }

  getSystemPrompt(): string {
    return `
You are an AI assistant that helps users understand and discuss a YouTube video transcript.

<video_url>
${this.videoUrl}
</video_url>

<transcript_srt>
${this.transcript}
</transcript_srt>

Rules:
- Answer in Markdown.
- Use the SRT transcript as the primary and default source.
- Preserve exact context, numbers, dates, names, examples, claims, and limitations from the transcript.
- Do not invent facts, sources, speaker names, timestamps, or conclusions.
- If the transcript does not contain enough information to answer, say so clearly.
- If the transcript is ambiguous, incomplete, or auto-generated, mention that limitation when relevant.
- When citing transcript information, use the SRT start timestamp of the relevant subtitle block.
- Convert SRT timestamps to YouTube timestamp links using total seconds.
- Use this exact timestamp URL pattern for this video: ${this.getTimestampUrlPattern()}
- Citation format: TIMESTAMP_URL as plain visible text, for example ${this.getExampleTimestampUrl()}.
- Replace SECONDS with the total number of seconds; do not add another '?t=' or '&t='.
- Cite only timestamps that directly support the answer.
- If the user asks for a summary, key points, themes, arguments, or explanations, base them only on the transcript.
- If the user asks something unrelated to the transcript, say that the question is not related to the video and ask whether they want an answer beyond the transcript.
- Use internet search only when the user explicitly asks for it.
- When using external information, clearly separate it from transcript-based information.
`
  }

  private getTimestampUrlPattern(): string {
    return this.getTimestampUrl('SECONDS')
  }

  private getExampleTimestampUrl(): string {
    return this.getTimestampUrl('42')
  }

  private getTimestampUrl(seconds: string): string {
    const hashIndex = this.videoUrl.indexOf('#')
    const hasHash = hashIndex !== -1
    const urlWithoutHash = hasHash
      ? this.videoUrl.slice(0, hashIndex)
      : this.videoUrl
    const hash = hasHash ? this.videoUrl.slice(hashIndex) : ''
    const separator = urlWithoutHash.includes('?') ? '&' : '?'

    return `${urlWithoutHash}${separator}t=${seconds}${hash}`
  }

  getMessages(): ChatMessage[] {
    return this.messages
  }

  clearMessages(): void {
    this.messages.length = 0
  }

  async *sendMessage(message: string): AsyncIterable<string> {
    const userMessage: ChatMessage = {
      id: `msg-${randomUUID()}-user`,
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
      id: `msg-${randomUUID()}-assistant`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
      streamingComplete: true
    }

    this.messages.push(assistantMessage)
  }
}
