import { describe, it, expect } from "vitest";
import { convertVttToTxt } from "./vtt-converter.js";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";

describe("convertVttToTxt", () => {
  it("should extract text content from VTT file and save to TXT file", () => {
    const testVttPath = "test-original.vtt";
    const expectedOutputPath = "test-cleaned.txt";

    const sampleVttContent = `WEBVTT
Kind: captions
Language: en-US

00:00:00.080 --> 00:00:02.960
Is prompt engineering a thing&nbsp;
you need to spend your time on?

00:00:02.960 --> 00:00:07.520
Studies have shown that using bad prompts&nbsp;
can get you down to 0% on a problem,&nbsp;&nbsp;

00:00:07.520 --> 00:00:12.160
and good prompts can boost you up to 90%.&nbsp;
People will always be saying, "It's dead," or,&nbsp;&nbsp;

00:00:12.160 --> 00:00:15.680
"It's going to be dead with the next model&nbsp;
version," but then it comes out and it's not.`;

    const expectedTxtContent = `Is prompt engineering a thing&nbsp;
you need to spend your time on?
Studies have shown that using bad prompts&nbsp;
can get you down to 0% on a problem,&nbsp;&nbsp;
and good prompts can boost you up to 90%.&nbsp;
People will always be saying, "It's dead," or,&nbsp;&nbsp;
"It's going to be dead with the next model&nbsp;
version," but then it comes out and it's not.`;

    writeFileSync(testVttPath, sampleVttContent);
    const result = convertVttToTxt(testVttPath);

    expect(result).toBe(expectedOutputPath);
    expect(existsSync(expectedOutputPath)).toBe(true);

    const actualContent = readFileSync(expectedOutputPath, "utf-8");
    expect(actualContent).toBe(expectedTxtContent);

    if (existsSync(testVttPath)) {
      unlinkSync(testVttPath);
    }
    if (existsSync(expectedOutputPath)) {
      unlinkSync(expectedOutputPath);
    }
  });
});
