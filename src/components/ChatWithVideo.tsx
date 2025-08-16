import React, { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { SubtitlesSelection } from './SubtitlesSelection';
import { SubtitleLanguage, YtdlpSubtitleService, SubtitleDownloadResult } from '../services/subtitle';

interface ChatWithVideoProps {
  url: string;
  subtitleService: YtdlpSubtitleService;
}

interface ChatWithVideoState {
  selectedSubtitle: SubtitleLanguage | null;
  userInput: string;
  downloadStatus: 'idle' | 'downloading' | 'completed' | 'failed';
  downloadResult: SubtitleDownloadResult | null;
}

export const ChatWithVideo: React.FC<ChatWithVideoProps> = ({ url, subtitleService }) => {
  const [state, setState] = useState<ChatWithVideoState>({
    selectedSubtitle: null,
    userInput: '',
    downloadStatus: 'idle',
    downloadResult: null,
  });

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    setState(prev => ({ 
      ...prev, 
      selectedSubtitle: subtitle,
      downloadStatus: 'downloading'
    }));
  };

  // Download subtitle when one is selected
  useEffect(() => {
    const downloadSubtitle = async () => {
      if (state.selectedSubtitle && state.downloadStatus === 'downloading') {
        try {
          const result = await subtitleService.downloadSubtitle(url, state.selectedSubtitle);
          setState(prev => ({
            ...prev,
            downloadStatus: result.success ? 'completed' : 'failed',
            downloadResult: result
          }));
        } catch (error) {
          setState(prev => ({
            ...prev,
            downloadStatus: 'failed',
            downloadResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }));
        }
      }
    };

    downloadSubtitle();
  }, [state.selectedSubtitle, state.downloadStatus, subtitleService, url]);

  // Handle user input for chat mode only
  useInput((input, key) => {
    // Handle /exit command
    if (state.userInput + input === '/exit') {
      process.exit(0);
    }

    // Only handle input if we're in chat mode (download completed)
    if (state.downloadStatus !== 'completed') return;

    // Build up the input string
    if (input && !key.ctrl) {
      setState(prev => ({
        ...prev,
        userInput: prev.userInput + input,
      }));
      
      // Check if we're building /exit command
      if ((state.userInput + input).startsWith('/exit')) {
        return;
      }
      
      // Reset input if it's not building toward /exit
      setState(prev => ({ ...prev, userInput: '' }));
    }
  });

  const renderDownloadStatus = () => {
    if (!state.selectedSubtitle) return null;

    switch (state.downloadStatus) {
      case 'downloading':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Selected subtitle:</Text>
            <Text color="cyan">{state.selectedSubtitle.name}</Text>
            <Text> </Text>
            <Text color="yellow">
              <Spinner type="dots" /> Downloading VTT subtitle file...
            </Text>
          </Box>
        );
      
      case 'completed':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Selected subtitle:</Text>
            <Text color="cyan">{state.selectedSubtitle.name}</Text>
            <Text> </Text>
            <Text color="green">📁 Download completed!</Text>
            {state.downloadResult?.filePath && (
              <Text color="gray">File: {state.downloadResult.filePath}</Text>
            )}
            <Text> </Text>
            <Text color="gray">Type "/exit" to quit</Text>
            
            {state.userInput && (
              <Box marginTop={1}>
                <Text color="yellow">Command: {state.userInput}</Text>
              </Box>
            )}
          </Box>
        );
      
      case 'failed':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Selected subtitle:</Text>
            <Text color="cyan">{state.selectedSubtitle.name}</Text>
            <Text> </Text>
            <Text color="red">❌ Download failed!</Text>
            {state.downloadResult?.error && (
              <Text color="red">Error: {state.downloadResult.error}</Text>
            )}
            <Text> </Text>
            <Text color="gray">Type "/exit" to quit</Text>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column">
      <Text color="green">🎥 Processing YouTube video...</Text>
      <Text>URL: {url}</Text>
      <Text> </Text>
      
      {!state.selectedSubtitle ? (
        <SubtitlesSelection
          url={url}
          subtitleService={subtitleService}
          onSubtitleSelected={handleSubtitleSelected}
        />
      ) : (
        renderDownloadStatus()
      )}
    </Box>
  );
};
