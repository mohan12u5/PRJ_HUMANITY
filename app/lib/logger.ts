import 'server-only';

type LogLevel = 'info' | 'warn' | 'error';

function write(level: LogLevel, context: string, details?: unknown) {
  const entry = {
    level,
    context,
    timestamp: new Date().toISOString(),
    details: details instanceof Error ? { message: details.message, stack: details.stack } : details
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (context: string, details?: unknown) => write('info', context, details),
  warn: (context: string, details?: unknown) => write('warn', context, details),
  error: (context: string, details?: unknown) => write('error', context, details)
};
