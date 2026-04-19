import { DebugLogQuery, IDebugLog } from './loggerDB'

let source: string = 'unknown'

export default {
  info: (text: string) => log('info', text, undefined),
  warn: (text: string, error?: Error) => log('warn', text, error ?? undefined),
  error: (text: string, error?: Error) => log('error', text, error ?? undefined),
  clear: () => clear(),
  get: () => {
    return get()
  },
  getLazy: (debugLogQuery: DebugLogQuery) => {
    return getLazy(debugLogQuery)
  },
  count: (debugLogQuery: DebugLogQuery) => {
    return count(debugLogQuery)
  },
  download: () => download(),
  getSources: () => getSources(),
  initDebugLog: (origin: string) => {
    source = origin
  },
  initMessageListener: () => init(),
}

const log = async (
  type: 'info' | 'warn' | 'error',
  text: string,
  error: Error | undefined = undefined,
  date: number = Date.now()
): Promise<void> => {
  const message: IDebugLog = {
    type: type,
    date: date,
    text: text,
    source: source,
    error: error ? error.toString() : '',
  }
  const logger = await getLogger()
  logger.log(message)
}

const clear = async () => {
  const logger = await getLogger()
  logger.clear()
}

const get = async () => {
  const logger = await getLogger()
  return logger.get()
}

const getLazy = async (debugLogQuery: DebugLogQuery) => {
  const logger = await getLogger()
  return logger.getLazy(debugLogQuery)
}

const count = async (debugLogQuery: DebugLogQuery) => {
  const logger = await getLogger()
  return logger.count(debugLogQuery)
}

const download = async () => {
  const logger = await getLogger()
  return logger.download()
}

const getSources = async () => {
  const logger = await getLogger()
  return logger.getSources()
}

const init = async () => {
  if (source === 'background') {
    const logger = await import('@/services/logger/debugLoggerBackground')
    logger.init()
  }
}

const getLogger = async () => {
  return source === 'background'
    ? import('@/services/logger/debugLoggerBackground')
    : import('@/services/logger/debugLoggerContent')
}
