export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

const log = (prefix: string, message: string, ...params: any[]) => {
  console.log(`${prefix}\t${message}`, ...params);
};

const colorText = (
  str: string,
  color: 'red' | 'yellow' | 'blue' | 'grey'
): string => {
  const colors: { [key: string]: string } = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    grey: '\x1b[90m',
  };

  const reset = '\x1b[0m';
  const selectedColor = colors[color];
  return `${selectedColor}${str}${reset}`;
};

type LogFunction = (message: string, ...params: any[]) => void;

const noop: LogFunction = () => {};

class Logger {
  static initializeLogging(minimumLogLevel: LogLevel) {
    Logger.error = (message: string, ...params: any[]) => {
      log(colorText('[ERR]', 'red'), message, ...params);
    };

    if (minimumLogLevel <= LogLevel.Warn) {
      Logger.warn = (message: string, ...params: any[]) => {
        log(colorText('[WARN]', 'yellow'), message, ...params);
      };
    }

    if (minimumLogLevel <= LogLevel.Info) {
      Logger.info = (message: string, ...params: any[]) => {
        log(colorText('[INFO]', 'blue'), message, ...params);
      };
    }

    if (minimumLogLevel <= LogLevel.Debug) {
      Logger.debug = (message: string, ...params: any[]) => {
        log(colorText('[DEBUG]', 'grey'), message, ...params);
      };
    }
  }

  static debug: LogFunction = noop;
  static info: LogFunction = noop;
  static warn: LogFunction = noop;
  static error: LogFunction = noop;
}

export default Logger;
