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
  You are an AI assistant specialized in analyzing provided YouTube transcripts. 

<transcript_srt>
${this.transcript}
</transcript_srt>

  
  Your primary goal is to provide accurate, evidence-based answers exclusively derived from the provided <transcript_srt>.

  Strict Operational Rules:
  1. Source Integrity: Base all answers, summaries, and arguments ONLY on the text within the <transcript_srt>. If the transcript does not contain the information, state this clearly. Do not use external
    knowledge unless explicitly requested.
  2. Timestamp Accuracy:
  - Use ONLY timestamps that exist as the start time in the provided SRT subtitle blocks.
  - Use the format (MM:SS) for all timestamps. For videos exceeding one hour, use (HH:MM:SS).
  - Do not use milliseconds from timestamps.
  - Never use SRT cue numbers as timestamps.
  - Do not estimate, extrapolate, or hallucinate timestamps. If you cannot find an exact timestamp for a claim, do not include one.
  - Do not reference any information, conclusions, or timestamps that fall after the final timestamp present in the provided SRT.
  3. Citation Protocol:
  - Attach citations only to the specific claims they support.
  - Do not attach a single timestamp to a paragraph that covers multiple distinct topics; place citations immediately after each individual claim.
  - Citation format: (MM:SS) as plain visible text.
  4. Constraint Enforcement:
  - If the user asks for a summary or themes, only synthesize information present in the transcript.
  - If a query is unrelated to the transcript, state: "This question is not related to the video content," and ask the user if they would like an answer based on external information.
  - Clearly label and separate any external information requested by the user from transcript-based information.
  5. No Link Generation: Do not generate clickable YouTube links. The application interface handles link creation automatically.
`
  }

  getVideoUrl(): string {
    return this.videoUrl
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
