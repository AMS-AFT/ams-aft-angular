import { RetryBackoff } from './retry-backoff.function';
import { PartialRetryBackoffResult, RetryBackoffResult } from './retry-backoff.types';

type TCtx = { a: number };
const context: TCtx = { a: 1 };
const count = 1;
const error = new Error();
const base = 300;
const maxRetries = 5;
const delay = base;
const date = new Date('Sun, 1 Jan 2023 12:00:00 GMT');

const defaultResult = {
  base,
  count,
  error,
  maxRetries,
  delay
};

const fullConfig = {
  count,
  error,
  context,
  maxDelay: 10000,
  startTime: date.getTime() - 1,
  maxTime: 10000
};

describe('RetryBackoff', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(Date, 'now').mockReturnValue(date.getTime());
  });

  it(`returns default values`, () => {
    expect(RetryBackoff({ count, error })).toEqual(defaultResult);
    expect(RetryBackoff({ count: 2, error })).toEqual({ ...defaultResult, count: 2, delay: 600 });
    expect(RetryBackoff({ count: 3, error })).toEqual({ ...defaultResult, count: 3, delay: 1200 });
    expect(RetryBackoff({ count: 4, error })).toEqual({ ...defaultResult, count: 4, delay: 2400 });
    expect(RetryBackoff({ count: 5, error })).toEqual({ ...defaultResult, count: 5, delay: 4800 });
    expect(() => RetryBackoff({ count: 6, error })).toThrowError(error);
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(RetryBackoff({ count, error })).toEqual({ ...defaultResult, base: 500, delay: 500 });
    expect(RetryBackoff({ count: 2, error })).toEqual({ ...defaultResult, count: 2, base: 500, delay: 1000 });
    expect(RetryBackoff({ count: 3, error })).toEqual({ ...defaultResult, count: 3, base: 500, delay: 2000 });
    expect(RetryBackoff({ count: 4, error })).toEqual({ ...defaultResult, count: 4, base: 500, delay: 4000 });
    expect(RetryBackoff({ count: 5, error })).toEqual({ ...defaultResult, count: 5, base: 500, delay: 8000 });
    expect(() => RetryBackoff({ count: 6, error })).toThrowError(error);
  });

  // context

  it(`returns context`, () => {
    expect(RetryBackoff({ count, error, context }).context).toEqual(context);
  });

  // error

  it(`returns error`, () => {
    expect(RetryBackoff({ count, error }).error).toEqual(error);
  });

  // count

  it(`returns count`, () => {
    expect(RetryBackoff({ count, error }).count).toEqual(1);
  });

  it(`returns count from () => count`, () => {
    expect(RetryBackoff({ count: () => 5, error }).count).toEqual(5);
  });

  it(`returns count from ({ context, error }) => count`, () => {
    const count = (c: any) => (exposesContextError(c) ? 5 : 0);
    expect(RetryBackoff({ count, error, context }).count).toEqual(5);
  });

  it(`returns count rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count: 1.1, error }).count).toEqual(1);
    expect(RetryBackoff({ count: 1.9, error }).count).toEqual(2);
  });

  it(`throws error if count <= 0`, () => {
    expect(() => RetryBackoff({ count: 0, error })).toThrowError(error);
    expect(() => RetryBackoff({ count: -1, error })).toThrowError(error);
  });

  // maxRetries

  it(`returns maxRetries`, () => {
    expect(RetryBackoff({ count, error, maxRetries: 1 }).maxRetries).toEqual(1);
  });

  it(`returns maxRetries from () => maxRetries`, () => {
    expect(RetryBackoff({ count, error, maxRetries: () => 5 }).maxRetries).toEqual(5);
  });

  it(`returns maxRetries from ({ context, error }) => maxRetries`, () => {
    const maxRetries = (c: any) => (exposesContextError(c) ? 5 : 0);
    expect(RetryBackoff({ count, error, context, maxRetries }).maxRetries).toEqual(5);
  });

  it(`returns maxRetries defaulting to 5`, () => {
    expect(RetryBackoff({ count, error }).maxRetries).toEqual(5);
  });

  it(`returns maxRetries rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count, error, maxRetries: 1.1 }).maxRetries).toEqual(1);
    expect(RetryBackoff({ count, error, maxRetries: 1.9 }).maxRetries).toEqual(2);
  });

  it(`throws error if maxRetries <= 0`, () => {
    expect(() => RetryBackoff({ count, error, maxRetries: 0 })).toThrowError(error);
    expect(() => RetryBackoff({ count, error, maxRetries: -1 })).toThrowError(error);
  });

  it(`throws error if maxRetries < count `, () => {
    expect(() => RetryBackoff({ maxRetries: 1, count: 2, error })).toThrowError(error);
  });

  // base

  it(`returns base`, () => {
    expect(RetryBackoff({ count, error, base: 1 }).base).toEqual(1);
  });

  it(`returns base from () => base`, () => {
    expect(RetryBackoff({ count, error, base: () => 5 }).base).toEqual(5);
  });

  it(`returns base from ({ context, error }) => base`, () => {
    const base = (c: any) => (exposesContextError(c) ? 5 : 0);
    expect(RetryBackoff({ count, error, context, base }).base).toEqual(5);
  });

  it(`returns base defaulting to random integer between 300 and 500`, () => {
    expect(RetryBackoff({ count, error }).base).toEqual(300);
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(RetryBackoff({ count, error }).base).toEqual(500);
  });

  it(`returns base rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count, error, base: 1.1 }).base).toEqual(1);
    expect(RetryBackoff({ count, error, base: 1.9 }).base).toEqual(2);
  });

  it(`returns base = 0 if base < 0`, () => {
    expect(RetryBackoff({ count, error, base: -1 }).base).toEqual(0);
  });

  // startTime

  it(`returns startTime`, () => {
    expect(RetryBackoff({ count, error, startTime: 1 }).startTime).toEqual(1);
  });

  it(`returns startTime from () => startTime`, () => {
    expect(RetryBackoff({ count, error, startTime: () => 5 }).startTime).toEqual(5);
  });

  it(`returns startTime from ({ context, error }) => startTime`, () => {
    const startTime = (c: any) => (exposesContextError(c) ? 5 : 0);
    expect(RetryBackoff({ count, error, context, startTime }).startTime).toEqual(5);
  });

  it(`returns startTime rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count, error, startTime: 1.1 }).startTime).toEqual(1);
    expect(RetryBackoff({ count, error, startTime: 1.9 }).startTime).toEqual(2);
  });

  it(`returns startTime undefined if < 0`, () => {
    expect(RetryBackoff({ count, error, startTime: -1 }).startTime).toBeUndefined();
  });

  it(`returns totalTime if startTime is defined`, () => {
    const startTime = date.getTime() - 1;
    expect(RetryBackoff({ count, error }).totalTime).toBeUndefined();
    expect(RetryBackoff({ count, error, startTime }).totalTime).toEqual(1);
  });

  // maxTime

  it(`returns maxTime`, () => {
    expect(RetryBackoff({ count, error, maxTime: 1 }).maxTime).toEqual(1);
  });

  it(`returns maxTime from () => maxTime`, () => {
    expect(RetryBackoff({ count, error, maxTime: () => 5 }).maxTime).toEqual(5);
  });

  it(`returns maxTime from ({ context, error }) => maxTime`, () => {
    const maxTime = (c: any) => (exposesContextError(c) ? 5 : 0);
    expect(RetryBackoff({ count, error, context, maxTime }).maxTime).toEqual(5);
  });

  it(`returns maxTime rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count, error, maxTime: 1.1 }).maxTime).toEqual(1);
    expect(RetryBackoff({ count, error, maxTime: 1.9 }).maxTime).toEqual(2);
  });

  it(`returns maxTime undefined if maxTime < 0`, () => {
    expect(RetryBackoff({ count, error, maxTime: -1 }).maxTime).toBeUndefined();
  });

  it(`throws error if totalTime + delay > maxTime`, () => {
    const startTime = date.getTime() - 1;
    expect(() => RetryBackoff({ count, error, startTime, delay: 1, maxTime: 1 })).toThrowError(error);
  });

  // delay

  it(`returns delay`, () => {
    expect(RetryBackoff({ count, error, delay: 1 }).delay).toEqual(1);
  });

  it(`returns delay from () => delay`, () => {
    expect(RetryBackoff({ count, error, delay: () => 5 }).delay).toEqual(5);
  });

  it(`returns delay from (PartialRetryBackoffResult) => delay`, () => {
    const delay = (c: any) => (exposesPartial(c) ? 5 : 0);
    expect(RetryBackoff({ ...fullConfig, delay: delay }).delay).toEqual(5);
  });

  it(`returns delay defaulting to ({ base, count }) => (base * 2^(count-1))`, () => {
    expect(RetryBackoff({ count: 1, error, base: 1 }).delay).toEqual(1);
    expect(RetryBackoff({ count: 2, error, base: 1 }).delay).toEqual(2);
    expect(RetryBackoff({ count: 3, error, base: 1 }).delay).toEqual(4);
    expect(RetryBackoff({ count: 4, error, base: 1 }).delay).toEqual(8);
    expect(RetryBackoff({ count: 5, error, base: 1 }).delay).toEqual(16);
  });

  it(`returns delay rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count, error, delay: 1.1 }).delay).toEqual(1);
    expect(RetryBackoff({ count, error, delay: 1.9 }).delay).toEqual(2);
  });

  it(`returns delay = 0 if delay < 0`, () => {
    expect(RetryBackoff({ count, error, delay: -1 }).delay).toEqual(0);
  });

  it(`returns delay = maxDelay if maxDelay < delay`, () => {
    expect(RetryBackoff({ count, error, maxDelay: 1, delay: 2 }).delay).toEqual(1);
  });

  // maxDelay

  it(`returns maxDelay`, () => {
    expect(RetryBackoff({ count, error, maxDelay: 1 }).maxDelay).toEqual(1);
  });

  it(`returns maxDelay from () => maxDelay`, () => {
    expect(RetryBackoff({ count, error, maxDelay: () => 5 }).maxDelay).toEqual(5);
  });

  it(`returns maxDelay from (PartialRetryBackoffResult) => maxDelay`, () => {
    const maxDelay = (c: any) => (exposesPartial(c) ? 5 : 0);
    expect(RetryBackoff({ ...fullConfig, maxDelay }).maxDelay).toEqual(5);
  });

  it(`returns maxDelay rounded to the nearest integer`, () => {
    expect(RetryBackoff({ count, error, maxDelay: 1.1 }).maxDelay).toEqual(1);
    expect(RetryBackoff({ count, error, maxDelay: 1.9 }).maxDelay).toEqual(2);
  });

  it(`returns maxDelay undefined if maxDelay < 0`, () => {
    expect(RetryBackoff({ count, error, maxDelay: -1 }).maxDelay).toBeUndefined();
  });

  it(`returns delay = maxDelay if maxDelay < delay`, () => {
    expect(RetryBackoff({ count, error, maxDelay: 1, delay: 2 }).delay).toEqual(1);
  });

  // shouldRetry

  it(`returns if shouldRetry true`, () => {
    expect(RetryBackoff({ count, error, shouldRetry: true })).toEqual(defaultResult);
  });

  it(`returns if () => shouldRetry true`, () => {
    expect(RetryBackoff({ count, error, shouldRetry: () => true })).toEqual(defaultResult);
  });

  it(`returns if (RetryBackoffResult) => shouldRetry true`, () => {
    const shouldRetry = (c: any) => (exposesResult(c) ? true : false);
    expect(() => RetryBackoff({ ...fullConfig, shouldRetry })).not.toThrow();
  });

  it(`throws error if shouldRetry false`, () => {
    expect(() => RetryBackoff({ count, error, shouldRetry: false })).toThrowError(error);
  });

  it(`throws error if () => shouldRetry false`, () => {
    expect(() => RetryBackoff({ count, error, shouldRetry: () => false })).toThrowError(error);
  });

  it(`throws error if (RetryBackoffResult) => shouldRetry false`, () => {
    const shouldRetry = (c: any) => (exposesResult(c) ? false : true);
    expect(() => RetryBackoff({ ...fullConfig, shouldRetry })).toThrowError(error);
  });

  it(`returns shouldRetry defaulting to true`, () => {
    expect(RetryBackoff({ count, error })).toEqual(defaultResult);
  });

  // shouldNotRetry

  it(`throws error if shouldNotRetry true`, () => {
    expect(() => RetryBackoff({ count, error, shouldNotRetry: true })).toThrowError(error);
  });

  it(`throws error if () => shouldNotRetry true`, () => {
    expect(() => RetryBackoff({ count, error, shouldNotRetry: () => true })).toThrowError(error);
  });

  it(`throws error if (RetryBackoffResult) => shouldNotRetry true`, () => {
    const shouldNotRetry = (c: any) => (exposesResult(c) ? true : false);
    expect(() => RetryBackoff({ ...fullConfig, shouldNotRetry })).toThrowError(error);
  });

  it(`returns if shouldNotRetry false`, () => {
    expect(RetryBackoff({ count, error, shouldNotRetry: false })).toEqual(defaultResult);
  });

  it(`returns if () => shouldNotRetry false`, () => {
    expect(RetryBackoff({ count, error, shouldNotRetry: () => false })).toEqual(defaultResult);
  });

  it(`returns if (RetryBackoffResult) => shouldNotRetry false`, () => {
    const shouldNotRetry = (c: any) => (exposesResult(c) ? false : true);
    expect(() => RetryBackoff({ ...fullConfig, shouldNotRetry })).not.toThrow();
  });

  it(`returns shouldNotRetry defaulting to false`, () => {
    expect(RetryBackoff({ count, error })).toEqual(defaultResult);
  });

  // tap

  it(`returns using (RetryBackoffResult) => tap`, () => {
    const fn = jest.fn();
    const tap = (c: any) => (exposesResult(c) ? fn(1) : fn(0));
    expect(fn).not.toHaveBeenCalled();
    RetryBackoff({ ...fullConfig, tap });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
  });
});

function exposesContextError(value: unknown): value is { context: any; error: any } {
  return value != null && typeof value === 'object' && isDefined(value, 'context') && isDefined(value, 'error');
}

function exposesPartial(value: unknown): value is PartialRetryBackoffResult<any, any> {
  return (
    exposesContextError(value) &&
    isDefined(value, 'count') &&
    isDefined(value, 'maxRetries') &&
    isDefined(value, 'base') &&
    isDefined(value, 'startTime') &&
    isDefined(value, 'totalTime') &&
    isDefined(value, 'maxTime')
  );
}

function exposesResult(value: unknown): value is RetryBackoffResult<TCtx, Error> {
  return exposesPartial(value) && isDefined(value, 'delay') && isDefined(value, 'maxDelay');
}

function isDefined(obj: Record<string, any>, key: string) {
  return key in obj && obj[key] !== undefined;
}
