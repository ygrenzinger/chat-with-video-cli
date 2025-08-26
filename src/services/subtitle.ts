export type SubtitleLanguage = {
  code: string
  name: string
  type: 'uploaded' | 'auto'
}

export type SubtitleDownloadResult =
  | {
      success: true
      content: string
      videoName: string
    }
  | {
      success: false
      error: string
    }

export interface SubtitleService {
  isAvailable(): Promise<boolean>
  getAvailableSubtitles(url: string): Promise<SubtitleLanguage[] | string>
  retrieveRawText(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<SubtitleDownloadResult>
}
