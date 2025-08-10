import { IDebugLog } from './loggerDB'

let source: string = 'unknown'

export default {
  info: (text: string) => log('info', text, undefined),
  warn: (text: string, error?: Error) => log('warn', text, error ?? undefined),
  error: (text: string, error?: Error) => log('error', text, error ?? undefined),
  clear: () => clear(),
  get: () => {
    return get()
  },
  initDebugLog: (origin: string) => {
    source = origin
  },
  initMessageListener: () => init(),
}

const log = (
  type: 'info' | 'warn' | 'error',
  text: string,
  error: Error | undefined = undefined,
  date: number = Date.now()
): void => {
  const message: IDebugLog = {
    type: type,
    date: date,
    text: text,
    source: source,
    error: error ? error.toString() : '',
  }
  if (source === 'background') {
    import('@/services/logger/debugLoggerBackground').then((logger) => logger.log(message))
    return
  } else {
    import('@/services/logger/debugLoggerContent').then((logger) => logger.log(message))
    return
  }
}

const clear = () => {
  if (source === 'background') {
    import('@/services/logger/debugLoggerBackground').then((logger) => logger.clear())
    return
  } else {
    import('@/services/logger/debugLoggerContent').then((logger) => logger.clear())
    return
  }
}

const get = () => {
  if (source === 'background') {
    return import('@/services/logger/debugLoggerBackground').then((logger) => logger.get())
  } else {
    return import('@/services/logger/debugLoggerContent').then((logger) => logger.get())
  }
}

const init = () => {
  if (source === 'background') {
    import('@/services/logger/debugLoggerBackground').then((logger) => logger.init())
    return
  }
}
