import React, { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import { SubtitleLanguage, SubtitleService } from '../services/subtitle';
import Spinner from 'ink-spinner';

interface SubtitlesSelectionProps {
  url: string;
  subtitleService: SubtitleService;
  onSubtitleSelected: (subtitle: SubtitleLanguage) => void;
  onExit?: () => void;
}

interface SubtitlesSelectionState {
  loading: boolean;
  subtitles: SubtitleLanguage[];
  error: string | null;
  selectedIndex: number;
}

export const SubtitlesSelection: React.FC<SubtitlesSelectionProps> = ({ 
  url, 
  subtitleService,
  onSubtitleSelected
}) => {
  const [state, setState] = useState<SubtitlesSelectionState>({
    loading: true,
    subtitles: [],
    error: null,
    selectedIndex: 0,
  });

  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await subtitleService.getAvailableSubtitles(url);
        
        if (typeof result === 'string') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result,
            subtitles: [],
          }));
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            subtitles: result,
            selectedIndex: 0,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          subtitles: [],
        }));
      }
    };

    fetchSubtitles();
  }, [url, subtitleService]);

  useInput((input, key) => {
    // Only handle navigation if we have subtitles
    if (state.subtitles.length === 0) return;

    if (key.upArrow) {
      setState(prev => ({
        ...prev,
        selectedIndex: prev.selectedIndex > 0 ? prev.selectedIndex - 1 : prev.subtitles.length - 1,
      }));
    } else if (key.downArrow) {
      setState(prev => ({
        ...prev,
        selectedIndex: prev.selectedIndex < prev.subtitles.length - 1 ? prev.selectedIndex + 1 : 0,
      }));
    } else if (key.return) {
      const selectedSubtitle = state.subtitles[state.selectedIndex];
      if (selectedSubtitle) {
        onSubtitleSelected(selectedSubtitle);
      }
    }
  });

  if (state.loading) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">
          <Spinner type="dots" /> Fetching available subtitles...
        </Text>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ {state.error}</Text>
      </Box>
    );
  }

  if (state.subtitles.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">📭 No subtitles available for this video</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">📝 Available subtitles:</Text>
      <Text color="gray">Use ↑↓ to navigate, Enter to select</Text>
      <Text> </Text>
      
      {state.subtitles.map((subtitle, index) => (
        <Box key={subtitle.code}>
          <Text color={index === state.selectedIndex ? 'cyan' : 'white'}>
            {index === state.selectedIndex ? '→ ' : '  '}
            {subtitle.code} - {subtitle.name}
          </Text>
        </Box>
      ))}
    </Box>
  );
};
