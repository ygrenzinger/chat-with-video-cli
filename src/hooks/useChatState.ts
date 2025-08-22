import { useState } from 'react'
import { SubtitleLanguage, SubtitleDownloadResult } from '../services/subtitle.js'
import { ChatService } from '../services/chat.service.js'

export type ChatWithVideoState =
  | { status: 'started' }
  | { status: 'subtitle-selected'; selectedSubtitle: SubtitleLanguage }
  | {
      status: 'subtitle-downloaded'
      selectedSubtitle: SubtitleLanguage
      downloadStatus: 'finished'
      downloadResult: SubtitleDownloadResult
    }
  | { status: 'chat-initializing'; transcript: string }
  | { status: 'chat-ready'; transcript: string; chatService: ChatService }
  | {
      status: 'chat-active'
      transcript: string
      chatService: ChatService
    }

export const useChatState = (initialState: ChatWithVideoState = { status: 'started' }) => {
  const [chatState, setChatState] = useState<ChatWithVideoState>(initialState)

  const transitionToSubtitleSelected = (subtitle: SubtitleLanguage) => {
    setChatState({
      status: 'subtitle-selected',
      selectedSubtitle: subtitle
    })
  }

  const transitionToSubtitleDownloaded = (
    selectedSubtitle: SubtitleLanguage,
    downloadResult: SubtitleDownloadResult
  ) => {
    setChatState({
      selectedSubtitle,
      status: 'subtitle-downloaded',
      downloadStatus: 'finished',
      downloadResult
    })
  }

  const transitionToChatInitializing = (transcript: string) => {
    setChatState({
      status: 'chat-initializing',
      transcript
    })
  }

  const transitionToChatReady = (transcript: string, chatService: ChatService) => {
    setChatState({
      status: 'chat-ready',
      transcript,
      chatService
    })
  }

  const transitionToChatActive = (transcript: string, chatService: ChatService) => {
    setChatState({
      status: 'chat-active',
      transcript,
      chatService
    })
  }

  const canProcessMessages = () => {
    return chatState.status === 'chat-active' || chatState.status === 'chat-ready'
  }

  const getCurrentTranscript = () => {
    if (chatState.status === 'chat-initializing' || 
        chatState.status === 'chat-ready' || 
        chatState.status === 'chat-active') {
      return chatState.transcript
    }
    return null
  }

  const getCurrentChatService = () => {
    if (chatState.status === 'chat-ready' || chatState.status === 'chat-active') {
      return chatState.chatService
    }
    return null
  }

  return {
    chatState,
    transitionToSubtitleSelected,
    transitionToSubtitleDownloaded,
    transitionToChatInitializing,
    transitionToChatReady,
    transitionToChatActive,
    canProcessMessages,
    getCurrentTranscript,
    getCurrentChatService
  }
}