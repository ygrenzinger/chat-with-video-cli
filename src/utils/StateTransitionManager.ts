import { ChatWithVideoState } from '../hooks/useChatState.js'
import {
  SubtitleLanguage,
  SubtitleDownloadResult,
  SubtitleService
} from '../services/subtitle.js'
import { ChatService } from '../services/chat.service.js'

export class StateTransitionManager {
  /**
   * Orchestrates the complete flow from subtitle selection to chat readiness
   */
  static async processSubtitleSelection(
    subtitle: SubtitleLanguage,
    url: string,
    subtitleService: SubtitleService,
    onStateChange: (state: ChatWithVideoState) => void,
    createChatService: (transcript: string) => Promise<ChatService>
  ): Promise<void> {
    try {
      // Step 1: Transition to subtitle selected
      onStateChange({
        status: 'subtitle-selected',
        selectedSubtitle: subtitle
      })

      // Step 2: Download subtitle
      const result = await subtitleService.retrieveRawText(url, subtitle)

      if (result.success && result.content) {
        // Step 3: Transition to chat initializing
        onStateChange({
          status: 'chat-initializing',
          transcript: result.content,
          videoName: result.videoName
        })

        // Step 4: Initialize chat service
        const chatService = await createChatService(result.content)

        // Step 5: Transition to chat ready
        onStateChange({
          status: 'chat-ready',
          transcript: result.content,
          videoName: result.videoName,
          chatService
        })
      } else {
        // Handle download failure
        onStateChange({
          selectedSubtitle: subtitle,
          status: 'subtitle-downloaded',
          downloadStatus: 'finished',
          downloadResult: result
        })
      }
    } catch (error) {
      // Handle any errors in the flow
      console.error('Error in subtitle processing flow:', error)
      const errorResult: SubtitleDownloadResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }

      onStateChange({
        selectedSubtitle: subtitle,
        status: 'subtitle-downloaded',
        downloadStatus: 'finished',
        downloadResult: errorResult
      })
    }
  }

  /**
   * Determines if a state transition is valid
   */
  static isValidTransition(
    from: ChatWithVideoState['status'],
    to: ChatWithVideoState['status']
  ): boolean {
    const validTransitions: Record<
      ChatWithVideoState['status'],
      ChatWithVideoState['status'][]
    > = {
      started: ['subtitle-selected'],
      'subtitle-selected': ['subtitle-downloaded', 'chat-initializing'],
      'subtitle-downloaded': ['subtitle-selected'], // Allow retry
      'chat-initializing': ['chat-ready'],
      'chat-ready': ['chat-active'],
      'chat-active': ['chat-ready'] // Allow going back to ready state
    }

    return validTransitions[from]?.includes(to) ?? false
  }

  /**
   * Gets the next expected states for a given state
   */
  static getNextStates(
    currentStatus: ChatWithVideoState['status']
  ): ChatWithVideoState['status'][] {
    const transitions: Record<
      ChatWithVideoState['status'],
      ChatWithVideoState['status'][]
    > = {
      started: ['subtitle-selected'],
      'subtitle-selected': ['subtitle-downloaded', 'chat-initializing'],
      'subtitle-downloaded': ['subtitle-selected'],
      'chat-initializing': ['chat-ready'],
      'chat-ready': ['chat-active'],
      'chat-active': []
    }

    return transitions[currentStatus] ?? []
  }

  /**
   * Determines if a state allows message processing
   */
  static canProcessMessages(state: ChatWithVideoState): boolean {
    return state.status === 'chat-active' || state.status === 'chat-ready'
  }

  /**
   * Determines if a state is a terminal state (end of flow)
   */
  static isTerminalState(state: ChatWithVideoState): boolean {
    return (
      state.status === 'chat-active' || state.status === 'subtitle-downloaded'
    )
  }

  /**
   * Determines if a state represents an error state
   */
  static isErrorState(state: ChatWithVideoState): boolean {
    return (
      state.status === 'subtitle-downloaded' &&
      'downloadResult' in state &&
      !state.downloadResult.success
    )
  }

  /**
   * Gets a human-readable description of the current state
   */
  static getStateDescription(state: ChatWithVideoState): string {
    switch (state.status) {
      case 'started':
        return 'Waiting for subtitle selection'
      case 'subtitle-selected':
        return `Selected: ${state.selectedSubtitle.name} - Downloading...`
      case 'subtitle-downloaded':
        if (state.downloadResult.success) {
          return 'Subtitle downloaded successfully'
        } else {
          return `Download failed: ${state.downloadResult.error || 'Unknown error'}`
        }
      case 'chat-initializing':
        return 'Initializing AI chat service...'
      case 'chat-ready':
        return 'Ready to chat! Type your first message.'
      case 'chat-active':
        return 'Chat active'
      default:
        return 'Unknown state'
    }
  }
}
