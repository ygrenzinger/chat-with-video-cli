import fs from 'fs/promises'
import path from 'path'

const currentDirectory = process.cwd()

export class Logger {
  private static logDir = `${currentDirectory}/logs`
  private static logFile = 'chat.log'

  static async log(message: string, data?: any): Promise<void> {
    try {
      await this.ensureLogDirectory()
      const timestamp = new Date().toISOString()
      const logEntry = data
        ? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}\n`
        : `[${timestamp}] ${message}\n`

      const logPath = path.join(this.logDir, this.logFile)
      await fs.appendFile(logPath, logEntry)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  private static async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logDir)
    } catch {
      await fs.mkdir(this.logDir, { recursive: true })
    }
  }
}
