import { execAsync } from "../utils/exec-async.js";
import { convertVttToTxt } from "../utils/vtt-converter.js";

export type SubtitleLanguage = {
  code: string;
  name: string;
  type: "uploaded" | "auto";
};

export type SubtitleDownloadResult =
  | {
      success: true;
      filePath: string;
    }
  | {
      success: false;
      error: string;
    };

export interface SubtitleService {
  isAvailable(): Promise<boolean>;
  getAvailableSubtitles(url: string): Promise<SubtitleLanguage[] | string>;
  downloadSubtitle(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<SubtitleDownloadResult>;
  downloadAndTransformToRawText(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<SubtitleDownloadResult>;
}

export class YtdlpSubtitleService implements SubtitleService {
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync("yt-dlp --version");
      return true;
    } catch {
      return false;
    }
  }

  async getAvailableSubtitles(
    url: string
  ): Promise<SubtitleLanguage[] | string> {
    try {
      const result = await execAsync(`yt-dlp --list-subs "${url}"`, {
        encoding: "utf8",
      });

      const output = result.stdout;

      if (output.includes("[info] Available subtitles for")) {
        return this.parseSubtitleOutput(output).map((lang) => ({
          ...lang,
          type: "uploaded",
        })) as SubtitleLanguage[];
      }

      if (output.includes("[info] Available automatic captions for")) {
        const languages = this.parseSubtitleOutput(output);
        return this.filterOrigSuffixLanguages(languages).map((lang) => ({
          ...lang,
          type: "auto",
        })) as SubtitleLanguage[];
      }

      return "No subtitle information found";
    } catch (error) {
      throw new Error(
        `Failed to get subtitles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async downloadSubtitle(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<SubtitleDownloadResult> {
    try {
      const command =
        subtitle.type === "uploaded"
          ? `yt-dlp --write-sub --sub-lang ${subtitle.code} --sub-format vtt --skip-download "${url}"`
          : `yt-dlp --write-auto-sub --sub-lang ${subtitle.code} --sub-format vtt --skip-download "${url}"`;

      const output = await execAsync(command, {
        encoding: "utf8",
      });

      console.log(output.stdout);

      // Check if download was successful by looking for file mention in output
      const vttMatch = output.stdout.match(
        /\[download\] Destination: (.+\.vtt)/
      );
      if (vttMatch) {
        return {
          success: true,
          filePath: vttMatch[1],
        };
      }

      return {
        success: false,
        error: "Download failed: no subtitle file found",
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to download subtitle: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async downloadAndTransformToRawText(
    url: string,
    subtitle: SubtitleLanguage
  ): Promise<SubtitleDownloadResult> {
    const downloadResult = await this.downloadSubtitle(url, subtitle);

    if (!downloadResult.success) {
      return downloadResult;
    }

    try {
      const txtFilePath = convertVttToTxt(downloadResult.filePath);
      return {
        success: true,
        filePath: txtFilePath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to transform VTT to text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  private parseSubtitleOutput(
    output: string
  ): Omit<SubtitleLanguage, "type">[] {
    const lines = output.split("\n");
    const languages: Omit<SubtitleLanguage, "type">[] = [];

    let foundHeader = false;
    for (const line of lines) {
      if (line.includes("Language Name")) {
        foundHeader = true;
        continue;
      }

      if (foundHeader && line.trim()) {
        const match = line.match(/^(\S+)\s+(.+?)\s+([a-z0-9, ]+)$/i);
        if (match) {
          const [, code, name] = match;
          languages.push({
            code: code.trim(),
            name: name.trim(),
          });
        }
      }
    }

    return languages;
  }

  private filterOrigSuffixLanguages(
    languages: Omit<SubtitleLanguage, "type">[]
  ): Omit<SubtitleLanguage, "type">[] {
    return languages.filter((lang) => lang.code.endsWith("-orig"));
  }
}
