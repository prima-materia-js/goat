import Logger, { LogLevel } from '../utils/Logger';

describe('Logger', () => {
  let consoleLog: jest.SpyInstance;
  let loggedText = '';

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation((str) => {
      loggedText = str;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('handles error minimum log level correctly', () => {
    Logger.initializeLogging(LogLevel.Error);

    Logger.debug('hello world');
    Logger.info('hello world');
    Logger.warn('hello world');
    Logger.error('hello world');

    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  test('handles warn minimum log level correctly', () => {
    Logger.initializeLogging(LogLevel.Warn);

    Logger.debug('hello world');
    Logger.info('hello world');
    Logger.warn('hello world');
    Logger.error('hello world');

    expect(consoleLog).toHaveBeenCalledTimes(2);
  });

  test('handles info minimum log level correctly', () => {
    Logger.initializeLogging(LogLevel.Info);

    Logger.debug('hello world');
    Logger.info('hello world');
    Logger.warn('hello world');
    Logger.error('hello world');

    expect(consoleLog).toHaveBeenCalledTimes(3);
  });

  test('handles debug minimum log level correctly', () => {
    Logger.initializeLogging(LogLevel.Debug);

    Logger.debug('hello world');
    Logger.info('hello world');
    Logger.warn('hello world');
    Logger.error('hello world');

    expect(consoleLog).toHaveBeenCalledTimes(4);
  });

  test('prefixes log level when logging', () => {
    Logger.initializeLogging(LogLevel.Debug);

    Logger.debug('hello world');
    expect(loggedText).toContain('[DEBUG]');
    Logger.info('hello world');
    expect(loggedText).toContain('[INFO]');
    Logger.warn('hello world');
    expect(loggedText).toContain('[WARN]');
    Logger.error('hello world');
    expect(loggedText).toContain('[ERR]');
  });
});
