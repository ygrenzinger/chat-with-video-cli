import { describe, it, expect, vi, beforeEach } from "vitest";
import { YtdlpSubtitleService } from "./yt-dlp-subtitle.js";
import { execAsync } from "../utils/exec-async.js";
import { writeFileSync} from "fs";
import {join} from "path";
import {tmpdir} from "os";

vi.mock("../utils/exec-async");

describe("YT DLP subtitle service", () => {
    let service: YtdlpSubtitleService;
    const mockExecAsync = vi.mocked(execAsync);

    beforeEach(() => {
        service = new YtdlpSubtitleService();
        vi.clearAllMocks();
    });

    describe("isAvailable", () => {
        it("should return true when yt-dlp is available", async () => {
            mockExecAsync.mockResolvedValue({
                stdout: "yt-dlp 2023.07.06",
                stderr: "",
            });

            const result = await service.isAvailable();

            expect(result).toBe(true);
            expect(mockExecAsync).toHaveBeenCalledWith("yt-dlp --version");
        });

        it("should return false when yt-dlp is not available", async () => {
            mockExecAsync.mockImplementation(() => {
                throw new Error("Command not found");
            });

            const result = await service.isAvailable();

            expect(result).toBe(false);
        });
    });

    describe("getAvailableSubtitles", () => {
        it("should return no subtitles message when video has no subtitles", async () => {
            const output = "[info] Video has no subtitles";
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const result = await service.getAvailableSubtitles(
                "https://youtube.com/watch?v=test"
            );

            expect(result).toBe("No subtitle information found");
        });

        it("should parse and return available subtitles", async () => {
            const output = `[info] Available subtitles for eKuFqQKYRrA:
Language Name                    Formats
en-US    English (United States) vtt, srt, ttml, srv3, srv2, srv1, json3
fr       French                  vtt, srt`;
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const result = await service.getAvailableSubtitles(
                "https://youtube.com/watch?v=test"
            );

            expect(Array.isArray(result)).toBe(true);
            if (Array.isArray(result)) {
                expect(result).toHaveLength(2);
                expect(result[0]).toEqual({
                    code: "en-US",
                    name: "English (United States)",
                    type: "uploaded",
                });
                expect(result[1]).toEqual({
                    code: "fr",
                    name: "French",
                    type: "uploaded",
                });
            }
        });

        it("should handle execution errors", async () => {
            mockExecAsync.mockImplementation(() => {
                throw new Error("Network error");
            });

            await expect(
                service.getAvailableSubtitles("https://youtube.com/watch?v=test")
            ).rejects.toThrow("Failed to get subtitles: Network error");
        });
    });

    describe("downloadSubtitle", () => {
        it("should download uploaded subtitle using --write-sub", async () => {
            const output =
                "[download] Destination: AI prompt engineering in 2025： What works and what doesn’t ｜ Sander Schulhoff [eKuFqQKYRrA].en-US.srt";
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const subtitle = {
                code: "en-US",
                name: "English",
                type: "uploaded" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.downloadSubtitle(url, subtitle);

            expect(result).toEqual({
                success: true,
                filePath:
                    "AI prompt engineering in 2025： What works and what doesn’t ｜ Sander Schulhoff [eKuFqQKYRrA].en-US.srt",
            });
            expect(mockExecAsync).toHaveBeenCalledWith(
                'yt-dlp --write-sub --sub-lang en-US --sub-format srt --skip-download "https://youtube.com/watch?v=test"',
                { encoding: "utf8" }
            );
        });

        it("should download auto subtitle using --write-auto-sub", async () => {
            const output = "[download] Destination: test.srt";
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const subtitle = {
                code: "fr-orig",
                name: "French",
                type: "auto" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.downloadSubtitle(url, subtitle);

            expect(result).toEqual({
                success: true,
                filePath: expect.stringContaining(".srt"),
            });
            expect(mockExecAsync).toHaveBeenCalledWith(
                'yt-dlp --write-auto-sub --sub-lang fr-orig --sub-format srt --skip-download "https://youtube.com/watch?v=test"',
                { encoding: "utf8" }
            );
        });

        it("should handle download errors", async () => {
            mockExecAsync.mockImplementation(() => {
                throw new Error("Network error");
            });

            const subtitle = {
                code: "en-US",
                name: "English",
                type: "uploaded" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.downloadSubtitle(url, subtitle);

            expect(result).toEqual({
                success: false,
                error: "Failed to download subtitle: Network error",
            });
        });

        it("should handle download command failure", async () => {
            const output = "[error] Unable to download subtitle";
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const subtitle = {
                code: "en-US",
                name: "English",
                type: "uploaded" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.downloadSubtitle(url, subtitle);

            expect(result).toEqual({
                success: false,
                error: "Download failed: unable to download subtitle",
            });
        });
    });

    describe("downloadAndTransformToRawText", () => {
        it("should download subtitle and convert to raw text", async () => {

            const path = join(tmpdir(), "test.srt");
            writeFileSync(path, `1
00:00:00,080 --> 00:00:02,960
Is prompt engineering a thing you need to spend your time on?`);

            const output = `[download] Destination: ${path}`;
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const subtitle = {
                code: "en-US",
                name: "English",
                type: "uploaded" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.retrieveRawText(url, subtitle);

            expect(result).toEqual({  "content": "Is prompt engineering a thing you need to spend your time on?",
                "success": true,
            });
        });

        it("should return download error if download fails", async () => {
            mockExecAsync.mockImplementation(() => {
                throw new Error("Network error");
            });

            const subtitle = {
                code: "en-US",
                name: "English",
                type: "uploaded" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.retrieveRawText(url, subtitle);

            expect(result).toEqual({
                success: false,
                error: "Failed to download subtitle: Network error",
            });
        });

        it("should handle conversion errors", async () => {
            const output = "[download] Destination: test.srt";
            mockExecAsync.mockResolvedValue({
                stdout: output,
                stderr: "",
            });

            const subtitle = {
                code: "en-US",
                name: "English",
                type: "uploaded" as const,
            };
            const url = "https://youtube.com/watch?v=test";

            const result = await service.retrieveRawText(url, subtitle);

            expect(result).toEqual({
                success: false,
                error: "Failed to transform SRT to text: ENOENT: no such file or directory, open 'test.srt'",
            });
        });
    });
});
