import { execSync } from 'child_process';

export interface SubtitleLanguage {
  code: string;
  name: string;
  formats: string[];
}

export interface SubtitleService {
  isAvailable(): Promise<boolean>;
  getAvailableSubtitles(url: string): Promise<SubtitleLanguage[] | string>;
}

export class VideoSubtitleService implements SubtitleService {
  async isAvailable(): Promise<boolean> {
    try {
      execSync('yt-dlp --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async getAvailableSubtitles(url: string): Promise<SubtitleLanguage[] | string> {
    try {
      const output = execSync(`yt-dlp --list-subs "${url}"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      if (output.includes('has no subtitles')) {
        return 'This video has no subtitles';
      }

      if (output.includes('[info] Available subtitles for')) {
        const languages = this.parseSubtitleOutput(output);
        return languages;
      }

      return 'No subtitle information found';
    } catch (error) {
      throw new Error(`Failed to get subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseSubtitleOutput(output: string): SubtitleLanguage[] {
    const lines = output.split('\n');
    const languages: SubtitleLanguage[] = [];
    
    let foundHeader = false;
    for (const line of lines) {
      if (line.includes('Language Name')) {
        foundHeader = true;
        continue;
      }
      
      if (foundHeader && line.trim()) {
        const match = line.match(/^(\S+)\s+(.+?)\s+([a-z0-9, ]+)$/i);
        if (match) {
          const [, code, name, formats] = match;
          languages.push({
            code: code.trim(),
            name: name.trim(),
            formats: formats.split(',').map(f => f.trim())
          });
        }
      }
    }
    
    return languages;
  }
}