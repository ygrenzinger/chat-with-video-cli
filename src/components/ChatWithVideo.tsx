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

export const ChatWithVideo: React.FC<ChatWithVideoProps> = ({
  url,
  subtitleService,
}) => {
  const [state, setState] = useState<ChatWithVideoState>({
    status: "started",
  });
  const [userInput, setUserInput] = useState<string>("");

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    setState({
      status: "subtitle-selected",
      selectedSubtitle: subtitle,
    });
  };

  // Download subtitle when one is selected
  useEffect(() => {
    if (state.status == "subtitle-selected" && state.selectedSubtitle) {
      const downloadSubtitle = async () => {
        const result = await subtitleService.downloadSubtitle(
          url,
          state.selectedSubtitle
        );
        setState({
          selectedSubtitle: state.selectedSubtitle,
          status: "subtitle-downloaded",
          downloadStatus: "finished",
          downloadResult: result,
        });
      };
      downloadSubtitle();
    }
  }, [state, subtitleService, url]);

  // Handle user input for chat mode only
  useInput((input, key) => {
    // Handle /exit command
    if (userInput + input === "/exit") {
      process.exit(0);
    }

    // Build up the input string
    if (input && !key.ctrl) {
      setState((prev) => ({
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

  const renderDownloadStatus = () => {
    switch (state.status) {
      case "started":
        return (
          <Box flexDirection="column">
            <Text color="green">🎥 Processing YouTube video...</Text>
            <Text>URL: {url}</Text>
            <Text> </Text>

            {state.status === "started" && (
              <SubtitlesSelection
                url={url}
                subtitleService={subtitleService}
                onSubtitleSelected={handleSubtitleSelected}
              />
            )}
          </Box>
        );
      case "subtitle-selected":
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

      case "subtitle-downloaded":
        if (state.downloadResult.success) {
          return (
            <Box flexDirection="column">
              <Text color="green">✅ Selected subtitle:</Text>
              <Text color="cyan">{state.selectedSubtitle.name}</Text>
              <Text> </Text>
              <Text color="green">📁 Download completed!</Text>
              <Text color="gray">File: {state.downloadResult.filePath}</Text>
            </Box>
          );
        } else {
          return (
            <Box flexDirection="column">
              <Text color="green">✅ Selected subtitle:</Text>
              <Text color="cyan">{state.selectedSubtitle.name}</Text>
              <Text> </Text>
              <Text color="red">❌ Download failed!</Text>
              <Text color="red">Error: {state.downloadResult.error}</Text>
            </Box>
          );
        }

      default:
        return null;
    }
  };

  return renderDownloadStatus();
};
