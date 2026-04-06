import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { registerCleanupHandler, resetForTesting } from './signal-handler.js'

describe('signal-handler', () => {
  const originalWrite = process.stdout.write

  beforeEach(() => {
    resetForTesting()
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    resetForTesting()
    vi.restoreAllMocks()
    process.stdout.write = originalWrite
  })

  it('stores the handler and calls it when SIGINT fires', () => {
    const handler = vi.fn()
    registerCleanupHandler(handler)

    try {
      process.emit('SIGINT')
    } catch (error) {
      expect((error as Error).message).toBe('process.exit called')
    }

    expect(handler).toHaveBeenCalledTimes(1)
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('runs multiple handlers when the signal fires', () => {
    const first = vi.fn()
    const second = vi.fn()

    registerCleanupHandler(first)
    registerCleanupHandler(second)

    try {
      process.emit('SIGTERM')
    } catch (error) {
      expect((error as Error).message).toBe('process.exit called')
    }

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(process.stdout.write).toHaveBeenCalledWith('\nGoodbye!\n')
  })
})
