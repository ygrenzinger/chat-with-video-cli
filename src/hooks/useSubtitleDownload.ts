import { useEffect } from 'react'
import { SubtitleService, SubtitleLanguage } from '../services/subtitle.js'
import { ChatWithVideoState } from './useChatState.js'

type UseSubtitleDownloadProps = {
  chatState: ChatWithVideoState
  url: string
  subtitleService: SubtitleService
  onDownloadSuccess: (transcript: string) => void
  onDownloadError: (selectedSubtitle: SubtitleLanguage, error: any) => void
}

export const useSubtitleDownload = ({
  chatState,
  url,
  subtitleService,
  onDownloadSuccess,
  onDownloadError
}: UseSubtitleDownloadProps) => {
  useEffect(() => {
    if (chatState.status !== 'subtitle-selected') {
      return
    }

    let isCancelled = false

    const downloadSubtitle = async () => {
      try {
        const result = await subtitleService.retrieveRawText(
          url,
          chatState.selectedSubtitle
        )

        if (isCancelled) return

        if (result.success && result.content) {
          onDownloadSuccess(result.content)
        } else {
          onDownloadError(chatState.selectedSubtitle, result)
        }
      } catch (error) {
        if (!isCancelled) {
          onDownloadError(chatState.selectedSubtitle, error)
        }
      }
    }

    downloadSubtitle()

    return () => {
      isCancelled = true
    }
  }, [chatState, url, subtitleService, onDownloadSuccess, onDownloadError])
}