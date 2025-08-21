import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { ChatWithVideo } from "./components/ChatWithVideo.js";
import { isValidYouTubeUrl } from "./utils/youtube.js";
import { validateEnvironment } from "./utils/env.js";
import {YtdlpSubtitleService} from "./services/yt-dlp-subtitle";

const program = new Command();

export const start = () => {


// Validate environment on startup
    try {
        validateEnvironment();
    } catch (error) {
        console.error("❌ Environment setup error:");
        console.error(error instanceof Error ? error.message : "Unknown error");
        console.error("");
        console.error("Please ensure you have set up your environment variables:");
        console.error("1. Copy .env.example to .env");
        console.error("2. Add your ANTHROPIC_API_KEY to the .env file");
        console.error("3. Get your API key from: https://console.anthropic.com/");
        process.exit(1);
    }

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
}

start()
