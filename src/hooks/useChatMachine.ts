import { useActor } from '@xstate/react'
import { chatWithVideoMachine } from '../machines/chatWithVideo.machine.js'
import { type SubtitleService } from '../services/subtitle.js'
import { type ChatServiceFactory } from '../utils/factories.js'

export const useChatMachine = (
  url: string,
  subtitleService: SubtitleService,
  chatServiceFactory: ChatServiceFactory
) => {
  const [state, send] = useActor(chatWithVideoMachine, {
    input: { url, subtitleService, chatServiceFactory }
  })

  return {
    state,
    send,
    context: state.context,
    isSelectingSubtitle: state.matches('selectingSubtitle'),
    isDownloading: state.matches('downloadingSubtitle'),
    isDownloadError: state.matches('downloadError'),
    isInitializingChat: state.matches('initializingChat'),
    isChatInitError: state.matches('chatInitError'),
    isChatActive: state.matches('chatActive')
  }
}
