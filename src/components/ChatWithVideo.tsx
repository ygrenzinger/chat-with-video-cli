import React from 'react';
import { Text } from 'ink';

interface ChatWithVideoProps {
  url: string;
}

export const ChatWithVideo: React.FC<ChatWithVideoProps> = ({ url }) => {
  return (
    <>
      <Text color="green">🎥 Processing YouTube video...</Text>
      <Text>URL: {url}</Text>
      <Text color="yellow">Feature coming soon: Chat with your YouTube videos!</Text>
    </>
  );
};