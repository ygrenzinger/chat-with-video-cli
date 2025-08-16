import { SubtitleService, SubtitleLanguage } from './subtitle.js';

export interface SubtitleOrchestrator {
  processVideo(url: string): Promise<void>;
}

export class VideoSubtitleOrchestrator implements SubtitleOrchestrator {
  constructor(
    private subtitleService: SubtitleService,
    private logger: (message: string) => void = console.log
  ) {}

  async processVideo(url: string): Promise<void> {
    try {
      const isAvailable = await this.subtitleService.isAvailable();
      
      if (!isAvailable) {
        this.logger('Error: Video processing tool is not available. Please install yt-dlp.');
        return;
      }

      this.logger('✓ Video processing tool is available');
      
      const subtitles = await this.subtitleService.getAvailableSubtitles(url);
      
      if (typeof subtitles === 'string') {
        this.logger(subtitles);
        return;
      }

      if (subtitles.length === 0) {
        this.logger('No subtitles found for this video');
        return;
      }

      this.logger('Available subtitles:');
      subtitles.forEach((subtitle: SubtitleLanguage) => {
        this.logger(`${subtitle.code} - ${subtitle.name}`);
      });
    } catch (error) {
      this.logger(`Error processing video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}