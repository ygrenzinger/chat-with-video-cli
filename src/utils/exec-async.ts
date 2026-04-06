import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFilePromise = promisify(execFile)

type ExecFileAsyncOptions = {
  maxBuffer?: number
  encoding?: string
}

export async function execFileAsync(
  command: string,
  args: string[],
  options?: ExecFileAsyncOptions
): Promise<{ stdout: string; stderr: string }> {
  return execFilePromise(command, args, {
    maxBuffer: 10 * 1024 * 1024,
    encoding: 'utf8',
    ...options
  }) as Promise<{ stdout: string; stderr: string }>
}
