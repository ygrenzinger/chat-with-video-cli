import { readFileSync, writeFileSync } from 'fs'

export function convertSrtToTxt(inputPath: string): string {
  console.log(`Converting ${inputPath} to TXT format...`)
  const srtContent = readFileSync(inputPath, 'utf-8')
  const textContent = extractTextFromSrt(srtContent)

  const outputPath = generateOutputPath(inputPath)
  writeFileSync(outputPath, textContent)

  return outputPath
}

function generateOutputPath(inputPath: string): string {
  const baseName = inputPath.replace('.srt', '')
  return `${baseName}.txt`
}

function extractTextFromSrt(srtContent: string): string {
  const lines = srtContent.split('\n')
  const textLines: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine === '') {
      continue
    }

    if (isSequenceNumber(trimmedLine)) {
      continue
    }

    if (isTimestampLine(trimmedLine)) {
      continue
    }

    textLines.push(trimmedLine)
  }

  return textLines.join('\n')
}

function isSequenceNumber(line: string): boolean {
  return /^\d+$/.test(line)
}

function isTimestampLine(line: string): boolean {
  return line.includes('-->')
}
