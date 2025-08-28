import React, { useState, useEffect, useMemo } from 'react'
import { Text, Box, useInput } from 'ink'
import { SubtitleLanguage, SubtitleService } from '../services/subtitle'
import { TerminalConstraints } from '../hooks/useTerminalConstraints.js'
import Spinner from 'ink-spinner'

interface SubtitlesSelectionProps {
  url: string
  subtitleService: SubtitleService
  onSubtitleSelected: (subtitle: SubtitleLanguage) => void
  terminalConstraints: TerminalConstraints
  onExit?: () => void
}

interface SubtitlesSelectionState {
  loading: boolean
  subtitles: SubtitleLanguage[]
  error: string | null
  selectedIndex: number
}

export const SubtitlesSelection: React.FC<SubtitlesSelectionProps> = ({
  url,
  subtitleService,
  onSubtitleSelected,
  terminalConstraints
}) => {
  const [state, setState] = useState<SubtitlesSelectionState>({
    loading: true,
    subtitles: [],
    error: null,
    selectedIndex: 0
  })

  // Calculate visible subtitles based on terminal height
  const { visibleSubtitles, scrollOffset } = useMemo(() => {
    const headerLines = 3 // Title + instruction lines
    const availableLines = terminalConstraints.maxChatHeight - headerLines
    const maxVisibleSubtitles = Math.max(3, availableLines)
    
    if (state.subtitles.length <= maxVisibleSubtitles) {
      return {
        visibleSubtitles: state.subtitles,
        scrollOffset: 0
      }
    }
    
    // Calculate scroll offset to keep selected item visible
    let offset = 0
    if (state.selectedIndex >= maxVisibleSubtitles) {
      offset = Math.min(
        state.selectedIndex - maxVisibleSubtitles + 1,
        state.subtitles.length - maxVisibleSubtitles
      )
    }
    
    return {
      visibleSubtitles: state.subtitles.slice(offset, offset + maxVisibleSubtitles),
      scrollOffset: offset
    }
  }, [state.subtitles, state.selectedIndex, terminalConstraints])

  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        const result = await subtitleService.getAvailableSubtitles(url)

        if (typeof result === 'string') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result,
            subtitles: []
          }))
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            subtitles: result,
            selectedIndex: 0
          }))
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
          subtitles: []
        }))
      }
    }

    fetchSubtitles()
  }, [url, subtitleService])

  useInput((input, key) => {
    // Only handle navigation if we have subtitles
    if (state.subtitles.length === 0) return

    if (key.upArrow) {
      setState(prev => ({
        ...prev,
        selectedIndex:
          prev.selectedIndex > 0
            ? prev.selectedIndex - 1
            : prev.subtitles.length - 1
      }))
    } else if (key.downArrow) {
      setState(prev => ({
        ...prev,
        selectedIndex:
          prev.selectedIndex < prev.subtitles.length - 1
            ? prev.selectedIndex + 1
            : 0
      }))
    } else if (key.return) {
      const selectedSubtitle = state.subtitles[state.selectedIndex]
      if (selectedSubtitle) {
        onSubtitleSelected(selectedSubtitle)
      }
    }
  })

  if (state.loading) {
    return (
      <Box 
        flexDirection="column" 
        width={terminalConstraints.maxChatWidth}
        overflow="hidden"
      >
        <Text color="yellow">
          <Spinner type="dots" /> Fetching available subtitles...
        </Text>
      </Box>
    )
  }

  if (state.error) {
    return (
      <Box 
        flexDirection="column" 
        width={terminalConstraints.maxChatWidth}
        overflow="hidden"
      >
        <Text color="red" wrap="wrap">❌ {state.error}</Text>
      </Box>
    )
  }

  if (state.subtitles.length === 0) {
    return (
      <Box 
        flexDirection="column" 
        width={terminalConstraints.maxChatWidth}
        overflow="hidden"
      >
        <Text color="yellow" wrap="wrap">📭 No subtitles available for this video</Text>
      </Box>
    )
  }

  return (
    <Box 
      flexDirection="column" 
      height={terminalConstraints.maxChatHeight}
      width={terminalConstraints.maxChatWidth}
      overflow="hidden"
    >
      <Text color="green">📝 Available subtitles:</Text>
      <Text color="gray">Use ↑↓ to navigate, Enter to select</Text>
      <Text> </Text>

      <Box flexDirection="column" flexGrow={1}>
        {scrollOffset > 0 && (
          <Box marginBottom={1}>
            <Text color="gray" dimColor>
              ↑ ... ({scrollOffset} more above)
            </Text>
          </Box>
        )}
        
        {visibleSubtitles.map((subtitle, visibleIndex) => {
          const actualIndex = scrollOffset + visibleIndex
          const isSelected = actualIndex === state.selectedIndex
          return (
            <Box key={subtitle.code}>
              <Text 
                color={isSelected ? 'cyan' : 'white'}
                wrap="truncate"
              >
                {isSelected ? '→ ' : '  '}
                {subtitle.code} - {subtitle.name} - {subtitle.type}
              </Text>
            </Box>
          )
        })}
        
        {scrollOffset + visibleSubtitles.length < state.subtitles.length && (
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              ↓ ... ({state.subtitles.length - scrollOffset - visibleSubtitles.length} more below)
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}
