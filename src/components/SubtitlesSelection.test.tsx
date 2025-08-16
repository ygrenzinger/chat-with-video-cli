import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtitlesSelection } from './SubtitlesSelection';
import { SubtitleService, SubtitleLanguage } from '../services/subtitle';

describe('SubtitlesSelection', () => {
  let mockSubtitleService: SubtitleService;
  let mockOnSubtitleSelected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSubtitleService = {
      isAvailable: vi.fn(),
      getAvailableSubtitles: vi.fn(),
      downloadSubtitle: vi.fn(),
    } as SubtitleService;
    mockOnSubtitleSelected = vi.fn();
  });

  const getMockProps = () => ({
    url: 'https://www.youtube.com/watch?v=test',
    subtitleService: mockSubtitleService,
    onSubtitleSelected: mockOnSubtitleSelected,
  });

  it('should render loading state initially', () => {
    const { lastFrame } = render(<SubtitlesSelection {...getMockProps()} />);
    
    expect(lastFrame()).toContain('⠋ Fetching available subtitles...');
  });

  it('should fetch subtitles on mount and display them', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'en', name: 'English', type: 'uploaded' },
      { code: 'fr', name: 'French', type: 'uploaded' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce(mockSubtitles);

    const { lastFrame, rerender } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    expect(mockSubtitleService.getAvailableSubtitles).toHaveBeenCalledWith('https://www.youtube.com/watch?v=test');
    expect(lastFrame()).toContain('📝 Available subtitles:');
    expect(lastFrame()).toContain('en - English');
    expect(lastFrame()).toContain('fr - French');
  });

  it('should display error message when fetch fails', async () => {
    const errorMessage = 'Network error';
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce(errorMessage);

    const { lastFrame, rerender } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    expect(lastFrame()).toContain('❌ Network error');
  });

  it('should display no subtitles message when empty array is returned', async () => {
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce([]);

    const { lastFrame, rerender } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    expect(lastFrame()).toContain('📭 No subtitles available for this video');
  });

  it('should handle arrow key navigation', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'en', name: 'English', type: 'uploaded' },
      { code: 'fr', name: 'French', type: 'uploaded' },
      { code: 'es', name: 'Spanish', type: 'uploaded' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce(mockSubtitles);

    const { lastFrame, rerender, stdin } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    // First item should be selected (with arrow)
    expect(lastFrame()).toContain('→ en - English');
    
    // Navigate down
    stdin.write('\u001B[B'); // Down arrow
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(lastFrame()).toContain('→ fr - French');
    expect(lastFrame()).not.toContain('→ en - English');
    
    // Navigate up
    stdin.write('\u001B[A'); // Up arrow
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(lastFrame()).toContain('→ en - English');
    expect(lastFrame()).not.toContain('→ fr - French');
  });

  it('should wrap navigation from first to last item', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'en', name: 'English', type: 'uploaded' },
      { code: 'fr', name: 'French', type: 'uploaded' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce(mockSubtitles);

    const { lastFrame, rerender, stdin } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    // Navigate up from first item should wrap to last
    stdin.write('\u001B[A'); // Up arrow
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(lastFrame()).toContain('→ fr - French');
  });

  it('should call onSubtitleSelected when Enter is pressed', async () => {
    const mockSubtitles: SubtitleLanguage[] = [
      { code: 'en', name: 'English', type: 'uploaded' },
      { code: 'fr', name: 'French', type: 'uploaded' },
    ];
    
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce(mockSubtitles);

    const { rerender, stdin } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    // Navigate to second item
    stdin.write('\u001B[B'); // Down arrow
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Press Enter to select
    stdin.write('\r'); // Enter key
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(mockOnSubtitleSelected).toHaveBeenCalledWith(mockSubtitles[1]);
  });

  it('should not handle navigation when no subtitles are available', async () => {
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockResolvedValueOnce([]);

    const { lastFrame, rerender, stdin } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    // Try to navigate - should not affect anything
    stdin.write('\u001B[B'); // Down arrow
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(lastFrame()).toContain('📭 No subtitles available for this video');
    expect(mockOnSubtitleSelected).not.toHaveBeenCalled();
  });

  it('should handle service exceptions gracefully', async () => {
    const error = new Error('Service unavailable');
    vi.mocked(mockSubtitleService.getAvailableSubtitles).mockRejectedValueOnce(error);

    const { lastFrame, rerender } = render(<SubtitlesSelection {...getMockProps()} />);
    
    // Wait for async state update
    await new Promise(resolve => setTimeout(resolve, 10));
    rerender(<SubtitlesSelection {...getMockProps()} />);
    
    expect(lastFrame()).toContain('❌ Service unavailable');
  });
});
