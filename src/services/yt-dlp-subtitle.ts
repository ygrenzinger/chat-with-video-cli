import { execAsync } from '../utils/exec-async.js'
import { convertSrtToTxt } from '../utils/srt-converter.js'
import { readFileSync } from 'fs'
import {
  SubtitleDownloadResult,
  SubtitleLanguage,
  SubtitleService
} from './subtitle'

export class YtdlpSubtitleService implements SubtitleService {
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('yt-dlp --version')
      return true
    } catch {
      return false
    }
  }

  async getAvailableSubtitles(
    url: string
  ): Promise<SubtitleLanguage[] | string> {
    try {
      const result = await execAsync(`yt-dlp --list-subs "${url}"`, {
        encoding: 'utf8'
      })

      const output = result.stdout

      if (output.includes('[info] Available subtitles for')) {
        return this.parseSubtitleOutput(output).map(lang => ({
          ...lang,
          type: 'uploaded'
        })) as SubtitleLanguage[]
      }

      if (output.includes('[info] Available automatic captions for')) {
        const languages = this.parseSubtitleOutput(output)
        return languages
          .filter(lang => lang.code.endsWith('-orig'))
          .map(lang => ({
            ...lang,
            type: 'auto'
          })) as SubtitleLanguage[]
      }

      return 'No subtitle information found'
    } catch (error) {
      throw new Error(
        `Failed to get subtitles: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async downloadSubtitle(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<
    | {
        success: true
        filePath: string
      }
    | {
        success: false
        error: string
      }
  > {
    try {
      const command =
        subtitle.type === 'uploaded'
          ? `yt-dlp --write-sub --sub-lang ${subtitle.code} --sub-format srt --skip-download "${url}"`
          : `yt-dlp --write-auto-sub --sub-lang ${subtitle.code} --sub-format srt --skip-download "${url}"`

      const output = await execAsync(command, {
        encoding: 'utf8'
      })

      console.log(output.stdout)

      // Check if download was successful by looking for file mention in output
      const srtMatch = output.stdout.match(
        /\[download\] Destination: (.+\.srt)/
      )
      if (srtMatch) {
        return {
          success: true,
          filePath: srtMatch[1]
        }
      }

      return {
        success: false,
        error: 'Download failed: unable to download subtitle'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to download subtitle: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      }
    }
  }

  async retrieveRawText(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<SubtitleDownloadResult> {
    const downloadResult = await this.downloadSubtitle(url, subtitle)

    if (!downloadResult.success) {
      return downloadResult
    }

    try {
      const txtFilePath = convertSrtToTxt(downloadResult.filePath)
      const content = readFileSync(txtFilePath, 'utf8')

      return {
        success: true,
        content
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to transform SRT to text: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      }
    }
  }

  private parseSubtitleOutput(
    output: string
  ): Omit<SubtitleLanguage, 'type'>[] {
    const lines = output.split('\n')
    const languages: Omit<SubtitleLanguage, 'type'>[] = []

    let foundHeader = false
    for (const line of lines) {
      if (line.includes('Language Name')) {
        foundHeader = true
        continue
      }

      if (foundHeader && line.trim()) {
        const match = line.match(/^(\S+)\s+(.+?)\s+([a-z0-9, ]+)$/i)
        if (match) {
          const [, code, name] = match
          languages.push({
            code: code.trim(),
            name: name.trim()
          })
        }
      }
    }

    return languages
  }
}
