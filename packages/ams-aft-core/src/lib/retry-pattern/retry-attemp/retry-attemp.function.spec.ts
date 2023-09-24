import { DelayScope, MinScope, RetryScope } from '../retry.types';
import { retryAttemp } from './retry-attemp.function';

type TCtx = { a: number };
const context: TCtx = { a: 1 };
const attemp = 1;
const error = new Error();
const date = new Date('Sun, 1 Jan 2023 12:00:00 GMT');

const scope = {
  attemp,
  error,
  interval: 500,
  maxAttemps: 3,
  delay: 0,
  minDelay: 0
};

const config = {
  attemp,
  error,
  context,
  maxDelay: 10000,
  startTime: date.getTime() - 1,
  maxTime: 10000,
  prevDelay: 0,
  firstDelay: 0,
  minDelay: 0
};

describe('retryAttemp', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(Date, 'now').mockReturnValue(date.getTime());
  });

  it(`returns default values`, () => {
    expect(retryAttemp({ attemp, error })).toEqual(scope);
    expect(retryAttemp({ attemp: 2, error })).toEqual({ ...scope, attemp: 2 });
    expect(retryAttemp({ attemp: 3, error })).toEqual({ ...scope, attemp: 3 });
    expect(() => retryAttemp({ attemp: 4, error })).toThrowError(error);

    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(retryAttemp({ attemp, error })).toEqual({ ...scope, delay: 250 });
    expect(retryAttemp({ attemp: 2, error })).toEqual({ ...scope, attemp: 2, delay: 500 });
    expect(retryAttemp({ attemp: 3, error })).toEqual({ ...scope, attemp: 3, delay: 1000 });

    jest.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(retryAttemp({ attemp, error })).toEqual({ ...scope, delay: 500 });
    expect(retryAttemp({ attemp: 2, error })).toEqual({ ...scope, attemp: 2, delay: 1000 });
    expect(retryAttemp({ attemp: 3, error })).toEqual({ ...scope, attemp: 3, delay: 2000 });
  });

  // error

  it(`returns error`, () => {
    expect(retryAttemp({ attemp, error }).error).toEqual(error);
  });

  it(`returns error from () => error`, () => {
    expect(retryAttemp({ attemp, error: () => error }).error).toEqual(error);
  });

  // attemp

  it(`returns attemp`, () => {
    expect(retryAttemp({ attemp, error }).attemp).toEqual(1);
  });

  it(`returns attemp from () => attemp`, () => {
    expect(retryAttemp({ attemp: () => 2, error }).attemp).toEqual(2);
  });

  it(`returns attemp rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp: 1.1, error }).attemp).toEqual(1);
    expect(retryAttemp({ attemp: 1.9, error }).attemp).toEqual(2);
  });

  it(`throws error if attemp < 1`, () => {
    expect(() => retryAttemp({ attemp: 0, error })).toThrowError(error);
    expect(() => retryAttemp({ attemp: -1, error })).toThrowError(error);
  });

  // context

  it(`returns context`, () => {
    expect(retryAttemp({ attemp, error, context }).context).toEqual(context);
  });

  it(`returns context from () => context`, () => {
    expect(retryAttemp({ attemp, error, context: () => context }).context).toEqual(context);
  });

  it(`returns context defaulting to undefined`, () => {
    expect(retryAttemp({ attemp, error }).context).toBeUndefined();
  });

  // prevDelay

  it(`returns prevDelay`, () => {
    expect(retryAttemp({ attemp, error, prevDelay: 0 }).prevDelay).toEqual(0);
  });

  it(`returns prevDelay from () => prevDelay`, () => {
    expect(retryAttemp({ attemp, error, prevDelay: () => 1 }).prevDelay).toEqual(1);
  });

  it(`returns prevDelay defaulting to undefined`, () => {
    expect(retryAttemp({ attemp, error }).prevDelay).toBeUndefined();
  });

  it(`returns prevDelay rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, prevDelay: 1.1 }).prevDelay).toEqual(1);
    expect(retryAttemp({ attemp, error, prevDelay: 1.9 }).prevDelay).toEqual(2);
  });

  it(`returns prevDelay undefined if < 0`, () => {
    expect(retryAttemp({ attemp, error, prevDelay: -1 }).prevDelay).toBeUndefined();
  });

  // startTime

  it(`returns startTime`, () => {
    expect(retryAttemp({ attemp, error, startTime: 0 }).startTime).toEqual(0);
  });

  it(`returns startTime from () => startTime`, () => {
    expect(retryAttemp({ attemp, error, startTime: () => 1 }).startTime).toEqual(1);
  });

  it(`returns startTime defaulting to undefined`, () => {
    expect(retryAttemp({ attemp, error }).startTime).toBeUndefined();
  });

  it(`returns startTime rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, startTime: 1.1 }).startTime).toEqual(1);
    expect(retryAttemp({ attemp, error, startTime: 1.9 }).startTime).toEqual(2);
  });

  it(`returns startTime undefined if < 0`, () => {
    expect(retryAttemp({ attemp, error, startTime: -1 }).startTime).toBeUndefined();
  });

  // totalTime

  it(`returns totalTime if startTime is defined`, () => {
    const startTime = date.getTime() - 1;
    expect(retryAttemp({ attemp, error }).totalTime).toBeUndefined();
    expect(retryAttemp({ attemp, error, startTime }).totalTime).toEqual(1);
  });

  // maxAttemps

  it(`returns maxAttemps`, () => {
    expect(retryAttemp({ attemp, error, maxAttemps: 1 }).maxAttemps).toEqual(1);
  });

  it(`returns maxAttemps from () => maxAttemps`, () => {
    expect(retryAttemp({ attemp, error, maxAttemps: () => 2 }).maxAttemps).toEqual(2);
  });

  it(`returns maxAttemps defaulting to 3`, () => {
    expect(retryAttemp({ attemp, error }).maxAttemps).toEqual(3);
  });

  it(`returns maxAttemps rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, maxAttemps: 1.1 }).maxAttemps).toEqual(1);
    expect(retryAttemp({ attemp, error, maxAttemps: 1.9 }).maxAttemps).toEqual(2);
  });

  it(`returns maxAttemps default value if < 1`, () => {
    expect(retryAttemp({ attemp, error, maxAttemps: 0 }).maxAttemps).toEqual(3);
    expect(retryAttemp({ attemp, error, maxAttemps: -1 }).maxAttemps).toEqual(3);
  });

  it(`throws error if maxAttemps < attemp `, () => {
    expect(() => retryAttemp({ maxAttemps: 1, attemp: 2, error })).toThrowError(error);
  });

  // interval

  it(`returns interval`, () => {
    expect(retryAttemp({ attemp, error, interval: 0 }).interval).toEqual(0);
  });

  it(`returns interval from () => interval`, () => {
    expect(retryAttemp({ attemp, error, interval: () => 1 }).interval).toEqual(1);
  });

  it(`returns interval from (MinScope) => interval`, () => {
    const interval = (c: any) => (exposesMinScope(c) ? 0 : -1);
    expect(retryAttemp({ ...config, interval }).interval).toEqual(0);
  });

  it(`returns interval defaulting to 500`, () => {
    expect(retryAttemp({ attemp, error }).interval).toEqual(500);
  });

  it(`returns interval rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, interval: 1.1 }).interval).toEqual(1);
    expect(retryAttemp({ attemp, error, interval: 1.9 }).interval).toEqual(2);
  });

  it(`returns interval default value if < 0`, () => {
    expect(retryAttemp({ attemp, error, interval: -1 }).interval).toEqual(500);
  });

  // maxTime

  it(`returns maxTime`, () => {
    expect(retryAttemp({ attemp, error, maxTime: 0 }).maxTime).toEqual(0);
  });

  it(`returns maxTime from () => maxTime`, () => {
    expect(retryAttemp({ attemp, error, maxTime: () => 1 }).maxTime).toEqual(1);
  });

  it(`returns maxTime from (MinScope) => maxTime`, () => {
    const maxTime = (c: any) => (exposesMinScope(c) ? 5 : -1);
    expect(retryAttemp({ ...config, maxTime }).maxTime).toEqual(5);
  });

  it(`returns maxTime defaulting to undefined`, () => {
    expect(retryAttemp({ attemp, error }).maxTime).toBeUndefined();
  });

  it(`returns maxTime rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, maxTime: 1.1 }).maxTime).toEqual(1);
    expect(retryAttemp({ attemp, error, maxTime: 1.9 }).maxTime).toEqual(2);
  });

  it(`returns maxTime undefined if maxTime < 0`, () => {
    expect(retryAttemp({ attemp, error, maxTime: -1 }).maxTime).toBeUndefined();
  });

  it(`throws error if maxTime is lower than next delay time`, () => {
    const startTime = date.getTime() - 1;
    expect(() => retryAttemp({ attemp, error, startTime, delay: 1, maxTime: 1 })).toThrowError(error);
  });

  // delay

  it(`returns delay`, () => {
    expect(retryAttemp({ attemp, error, delay: 0 }).delay).toEqual(0);
  });

  it(`returns delay from () => delay`, () => {
    expect(retryAttemp({ attemp, error, delay: () => 1 }).delay).toEqual(1);
  });

  it(`returns delay from (DelayScope) => delay`, () => {
    const delay = (c: any) => (exposesDelayScope(c) ? 1 : -1);
    expect(retryAttemp({ ...config, attemp: 2, delay: delay }).delay).toEqual(1);
  });

  it(`returns delay defaulting to backoff with full jitter strategy`, () => {
    expect(retryAttemp({ attemp: 1, error, interval: 1 }).delay).toEqual(0);
    expect(retryAttemp({ attemp: 2, error, interval: 1 }).delay).toEqual(0);
    expect(retryAttemp({ attemp: 3, error, interval: 1 }).delay).toEqual(0);

    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(retryAttemp({ attemp: 1, error, interval: 1 }).delay).toEqual(1);
    expect(retryAttemp({ attemp: 2, error, interval: 1 }).delay).toEqual(2);
    expect(retryAttemp({ attemp: 3, error, interval: 1 }).delay).toEqual(4);
  });

  it(`returns delay rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, delay: 1.1 }).delay).toEqual(1);
    expect(retryAttemp({ attemp, error, delay: 1.9 }).delay).toEqual(2);
  });

  it(`returns delay = 0 if delay < 0`, () => {
    expect(retryAttemp({ attemp, error, delay: -1 }).delay).toEqual(0);
  });

  // minDelay

  it(`returns minDelay`, () => {
    expect(retryAttemp({ attemp, error, minDelay: 0 }).minDelay).toEqual(0);
  });

  it(`returns minDelay from () => minDelay`, () => {
    expect(retryAttemp({ attemp, error, minDelay: () => 1 }).minDelay).toEqual(1);
  });

  it(`returns minDelay from (DelayScope) => minDelay`, () => {
    const minDelay = (c: any) => (exposesDelayScope(c) ? 5 : -1);
    expect(retryAttemp({ ...config, minDelay }).minDelay).toEqual(5);
  });

  it(`returns minDelay defaulting to 0`, () => {
    expect(retryAttemp({ attemp, error }).minDelay).toEqual(0);
  });

  it(`returns minDelay rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, minDelay: 1.1 }).minDelay).toEqual(1);
    expect(retryAttemp({ attemp, error, minDelay: 1.9 }).minDelay).toEqual(2);
  });

  it(`returns minDelay default value if < 0`, () => {
    expect(retryAttemp({ attemp, error, minDelay: -1 }).minDelay).toEqual(0);
  });

  it(`returns minDelay as delay if > delay`, () => {
    expect(retryAttemp({ attemp, error, delay: 2 }).delay).toEqual(2);
  });

  // maxDelay

  it(`returns maxDelay`, () => {
    expect(retryAttemp({ attemp, error, maxDelay: 0 }).maxDelay).toEqual(0);
  });

  it(`returns maxDelay from () => maxDelay`, () => {
    expect(retryAttemp({ attemp, error, maxDelay: () => 1 }).maxDelay).toEqual(1);
  });

  it(`returns maxDelay from (DelayScope) => maxDelay`, () => {
    const maxDelay = (c: any) => (exposesDelayScope(c) ? 5 : -1);
    expect(retryAttemp({ ...config, maxDelay }).maxDelay).toEqual(5);
  });

  it(`returns maxDelay defaulting to undefined`, () => {
    expect(retryAttemp({ attemp, error }).maxDelay).toBeUndefined();
  });

  it(`returns maxDelay rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, maxDelay: 1.1 }).maxDelay).toEqual(1);
    expect(retryAttemp({ attemp, error, maxDelay: 1.9 }).maxDelay).toEqual(2);
  });

  it(`returns maxDelay undefined if maxDelay < 0`, () => {
    expect(retryAttemp({ attemp, error, maxDelay: -1 }).maxDelay).toBeUndefined();
  });

  it(`returns maxDelay as delay if < delay`, () => {
    expect(retryAttemp({ attemp, error, maxDelay: 1, delay: 2 }).delay).toEqual(1);
  });

  it(`returns maxDelay with preference over minDelay`, () => {
    expect(retryAttemp({ attemp, error, maxDelay: 1, minDelay: 5, delay: 3 }).delay).toEqual(1);
  });

  // firstDelay

  it(`returns firstDelay`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: 0 }).firstDelay).toEqual(0);
  });

  it(`returns firstDelay from () => firstDelay`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: () => 1 }).firstDelay).toEqual(1);
  });

  it(`returns firstDelay from (DelayScope) => firstDelay`, () => {
    const firstDelay = (c: any) => (exposesDelayScope(c) ? 5 : -1);
    expect(retryAttemp({ ...config, firstDelay }).firstDelay).toEqual(5);
  });

  it(`returns firstDelay defaulting to undefined`, () => {
    expect(retryAttemp({ attemp, error }).firstDelay).toBeUndefined();
  });

  it(`returns firstDelay rounded to the nearest integer`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: 1.1 }).firstDelay).toEqual(1);
    expect(retryAttemp({ attemp, error, firstDelay: 1.9 }).firstDelay).toEqual(2);
  });

  it(`returns firstDelay undefined if firstDelay < 0`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: -1 }).firstDelay).toBeUndefined();
  });

  it(`returns firstDelay as delay if attemp = 1`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: 1, delay: 2 }).delay).toEqual(1);
    expect(retryAttemp({ attemp: 2, error, firstDelay: 1, delay: 2 }).delay).toEqual(2);
    expect(retryAttemp({ attemp: 3, error, firstDelay: 1, delay: 2 }).delay).toEqual(2);
  });

  it(`returns firstDelay with preference over minDelay`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: 1, minDelay: 5, delay: 3 }).delay).toEqual(1);
  });

  it(`returns firstDelay with preference over maxDelay`, () => {
    expect(retryAttemp({ attemp, error, firstDelay: 1, maxDelay: 3, delay: 5 }).delay).toEqual(1);
  });

  // shouldRetry

  it(`returns if shouldRetry true`, () => {
    expect(retryAttemp({ attemp, error, shouldRetry: true })).toEqual(scope);
  });

  it(`returns if () => shouldRetry true`, () => {
    expect(retryAttemp({ attemp, error, shouldRetry: () => true })).toEqual(scope);
  });

  it(`returns if (RetryScope) => shouldRetry true`, () => {
    const shouldRetry = (c: any) => (exposesRetryScope(c) ? true : false);
    expect(() => retryAttemp({ ...config, shouldRetry })).not.toThrow();
  });

  it(`throws error if shouldRetry false`, () => {
    expect(() => retryAttemp({ attemp, error, shouldRetry: false })).toThrowError(error);
  });

  it(`throws error if () => shouldRetry false`, () => {
    expect(() => retryAttemp({ attemp, error, shouldRetry: () => false })).toThrowError(error);
  });

  it(`throws error if (RetryScope) => shouldRetry false`, () => {
    const shouldRetry = (c: any) => (exposesRetryScope(c) ? false : true);
    expect(() => retryAttemp({ ...config, shouldRetry })).toThrowError(error);
  });

  it(`returns shouldRetry defaulting to true`, () => {
    expect(retryAttemp({ attemp, error })).toEqual(scope);
  });

  // onRetry

  it(`emits onRetry using RetryScope`, () => {
    const fn = jest.fn();
    const onRetry = (c: any) => (exposesRetryScope(c) ? fn(1) : fn(0));
    expect(fn).not.toHaveBeenCalled();
    retryAttemp({ ...config, onRetry });
    expect(() => retryAttemp({ ...config, onRetry, shouldRetry: false })).toThrowError(error);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
  });

  // onRetryError

  it(`emits onRetryError using RetryScope`, () => {
    const fn = jest.fn();
    const onRetryError = (c: any) => (exposesRetryScope(c) ? fn(1) : fn(0));
    expect(fn).not.toHaveBeenCalled();
    retryAttemp({ ...config, onRetryError });
    expect(() => retryAttemp({ ...config, onRetryError, shouldRetry: false })).toThrowError(error);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
  });
});

function exposesMinScope(value: unknown): value is MinScope<TCtx, Error> {
  return (
    value != null &&
    typeof value === 'object' &&
    isDefined(value, 'error') &&
    isDefined(value, 'attemp') &&
    isDefined(value, 'context') &&
    isDefined(value, 'prevDelay') &&
    isDefined(value, 'startTime') &&
    isDefined(value, 'totalTime')
  );
}

function exposesDelayScope(value: unknown): value is DelayScope<TCtx, Error> {
  return (
    exposesMinScope(value) &&
    isDefined(value, 'maxAttemps') &&
    isDefined(value, 'interval') &&
    isDefined(value, 'maxTime')
  );
}

function exposesRetryScope(value: unknown): value is RetryScope<TCtx, Error> {
  return (
    exposesDelayScope(value) &&
    isDefined(value, 'delay') &&
    isDefined(value, 'firstDelay') &&
    isDefined(value, 'minDelay') &&
    isDefined(value, 'maxDelay')
  );
}

function isDefined(obj: Record<string, any>, key: string) {
  return key in obj && obj[key] !== undefined;
}
