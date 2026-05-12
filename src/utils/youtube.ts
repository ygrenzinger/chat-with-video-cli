const YOUTUBE_HOSTNAMES = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be'
])

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

function parseYouTubeUrl(url: string): URL {
  const normalizedUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)
    ? url
    : `https://${url}`

  return new URL(normalizedUrl)
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = parseYouTubeUrl(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    if (!YOUTUBE_HOSTNAMES.has(hostname)) {
      return null
    }

    if (hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0] ?? ''
      return YOUTUBE_VIDEO_ID_REGEX.test(videoId) ? videoId : null
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)

    if (pathSegments[0] === 'watch') {
      const videoId = parsedUrl.searchParams.get('v') ?? ''
      return YOUTUBE_VIDEO_ID_REGEX.test(videoId) ? videoId : null
    }

    if (['shorts', 'embed', 'live'].includes(pathSegments[0] ?? '')) {
      const videoId = pathSegments[1] ?? ''
      return YOUTUBE_VIDEO_ID_REGEX.test(videoId) ? videoId : null
    }

    return null
  } catch {
    return null
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null
}

export function createYouTubeTimestampUrl(
  videoUrl: string,
  seconds: number
): string | null {
  const videoId = extractYouTubeVideoId(videoUrl)

  if (!videoId) return null

  return `https://youtu.be/${videoId}?t=${Math.floor(seconds)}`
}

export function addYouTubeTimestampLinks(
  markdown: string,
  videoUrl: string
): string {
  const videoId = extractYouTubeVideoId(videoUrl)

  if (!videoId) return markdown

  return markdown.replace(
    /\((\d{1,2}:\d{2}(?::\d{2})?)\)/g,
    (match, timestamp: string, offset: number) => {
      const seconds = parseDisplayTimestamp(timestamp)

      if (seconds === null) return match

      const followingText = markdown.slice(offset + match.length).trimStart()
      if (followingText.startsWith('https://')) return match

      return `${match} https://youtu.be/${videoId}?t=${seconds}`
    }
  )
}

function parseDisplayTimestamp(timestamp: string): number | null {
  const parts = timestamp.split(':').map(part => Number.parseInt(part, 10))

  if (parts.some(Number.isNaN)) return null

  const [first, second, third] = parts

  if (third === undefined) {
    if (second >= 60) return null
    return first * 60 + second
  }

  if (second >= 60 || third >= 60) return null

  return first * 3600 + second * 60 + third
}
