import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, beforeAll } from 'vitest'
import { ChatService } from './chat.service.js'
import { ModelSelectionService } from './model-selection.service.js'
import { addYouTubeTimestampLinks } from '../utils/youtube.js'

const RUN_LLM_JUDGE_TESTS = process.env.RUN_LLM_JUDGE_TESTS === 'true'
const VIDEO_ID = 'RjfbvDXpFls'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const SRT_FILE = 'building-pi-in-a-world-of-slop-mario-zechner.srt'
function createSearchPrompt(phrase: string): string {
  return `Search the transcript for the exact substring "${phrase}" inside the SRT cue text.

Return only the start timestamp from the timing line immediately above the cue text that contains the substring, in parenthesized (MM:SS) format. Use the timestamp on the left side of the --> arrow. Drop milliseconds without rounding up. Never use the timestamp on the right side of the arrow or the next cue's timestamp.`
}

type SrtCue = {
  index: number
  startSeconds: number
  endSeconds: number
  text: string
}

type TimestampCitation = {
  rawUrl: string
  videoId: string | null
  seconds: number | null
  timestampParamCount: number
}

const describeIntegration = RUN_LLM_JUDGE_TESTS ? describe : describe.skip

describeIntegration('ChatService timestamp search integration', () => {
  beforeAll(() => {
    if (!ModelSelectionService.detectAvailableProvider()) {
      throw new Error(
        'At least one chat model API key is required when RUN_LLM_JUDGE_TESTS=true'
      )
    }
  })

  it('returns the timestamp for the exact discipline and agency phrase', async () => {
    await expectExactPhraseTimestamp({
      phrase: 'discipline and agency',
      expectedStartSeconds: 1082.7,
      expectedTimestamp: '(18:02)',
      expectedLinkSeconds: 1082
    })
  }, 180_000)

  it('returns the timestamp for the exact long context windows are a hack phrase', async () => {
    await expectExactPhraseTimestamp({
      phrase: 'long context windows are a hack',
      expectedStartSeconds: 946.5,
      expectedTimestamp: '(15:46)',
      expectedLinkSeconds: 946
    })
  }, 180_000)
})

async function expectExactPhraseTimestamp({
  phrase,
  expectedStartSeconds,
  expectedTimestamp,
  expectedLinkSeconds
}: {
  phrase: string
  expectedStartSeconds: number
  expectedTimestamp: string
  expectedLinkSeconds: number
}): Promise<void> {
  const transcript = await readFile(join(process.cwd(), SRT_FILE), 'utf8')
  const cues = parseSrt(transcript)
  const matchingCue = cues.find(cue =>
    cue.text.toLowerCase().includes(phrase.toLowerCase())
  )
  const chatService = new ChatService(
    VIDEO_URL,
    transcript,
    ModelSelectionService.selectModel()
  )

  let answer = ''
  for await (const chunk of chatService.sendMessage(
    createSearchPrompt(phrase)
  )) {
    answer += chunk
  }

  expect(answer.trim().length).toBeGreaterThan(0)
  expect(matchingCue, formatAnswerFailure(answer, [])).toMatchObject({
    startSeconds: expectedStartSeconds
  })
  expect(answer, formatAnswerFailure(answer, [])).toContain(expectedTimestamp)

  const displayAnswer = addYouTubeTimestampLinks(answer, VIDEO_URL)
  const citations = extractTimestampCitations(displayAnswer)

  expect(citations).toHaveLength(1)
  expect(citations[0], formatAnswerFailure(displayAnswer, citations)).toEqual({
    rawUrl: `https://youtu.be/${VIDEO_ID}?t=${expectedLinkSeconds}`,
    videoId: VIDEO_ID,
    seconds: expectedLinkSeconds,
    timestampParamCount: 1
  })
}

function parseSrt(srt: string): SrtCue[] {
  return srt
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map(parseSrtBlock)
    .filter((cue): cue is SrtCue => cue !== null)
}

function parseSrtBlock(block: string): SrtCue | null {
  const lines = block.split(/\r?\n/)
  const timeLineIndex = lines.findIndex(line => line.includes('-->'))

  if (timeLineIndex === -1) return null

  const timeMatch = lines[timeLineIndex].match(
    /(\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})/
  )

  if (!timeMatch) return null

  const index = Number.parseInt(lines[0] ?? '', 10)
  const text = lines
    .slice(timeLineIndex + 1)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return null

  return {
    index: Number.isNaN(index) ? 0 : index,
    startSeconds: parseSrtTimestamp(timeMatch[1]),
    endSeconds: parseSrtTimestamp(timeMatch[2]),
    text
  }
}

function parseSrtTimestamp(timestamp: string): number {
  const [hours, minutes, secondsWithMilliseconds] = timestamp.split(':')
  const [seconds, milliseconds] = secondsWithMilliseconds.split(',')

  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10) +
    Number.parseInt(milliseconds, 10) / 1000
  )
}

function extractTimestampCitations(answer: string): TimestampCitation[] {
  const urls = [...new Set(answer.match(/https?:\/\/[^\s)\]]+/g) ?? [])]

  return urls.map(rawUrl => {
    const sanitizedUrl = rawUrl.replace(/[\].,;:!?]+$/, '')
    const url = new URL(sanitizedUrl)
    const timestampParam = url.searchParams.get('t')

    return {
      rawUrl: sanitizedUrl,
      videoId: getYouTubeVideoId(url),
      seconds: timestampParam?.match(/^\d+$/)
        ? Number.parseInt(timestampParam, 10)
        : null,
      timestampParamCount: sanitizedUrl.match(/[?&]t=/g)?.length ?? 0
    }
  })
}

function getYouTubeVideoId(url: URL): string | null {
  if (url.hostname === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }

  if (url.hostname.endsWith('youtube.com')) {
    return url.searchParams.get('v')
  }

  return null
}

function formatAnswerFailure(
  answer: string,
  citations: TimestampCitation[]
): string {
  return JSON.stringify(
    {
      answer,
      parsedCitations: citations.map(citation => ({
        rawUrl: citation.rawUrl,
        videoId: citation.videoId,
        seconds: citation.seconds,
        timestampParamCount: citation.timestampParamCount
      }))
    },
    null,
    2
  )
}
