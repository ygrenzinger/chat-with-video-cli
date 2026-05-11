import { assign, fromPromise, setup } from 'xstate'
import {
  type SubtitleLanguage,
  type SubtitleService
} from '../services/subtitle.js'
import { type ChatService } from '../services/chat.service.js'
import { type ChatServiceFactory } from '../utils/factories.js'

type MachineContext = {
  url: string
  subtitleService: SubtitleService
  chatServiceFactory: ChatServiceFactory
  selectedSubtitle: SubtitleLanguage | null
  transcript: string | null
  videoName: string | null
  chatService: ChatService | null
  error: string | null
}

type MachineInput = {
  url: string
  subtitleService: SubtitleService
  chatServiceFactory: ChatServiceFactory
}

type DownloadSubtitleInput = {
  url: string
  subtitle: SubtitleLanguage
  subtitleService: SubtitleService
}

type DownloadSubtitleOutput = {
  transcript: string
  videoName: string
}

type InitializeChatServiceInput = {
  url: string
  transcript: string
  chatServiceFactory: ChatServiceFactory
}

export const chatWithVideoMachine = setup({
  types: {
    context: {} as MachineContext,
    input: {} as MachineInput,
    events: {} as
      | { type: 'SELECT_SUBTITLE'; subtitle: SubtitleLanguage }
      | { type: 'RETRY' }
  },
  actors: {
    downloadSubtitle: fromPromise<
      DownloadSubtitleOutput,
      DownloadSubtitleInput
    >(async ({ input }) => {
      const result = await input.subtitleService.retrieveRawText(
        input.url,
        input.subtitle
      )

      if (!result.success) {
        throw new Error(result.error || 'Download failed')
      }

      return {
        transcript: result.content,
        videoName: result.videoName
      }
    }),
    initializeChatService: fromPromise<ChatService, InitializeChatServiceInput>(
      async ({ input }) => {
        return input.chatServiceFactory(input.url, input.transcript)
      }
    )
  }
}).createMachine({
  id: 'chatWithVideo',
  initial: 'selectingSubtitle',
  context: ({ input }) => ({
    url: input.url,
    subtitleService: input.subtitleService,
    chatServiceFactory: input.chatServiceFactory,
    selectedSubtitle: null,
    transcript: null,
    videoName: null,
    chatService: null,
    error: null
  }),
  states: {
    selectingSubtitle: {
      on: {
        SELECT_SUBTITLE: {
          target: 'downloadingSubtitle',
          actions: assign({
            selectedSubtitle: ({ event }) => event.subtitle,
            error: null
          })
        }
      }
    },
    downloadingSubtitle: {
      invoke: {
        src: 'downloadSubtitle',
        input: ({ context }) => ({
          url: context.url,
          subtitle: context.selectedSubtitle!,
          subtitleService: context.subtitleService
        }),
        onDone: {
          target: 'initializingChat',
          actions: assign({
            transcript: ({ event }) => event.output.transcript,
            videoName: ({ event }) => event.output.videoName,
            error: null
          })
        },
        onError: {
          target: 'downloadError',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error
                ? event.error.message
                : String(event.error)
          })
        }
      }
    },
    downloadError: {
      on: {
        RETRY: {
          target: 'selectingSubtitle',
          actions: assign({
            selectedSubtitle: null,
            transcript: null,
            videoName: null,
            chatService: null,
            error: null
          })
        }
      }
    },
    initializingChat: {
      invoke: {
        src: 'initializeChatService',
        input: ({ context }) => ({
          url: context.url,
          transcript: context.transcript!,
          chatServiceFactory: context.chatServiceFactory
        }),
        onDone: {
          target: 'chatReady',
          actions: assign({
            chatService: ({ event }) => event.output,
            error: null
          })
        },
        onError: {
          target: 'chatInitError',
          actions: assign({
            error: ({ event }) =>
              event.error instanceof Error
                ? event.error.message
                : String(event.error)
          })
        }
      }
    },
    chatInitError: {},
    chatReady: {
      always: {
        target: 'chatActive'
      }
    },
    chatActive: {}
  }
})
