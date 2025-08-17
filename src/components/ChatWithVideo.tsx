import React, { useState, useEffect } from "react";
import { Text, Box, useInput } from "ink";
import Spinner from "ink-spinner";
import { SubtitlesSelection } from "./SubtitlesSelection";
import {
  SubtitleLanguage,
  YtdlpSubtitleService,
  SubtitleDownloadResult,
} from "../services/subtitle";

type ChatWithVideoProps = {
  url: string;
  subtitleService: YtdlpSubtitleService;
};

type ChatWithVideoState =
  | {
      status: "started";
    }
  | {
      status: "subtitle-selected";
      selectedSubtitle: SubtitleLanguage;
    }
  | {
      status: "subtitle-downloaded";
      selectedSubtitle: SubtitleLanguage;
      downloadStatus: "finished";
      downloadResult: SubtitleDownloadResult;
    };

const YoutubeUrlInfo: React.FC<{ url: string }> = ({ url }) => {
  return (
    <Box flexDirection="column">
      <Text color="green">🎥 Processing YouTube video...</Text>
      <Text color="gray">URL: {url}</Text>
    </Box>
  );
};

export const ChatWithVideo: React.FC<ChatWithVideoProps> = ({
  url,
  subtitleService,
}) => {
  const [chatState, setChatState] = useState<ChatWithVideoState>({
    status: "started",
  });
  const [userInput, setUserInput] = useState<string>("");

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    setChatState({
      status: "subtitle-selected",
      selectedSubtitle: subtitle,
    });
  };

  // Download subtitle when one is selected
  useEffect(() => {
    if (chatState.status == "subtitle-selected" && chatState.selectedSubtitle) {
      const downloadSubtitle = async () => {
        const result = await subtitleService.downloadAndTransformToRawText(
          url,
          chatState.selectedSubtitle
        );
        setChatState({
          selectedSubtitle: chatState.selectedSubtitle,
          status: "subtitle-downloaded",
          downloadStatus: "finished",
          downloadResult: result,
        });
      };
      downloadSubtitle();
    }
  }, [chatState, subtitleService, url]);

  // Handle user input for chat mode only
  useInput((input, key) => {
    // Handle /exit command
    if (userInput + input === "/exit") {
      process.exit(0);
    }

    // Build up the input string
    if (input && !key.ctrl) {
      setChatState((prev) => ({
        ...prev,
        userInput: prev + input,
      }));

      // Check if we're building /exit command
      if ((userInput + input).startsWith("/exit")) {
        return;
      }

      // Reset input if it's not building toward /exit
      setUserInput("");
    }
  });

  const renderChatState = () => {
    switch (chatState.status) {
      case "started":
        return (
          <Box flexDirection="column">
            <SubtitlesSelection
              url={url}
              subtitleService={subtitleService}
              onSubtitleSelected={handleSubtitleSelected}
            />
          </Box>
        );
      case "subtitle-selected":
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Selected subtitle:</Text>
            <Text color="cyan">{chatState.selectedSubtitle.name}</Text>
            <Text> </Text>
            <Text color="yellow">
              <Spinner type="dots" /> Downloading VTT subtitle file...
            </Text>
          </Box>
        );

      case "subtitle-downloaded":
        if (chatState.downloadResult.success) {
          return (
            <Box flexDirection="column">
              <Text color="green">✅ Selected subtitle:</Text>
              <Text color="cyan">{chatState.selectedSubtitle.name}</Text>
              <Text> </Text>
              <Text color="green">📁 Download completed!</Text>
              <Text color="gray">File: {chatState.downloadResult.filePath}</Text>
            </Box>
          );
        } else {
          return (
            <Box flexDirection="column">
              <Text color="green">✅ Selected subtitle:</Text>
              <Text color="cyan">{chatState.selectedSubtitle.name}</Text>
              <Text> </Text>
              <Text color="red">❌ Download failed!</Text>
              <Text color="red">Error: {chatState.downloadResult.error}</Text>
            </Box>
          );
        }

      default:
        return null;
    }
  };

  return (
    <>
      <YoutubeUrlInfo url={url} />
      {renderChatState()}
    </>
  );
};
