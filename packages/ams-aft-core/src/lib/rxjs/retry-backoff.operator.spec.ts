import { TestScheduler } from 'rxjs/testing';

import { randomBetween } from '../utils';
import { getBackoffDelay, retryBackoff, RetryBackoffConfig, RetryBackoffScope } from './retry-backoff.operator';

const realRandom = Math.random;

describe('retryBackoff', () => {
  let rxTest: TestScheduler;

  beforeAll(() => {
    global.Math.random = jest.fn(() => 0);
  });

  afterAll(() => {
    global.Math.random = realRandom;
  });

  it(`resubscribes to the observable on error with default values`, () => {
    testBackoffOperator();
  });

  it(`uses custom "count"`, () => {
    testBackoffOperator({ count: 2, config: { count: 2 } });
  });

  it(`uses custom "shouldRetry"`, () => {
    testBackoffOperator({ count: 0, config: { shouldRetry: false } });
  });

  it(`uses custom "baseInterval"`, () => {
    testBackoffOperator({ base: 10, config: { baseInterval: 10 } });
  });

  it(`uses custom "delay"`, () => {
    rxTest = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('#');
      const expected = '50ms #';
      const subs = ['(^!)', '10ms (^!)', '20ms (^!)', '30ms (^!)', '40ms (^!)', '50ms (^!)'];
      const result = source.pipe(retryBackoff({ delay: 10 }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "tap"`, () => {
    const fn = jest.fn();

    expect(fn).not.toHaveBeenCalled();

    testBackoffOperator({ config: { tap: () => fn() } });

    expect(fn).toHaveBeenCalledTimes(5);
  });

  describe('use cases', () => {
    it(`number of retries based on time of day`, () => {
      const count = (date: Date) => (date.getHours() <= 6 ? 7 : 2);

      let date = new Date('Sun, 1 Jan 2023 1:00:00 GMT');
      testBackoffOperator({ count: 7, config: { count: count(date) } });

      date = new Date('Sun, 1 Jan 2023 7:00:00 GMT');
      testBackoffOperator({ count: 2, config: { count: count(date) } });
    });

    it(`base interval based on time of day`, () => {
      const baseInterval = (date: Date) => (date.getHours() <= 6 ? randomBetween(500, 600) : randomBetween(200, 300));

      let date = new Date('Sun, 1 Jan 2023 1:00:00 GMT');
      testBackoffOperator({ base: 500, config: { baseInterval: baseInterval(date) } });

      date = new Date('Sun, 1 Jan 2023 7:00:00 GMT');
      testBackoffOperator({ base: 200, config: { baseInterval: baseInterval(date) } });
    });

    it(`set a maximum delay of 2s`, () => {
      const delay = (scope: RetryBackoffScope<Error>) => Math.min(2_000, getBackoffDelay(scope));

      rxTest = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
      rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
        const source = cold('#');
        const expected = '6100ms #';
        const subs = ['(^!)', '300ms (^!)', '900ms (^!)', '2100ms (^!)', '4100ms (^!)', '6100ms (^!)'];
        const result = source.pipe(retryBackoff({ delay }));

        expectObservable(result).toBe(expected);
        expectSubscriptions(source.subscriptions).toBe(subs);
      });
    });

    it(`retry on URIError with a max operation time of 2s`, () => {
      const shouldRetry = (scope: RetryBackoffScope<Error> & { delay: number }) =>
        scope.error instanceof URIError && scope.delay + scope.totalTime <= 2_000;

      testBackoffOperator({ count: 0, config: { shouldRetry } });
      testBackoffOperator({ count: 3, error: new URIError(), config: { shouldRetry } });
    });

    it(`log every retry`, () => {
      const fn = jest.fn();
      const tap = (scope: RetryBackoffScope<Error> & { delay: number }) => fn(`Retry #${scope.retryCount}`);

      expect(fn).not.toHaveBeenCalled();

      testBackoffOperator({ config: { tap } });

      expect(fn).toHaveBeenCalledTimes(5);
      expect(fn).toHaveBeenNthCalledWith(1, 'Retry #1');
      expect(fn).toHaveBeenNthCalledWith(2, 'Retry #2');
      expect(fn).toHaveBeenNthCalledWith(3, 'Retry #3');
      expect(fn).toHaveBeenNthCalledWith(4, 'Retry #4');
      expect(fn).toHaveBeenNthCalledWith(5, 'Retry #5');
    });
  });
});

function testBackoffOperator(conf?: {
  count?: number;
  base?: number;
  error?: Error;
  config?: RetryBackoffConfig<Error>;
}) {
  const testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  const subs = ['(^!)'];
  const merged = {
    count: 5,
    base: 300,
    error: new Error(),
    ...(conf ?? {})
  };

  let numExpected = 0;

  for (let i = 1; i <= merged.count; i++) {
    numExpected += Math.pow(2, i - 1) * merged.base;
    subs.push(`${numExpected}ms (^!)`);
  }

  return testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('#', {}, merged.error);
    const result = source.pipe(retryBackoff(merged?.config));

    expectObservable(result).toBe(`${numExpected}ms #`, {}, merged.error);
    expectSubscriptions(source.subscriptions).toBe(subs);
  });
}
