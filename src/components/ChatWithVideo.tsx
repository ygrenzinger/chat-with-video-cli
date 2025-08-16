import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import { SubtitlesSelection } from './SubtitlesSelection';
import { SubtitleLanguage, YtdlpSubtitleService } from '../services/subtitle';

interface ChatWithVideoProps {
  url: string;
  subtitleService: YtdlpSubtitleService;
}

interface ChatWithVideoState {
  selectedSubtitle: SubtitleLanguage | null;
  userInput: string;
}

export const ChatWithVideo: React.FC<ChatWithVideoProps> = ({ url, subtitleService }) => {
  const [state, setState] = useState<ChatWithVideoState>({
    selectedSubtitle: null,
    userInput: '',
  });

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    setState(prev => ({ ...prev, selectedSubtitle: subtitle }));
  };

  // Handle user input for chat mode only
  useInput((input, key) => {
    // Handle /exit command
    if (state.userInput + input === '/exit') {
      process.exit(0);
    }

    // Only handle input if we're in chat mode (subtitle already selected)
    if (!state.selectedSubtitle) return;

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
        <Box flexDirection="column">
          <Text color="green">✅ Selected subtitle:</Text>
          <Text color="cyan">
            {state.selectedSubtitle.code} - {state.selectedSubtitle.name}
          </Text>
          <Text color="gray">
            Available formats: {state.selectedSubtitle.formats.join(', ')}
          </Text>
          <Text> </Text>
          <Text color="yellow">Feature coming soon: Chat with your YouTube videos!</Text>
          <Text color="gray">Type "/exit" to quit</Text>
          
          {state.userInput && (
            <Box marginTop={1}>
              <Text color="yellow">Command: {state.userInput}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
