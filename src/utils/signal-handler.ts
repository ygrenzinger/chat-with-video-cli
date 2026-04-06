const cleanupHandlers = new Set<() => void>()
let signalsRegistered = false
let runCleanup: (() => void) | undefined

function cleanupAndExit(): void {
  cleanupHandlers.forEach(handler => handler())
  process.stdout.write('\nGoodbye!\n')
  process.exit(0)
}

export function registerCleanupHandler(handler: () => void): void {
  cleanupHandlers.add(handler)

  if (!signalsRegistered) {
    signalsRegistered = true
    runCleanup = cleanupAndExit
    process.on('SIGINT', runCleanup)
    process.on('SIGTERM', runCleanup)
  }
}

export function resetForTesting(): void {
  cleanupHandlers.clear()

  if (signalsRegistered && runCleanup) {
    process.off('SIGINT', runCleanup)
    process.off('SIGTERM', runCleanup)
  }

  signalsRegistered = false
  runCleanup = undefined
}
