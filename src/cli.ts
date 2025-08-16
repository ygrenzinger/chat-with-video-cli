import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { ChatWithVideo } from './components/ChatWithVideo.js';
import { isValidYouTubeUrl } from './utils/youtube.js';

const program = new Command();

program
  .name('chat-with-video')
  .description('Chat with YouTube videos using AI')
  .version('1.0.0')
  .argument('<url>', 'YouTube URL to process')
  .action((url: string) => {
    if (!isValidYouTubeUrl(url)) {
      console.error('Error: Please provide a valid YouTube URL');
      console.error('Examples:');
      console.error('  https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      console.error('  https://youtu.be/dQw4w9WgXcQ');
      process.exit(1);
    }
    
    render(React.createElement(ChatWithVideo, { url }));
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();