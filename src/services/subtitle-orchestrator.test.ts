import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoSubtitleOrchestrator } from './subtitle-orchestrator.js';
import { SubtitleService } from './subtitle.js';

describe('VideoSubtitleOrchestrator', () => {
  let orchestrator: VideoSubtitleOrchestrator;
  let mockSubtitleService: SubtitleService;
  let mockLogger: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn()
    };
    mockLogger = vi.fn();
    orchestrator = new VideoSubtitleOrchestrator(mockSubtitleService, mockLogger);
  });

  it('should handle unavailable subtitle service', async () => {
    vi.mocked(mockSubtitleService.isAvailable).mockResolvedValue(false);

    await orchestrator.processVideo('https://youtube.com/watch?v=test');

    expect(mockLogger).toHaveBeenCalledWith('Error: Video processing tool is not available. Please install yt-dlp.');
  });

  it('should process video with available subtitles', async () => {
    vi.mocked(mockSubtitleService.isAvailable).mockResolvedValue(true);
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValue([
      { code: 'en-US', name: 'English (United States)', formats: ['vtt', 'srt'] }
    ]);

    await orchestrator.processVideo('https://youtube.com/watch?v=test');

    expect(mockLogger).toHaveBeenCalledWith('✓ Video processing tool is available');
    expect(mockLogger).toHaveBeenCalledWith('Available subtitles:');
    expect(mockLogger).toHaveBeenCalledWith('en-US - English (United States)');
  });

  it('should handle video with no subtitles', async () => {
    vi.mocked(mockSubtitleService.isAvailable).mockResolvedValue(true);
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValue('This video has no subtitles');

    await orchestrator.processVideo('https://youtube.com/watch?v=test');

    expect(mockLogger).toHaveBeenCalledWith('This video has no subtitles');
  });

  it('should handle service errors', async () => {
    vi.mocked(mockSubtitleService.isAvailable).mockResolvedValue(true);
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockRejectedValue(new Error('Network error'));

    await orchestrator.processVideo('https://youtube.com/watch?v=test');

    expect(mockLogger).toHaveBeenCalledWith('Error processing video: Network error');
  });
});