import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { convertSrtToTxt } from "./srt-converter";

describe("SRT Converter", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "srt-converter-test-"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should convert SRT content to plain text", () => {
    const srtContent = `1
00:00:00,080 --> 00:00:02,960
Is prompt engineering a thing 
you need to spend your time on?

2
00:00:02,960 --> 00:00:07,520
Studies have shown that using bad prompts 
can get you down to 0% on a problem,  

3
00:00:07,520 --> 00:00:12,160
and good prompts can boost you up to 90%. 
People will always be saying, "It's dead," or,  

4
00:00:12,160 --> 00:00:15,680
"It's going to be dead with the next model 
version," but then it comes out and it's not.

5
00:00:15,680 --> 00:00:18,800
What are a few techniques that you 
recommend people start implementing?`;

    const expectedText = `Is prompt engineering a thing
you need to spend your time on?
Studies have shown that using bad prompts
can get you down to 0% on a problem,
and good prompts can boost you up to 90%.
People will always be saying, "It's dead," or,
"It's going to be dead with the next model
version," but then it comes out and it's not.
What are a few techniques that you
recommend people start implementing?`;

    const inputPath = join(tempDir, "test.srt");
    const expectedOutputPath = join(tempDir, "test.txt");
    
    writeFileSync(inputPath, srtContent);

    const result = convertSrtToTxt(inputPath);

    expect(result).toBe(expectedOutputPath);
    expect(existsSync(expectedOutputPath)).toBe(true);
    expect(readFileSync(expectedOutputPath, "utf-8")).toBe(expectedText);
  });

  it("should generate correct output path", () => {
    const srtContent = "1\n00:00:00,000 --> 00:00:01,000\nTest";
    const inputPath = join(tempDir, "input.srt");
    const expectedOutputPath = join(tempDir, "input.txt");
    
    writeFileSync(inputPath, srtContent);

    const result = convertSrtToTxt(inputPath);

    expect(result).toBe(expectedOutputPath);
    expect(existsSync(expectedOutputPath)).toBe(true);
  });

  it("should handle empty lines correctly", () => {
    const srtContent = `1
00:00:00,000 --> 00:00:01,000
First line

2
00:00:01,000 --> 00:00:02,000
Second line`;

    const inputPath = join(tempDir, "test.srt");
    const expectedOutputPath = join(tempDir, "test.txt");
    
    writeFileSync(inputPath, srtContent);

    convertSrtToTxt(inputPath);

    expect(existsSync(expectedOutputPath)).toBe(true);
    expect(readFileSync(expectedOutputPath, "utf-8")).toBe("First line\nSecond line");
  });
});