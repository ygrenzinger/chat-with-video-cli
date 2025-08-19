import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync } from "fs";
import { convertSrtToTxt } from "./srt-converter";

vi.mock("fs");

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe("SRT Converter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    mockReadFileSync.mockReturnValue(srtContent);

    const result = convertSrtToTxt("test.srt");

    expect(mockReadFileSync).toHaveBeenCalledWith("test.srt", "utf-8");
    expect(mockWriteFileSync).toHaveBeenCalledWith("test.txt", expectedText);
    expect(result).toBe("test.txt");
  });

  it("should generate correct output path", () => {
    mockReadFileSync.mockReturnValue("1\n00:00:00,000 --> 00:00:01,000\nTest");

    const result = convertSrtToTxt("input.srt");

    expect(result).toBe("input.txt");
  });

  it("should handle empty lines correctly", () => {
    const srtContent = `1
00:00:00,000 --> 00:00:01,000
First line

2
00:00:01,000 --> 00:00:02,000
Second line`;

    mockReadFileSync.mockReturnValue(srtContent);

    convertSrtToTxt("test.srt");

    expect(mockWriteFileSync).toHaveBeenCalledWith("test.txt", "First line\nSecond line");
  });
});