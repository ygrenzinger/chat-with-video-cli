import React from 'react';
import { Box, Text } from 'ink';

interface HelloWorldProps {
  name?: string;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({ name = 'World' }) => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text color="green" bold>
          🚀 Hello, {name}!
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Welcome to your CLI tool built with React Ink!
        </Text>
      </Box>
    </Box>
  );
};