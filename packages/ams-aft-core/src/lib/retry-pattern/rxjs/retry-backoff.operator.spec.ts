import { of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { RetryConfig, RetryContext } from '../retry.types';
import { retryPattern } from './retry-pattern.operator';

type TCtx = { a: number };
const context: TCtx = { a: 10 };
const maxAttemps = 3;
const error = new Error();

describe('retryPattern', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0.9999);
  });

  it(`resubscribes to the observable on error with default values`, () => {
    testBackoffOperator();
  });

  it(`uses custom "contexts"`, () => {
    const shouldRetry = ({ context }: any) => context.a === 10;
    testBackoffOperator({ config: { context, shouldRetry } });
  });

  it(`uses custom "maxAttemps"`, () => {
    testBackoffOperator({ maxAttemps: 2, config: { maxAttemps: 2 } });
  });

  it(`uses custom "interval"`, () => {
    testBackoffOperator({ interval: 10, config: { interval: 10 } });
  });

  it(`uses custom "maxTime"`, () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(10).mockReturnValue(20);
    testBackoffOperator({ maxAttemps: 0, delay: 10, config: { delay: 10, maxTime: 19 } });
  });

  it(`uses custom "delay"`, () => {
    testBackoffOperator({ delay: 10, config: { delay: 10 } });
  });

  it(`uses custom "mimDelay"`, () => {
    testBackoffOperator({ delay: 10, config: { delay: 5, minDelay: 10 } });
  });

  it(`uses custom "maxDelay"`, () => {
    testBackoffOperator({ delay: 10, config: { delay: 20, maxDelay: 10 } });
  });

  it(`uses custom "firstDelay"`, () => {
    const testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    return testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('#', {}, error);
      const result = source.pipe(retryPattern({ firstDelay: 5, delay: 20 }));

      expectObservable(result).toBe(`45ms #`, {}, error);
      expectSubscriptions(source.subscriptions).toBe(['(^!)', '5ms (^!)', '25ms (^!)', '45ms (^!)']);
    });
  });

  it(`uses custom "shouldRetry"`, () => {
    testBackoffOperator({ config: { shouldRetry: true } });
    testBackoffOperator({ maxAttemps: 0, config: { shouldRetry: false } });
  });

  it(`uses custom "onRetry"`, () => {
    const fn = jest.fn();
    expect(fn).not.toHaveBeenCalled();
    testBackoffOperator({ config: { onRetry: () => fn() } });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it(`uses custom "onRetryError"`, () => {
    const fn = jest.fn();
    expect(fn).not.toHaveBeenCalled();
    throwError(() => error)
      .pipe(
        retryPattern({
          onRetryError: (scope: any) => fn(scope),
          shouldRetry: false
        })
      )
      .subscribe();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, {
      attemp: 1,
      delay: 500,
      error,
      interval: 500,
      maxAttemps: 3,
      minDelay: 0,
      totalTime: 0,
      startTime: expect.toBeNumber()
    });
  });

  it(`uses custom "onSuccess"`, () => {
    const fn = jest.fn();
    expect(fn).not.toHaveBeenCalled();
    of(0)
      .pipe(retryPattern({ onSuccess: (scope: any, value: any) => fn(scope, value) }))
      .subscribe();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, undefined, 0);
  });
});

function testBackoffOperator<Ctx extends RetryContext>(conf?: {
  maxAttemps?: number;
  interval?: number;
  error?: Error;
  delay?: number;
  config?: RetryConfig<Ctx, Error>;
}) {
  const testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  const subs = ['(^!)'];
  const merged = {
    maxAttemps,
    error,
    base: 300,
    interval: 500,
    ...(conf ?? {})
  };

  let numExpected = 0;

  for (let i = 1; i <= merged.maxAttemps; i++) {
    numExpected += merged.delay ?? Math.pow(2, i - 1) * merged.interval;
    subs.push(`${numExpected}ms (^!)`);
  }

  return testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('#', {}, merged.error);
    const result = source.pipe(retryPattern(merged?.config));

    expectObservable(result).toBe(`${numExpected}ms #`, {}, merged.error);
    expectSubscriptions(source.subscriptions).toBe(subs);
  });
}
