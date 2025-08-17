import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { ChatWithVideo } from "./components/ChatWithVideo";
import { isValidYouTubeUrl } from "./utils/youtube";
import { YtdlpSubtitleService } from "./services/subtitle";

const program = new Command();

program
  .name("chat-with-video")
  .description("Chat with YouTube videos using AI")
  .version("1.0.0")
  .argument("<url>", "YouTube URL to process")
  .action(async (url: string) => {
    if (!isValidYouTubeUrl(url)) {
      console.error("Error: Please provide a valid YouTube URL");
      console.error("Examples:");
      console.error("  https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      console.error("  https://youtu.be/dQw4w9WgXcQ");
      process.exit(1);
    }

    const subtitleService = new YtdlpSubtitleService();

    const isAvailable = await subtitleService.isAvailable();
    if (!isAvailable) {
      console.error("Error: yt-dlp is not installed or not available in PATH");
      console.error("");
      console.error("To install yt-dlp:");
      console.error("  pip install yt-dlp");
      console.error("  # or");
      console.error("  brew install yt-dlp");
      console.error("  # or");
      console.error("  https://github.com/yt-dlp/yt-dlp#installation");
      process.exit(1);
    }

    render(React.createElement(ChatWithVideo, { url, subtitleService }));
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse();
