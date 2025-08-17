import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatWithVideo } from './ChatWithVideo';
import { YtdlpSubtitleService, SubtitleLanguage } from '../services/subtitle';

describe('ChatWithVideo Integration', () => {
  let mockSubtitleService: YtdlpSubtitleService;

  beforeEach(() => {
    mockSubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      downloadSubtitle: vi.fn(),
    } as unknown as YtdlpSubtitleService;
  });

  const getMockProps = () => ({
    url: 'https://www.youtube.com/watch?v=test',
    subtitleService: mockSubtitleService,
  });

  it('should display loading state initially', () => {
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValue([]);
    
    const { lastFrame } = render(<ChatWithVideo {...getMockProps()} />);
    
    expect(lastFrame()).toContain('🎥 Processing YouTube video...');
    expect(lastFrame()).toContain('⠋ Fetching available subtitles...');
  });

  it('should complete the full download flow after subtitle selection', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'en', name: 'English', type: 'uploaded' },
      { code: 'fr', name: 'French', type: 'uploaded' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValue(mockSubtitles);
    
    // Create a delayed promise to simulate slow download
    let resolveDownload: (value: { success: true; filePath: string }) => void;
    const downloadPromise = new Promise<{ success: true; filePath: string }>(resolve => {
      resolveDownload = resolve;
    });
    vi.mocked(mockSubtitleService.downloadSubtitle).mockReturnValue(downloadPromise);

    const { lastFrame, rerender, stdin } = render(<ChatWithVideo {...getMockProps()} />);
    
    // Wait for subtitle list to load
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Verify subtitles are displayed
    expect(lastFrame()).toContain('📝 Available subtitles:');
    expect(lastFrame()).toContain('en - English');
    
    // Select the first subtitle (Enter key)
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Should show downloading state
    expect(lastFrame()).toContain('✅ Selected subtitle:');
    expect(lastFrame()).toContain('English');
    expect(lastFrame()).toContain('⠋ Downloading VTT subtitle file...');
    
    // Now complete the download
    resolveDownload!({
      success: true,
      filePath: 'test.en.vtt'
    });
    
    // Wait for download to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Should show completed download
    expect(lastFrame()).toContain('📁 Download completed!');
    expect(lastFrame()).toContain('File: test.en.vtt');    
    // Verify download method was called correctly
    expect(mockSubtitleService.downloadSubtitle).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=test',
      mockSubtitles[0]
    );
  });

  it('should handle auto subtitle download correctly', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'fr-orig', name: 'French', type: 'auto' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValue(mockSubtitles);
    vi.mocked(mockSubtitleService.downloadSubtitle).mockResolvedValue({
      success: true,
      filePath: 'test.fr-orig.vtt'
    });

    const { lastFrame, rerender, stdin } = render(<ChatWithVideo {...getMockProps()} />);
    
    // Wait for subtitle list to load
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Select the auto subtitle
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 20));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Verify download method was called with auto subtitle
    expect(mockSubtitleService.downloadSubtitle).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=test',
      mockSubtitles[0]
    );
    
    expect(lastFrame()).toContain('📁 Download completed!');
  });

  it('should handle download failures gracefully', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'en', name: 'English', type: 'uploaded' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValue(mockSubtitles);
    vi.mocked(mockSubtitleService.downloadSubtitle).mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    const { lastFrame, rerender, stdin } = render(<ChatWithVideo {...getMockProps()} />);
    
    // Wait for subtitle list to load
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Select subtitle
    stdin.write('\r');
    await new Promise(resolve => setTimeout(resolve, 20));
    rerender(<ChatWithVideo {...getMockProps()} />);
    
    // Should show error state
    expect(lastFrame()).toContain('❌ Download failed!');
    expect(lastFrame()).toContain('Error: Network error');
  });

});
