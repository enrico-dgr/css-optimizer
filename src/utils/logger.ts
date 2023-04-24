const logger = {
  // default
  log: (...args: any) => console.log(...args),
  // red
  error: (...args: any) => console.log('\x1b[31m%s\x1b[0m', ...args),
  // green
  success: (...args: any) => console.log('\x1b[32m%s\x1b[0m', ...args),
  // yellow
  warning: (...args: any) => console.log('\x1b[33m%s\x1b[0m', ...args),
  // blue
  debug: (...args: any) => console.log('\x1b[34m%s\x1b[0m', ...args),
  // magenta
  infoStrong: (...args: any) => console.log('\x1b[35m%s\x1b[0m', ...args),
  // cyan
  infoWeak: (...args: any) => console.log('\x1b[36m%s\x1b[0m', ...args),
  onLeft: (e: Error) => {
    // Remove first line
    const stack = e.stack?.replace(/^[^\n]*\n/, '') ?? ''

    logger.error(`Error: ${e.message}`, `\n${stack}`)
  }
}

export default logger;
