import { readFileSync, writeFileSync } from 'fs';

export function convertVttToTxt(inputPath: string): string {
  const vttContent = readFileSync(inputPath, 'utf-8');
  const textContent = extractTextFromVtt(vttContent);
  
  const outputPath = generateOutputPath(inputPath);
  writeFileSync(outputPath, textContent);
  
  return outputPath;
}

function generateOutputPath(inputPath: string): string {
  const baseName = inputPath.replace('.vtt', '');
  return `${baseName.replace('original', 'cleaned')}.txt`;
}

function extractTextFromVtt(vttContent: string): string {
  const lines = vttContent.split('\n');
  const textLines: string[] = [];
  
  let isInTextBlock = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      isInTextBlock = false;
      continue;
    }
    
    if (isTimestampLine(trimmedLine)) {
      isInTextBlock = true;
      continue;
    }
    
    if (isInTextBlock && !isHeaderLine(trimmedLine)) {
      textLines.push(trimmedLine);
    }
  }
  
  return textLines.join('\n');
}

function isTimestampLine(line: string): boolean {
  return line.includes('-->');
}

function isHeaderLine(line: string): boolean {
  const headerPrefixes = ['WEBVTT', 'Kind:', 'Language:'];
  return headerPrefixes.some(prefix => line.startsWith(prefix));
}
