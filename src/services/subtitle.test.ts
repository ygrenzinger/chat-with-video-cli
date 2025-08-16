import { describe, it, expect, vi, beforeEach } from "vitest";
import { YtdlpSubtitleService } from "./subtitle.js";
import { execSync } from "child_process";

vi.mock("child_process");

describe("VideoSubtitleService", () => {
  let service: YtdlpSubtitleService;
  const mockExecSync = vi.mocked(execSync);

  beforeEach(() => {
    service = new YtdlpSubtitleService();
    vi.clearAllMocks();
  });

  describe("isAvailable", () => {
    it("should return true when yt-dlp is available", async () => {
      mockExecSync.mockReturnValue("yt-dlp 2023.07.06");

      const result = await service.isAvailable();

      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith("yt-dlp --version", {
        stdio: "pipe",
      });
    });

    it("should return false when yt-dlp is not available", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe("getAvailableSubtitles", () => {
    it("should return no subtitles message when video has no subtitles", async () => {
      const output = "[info] Video has no subtitles";
      mockExecSync.mockReturnValue(output);

      const result = await service.getAvailableSubtitles(
        "https://youtube.com/watch?v=test"
      );

      expect(result).toBe("This video has no subtitles");
    });

    it("should parse and return available subtitles", async () => {
      const output = `[info] Available subtitles for eKuFqQKYRrA:
Language Name                    Formats
en-US    English (United States) vtt, srt, ttml, srv3, srv2, srv1, json3
fr       French                  vtt, srt`;
      mockExecSync.mockReturnValue(output);

      const result = await service.getAvailableSubtitles(
        "https://youtube.com/watch?v=test"
      );

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          code: "en-US",
          name: "English (United States)",
          formats: ["vtt", "srt", "ttml", "srv3", "srv2", "srv1", "json3"],
        });
        expect(result[1]).toEqual({
          code: "fr",
          name: "French",
          formats: ["vtt", "srt"],
        });
      }
    });

    it("should handle execution errors", async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Network error");
      });

      await expect(
        service.getAvailableSubtitles("https://youtube.com/watch?v=test")
      ).rejects.toThrow("Failed to get subtitles: Network error");
    });
  });
});
