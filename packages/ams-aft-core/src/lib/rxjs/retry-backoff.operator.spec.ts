import { TestScheduler } from 'rxjs/testing';

import { getRandomBetween } from '../utils';
import { retryBackoff, RetryBackoffConfig, RetryBackoffScope } from './retry-backoff.operator';

const realRandom = Math.random;

describe('retryBackoff', () => {
  let rxTest: TestScheduler;

  beforeAll(() => {
    global.Math.random = jest.fn(() => 0);
  });

  afterAll(() => {
    global.Math.random = realRandom;
  });

  beforeEach(() => {
    rxTest = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
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
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('#');
      const expected = '50ms #';
      const subs = ['(^!)', '10ms (^!)', '20ms (^!)', '30ms (^!)', '40ms (^!)', '50ms (^!)'];
      const result = source.pipe(retryBackoff({ delay: 10 }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "shouldNotRetry"`, () => {
    testBackoffOperator({ count: 0, config: { shouldNotRetry: true } });
  });

  it(`uses custom "tap"`, () => {
    const fn = jest.fn();

    expect(fn).not.toHaveBeenCalled();

    testBackoffOperator({ config: { tap: () => fn() } });

    expect(fn).toHaveBeenCalledTimes(5);
  });

  describe('use cases', () => {
    it(`configure the number of retries and base interval depending on the time of the day`, () => {
      const getCount = (date: Date) => {
        const hour = date.getHours();
        return hour <= 6 || hour >= 20 ? 7 : 2;
      };

      const getBaseInterval = (date: Date) => {
        const hour = date.getHours();
        return hour <= 6 || hour >= 20 ? getRandomBetween(500, 600) : getRandomBetween(200, 300);
      };

      let date = new Date('Sun, 1 Jan 2023 12:00:00 GMT');
      testBackoffOperator({
        count: 2,
        base: 200,
        config: { count: getCount(date), baseInterval: getBaseInterval(date) }
      });

      date = new Date('Sun, 1 Jan 2023 23:00:00 GMT');
      testBackoffOperator({
        count: 7,
        base: 500,
        config: { count: getCount(date), baseInterval: getBaseInterval(date) }
      });
    });

    it(`retry only on certain error types`, () => {
      const getShouldRetry = (scope: RetryBackoffScope<Error>) => {
        return scope.error instanceof URIError;
      };

      testBackoffOperator({ count: 0, config: { shouldRetry: getShouldRetry } });
      testBackoffOperator({ error: new URIError(), config: { shouldRetry: getShouldRetry } });
    });

    it(`define a maximum delay`, () => {
      const getDelay = (scope: RetryBackoffScope<Error>) => {
        const maxDelay = 2_000;
        const backoffDelay = Math.pow(2, scope.retryCount - 1) * scope.baseInterval;
        return Math.min(maxDelay, backoffDelay);
      };

      rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
        const source = cold('#');
        const expected = '6100ms #';
        const subs = ['(^!)', '300ms (^!)', '900ms (^!)', '2100ms (^!)', '4100ms (^!)', '6100ms (^!)'];
        const result = source.pipe(retryBackoff({ delay: getDelay }));

        expectObservable(result).toBe(expected);
        expectSubscriptions(source.subscriptions).toBe(subs);
      });
    });

    it(`define a maximum operation time`, () => {
      const getShouldNotRetry = (scope: RetryBackoffScope<Error> & { delay: number }) => {
        const maxTime = 2_000;
        return scope.delay + scope.totalTime > maxTime;
      };

      testBackoffOperator({ count: 3, config: { shouldNotRetry: getShouldNotRetry } });
    });

    it(`log every retry`, () => {
      const fn = jest.fn();
      const getTap = (scope: RetryBackoffScope<Error> & { delay: number }) => {
        fn(`Retry number ${scope.retryCount}`);
      };

      expect(fn).not.toHaveBeenCalled();

      testBackoffOperator({ config: { tap: getTap } });

      expect(fn).toHaveBeenCalledTimes(5);
      expect(fn).toHaveBeenNthCalledWith(1, 'Retry number 1');
      expect(fn).toHaveBeenNthCalledWith(2, 'Retry number 2');
      expect(fn).toHaveBeenNthCalledWith(3, 'Retry number 3');
      expect(fn).toHaveBeenNthCalledWith(4, 'Retry number 4');
      expect(fn).toHaveBeenNthCalledWith(5, 'Retry number 5');
    });
  });
});

function testBackoffOperator(conf?: {
  count?: number;
  base?: number;
  config?: RetryBackoffConfig<Error>;
  error?: Error;
}) {
  const testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  const subs = ['(^!)'];
  let numExpected = 0;

  for (let i = 1; i <= (conf?.count ?? 5); i++) {
    const delay = Math.pow(2, i - 1) * (conf?.base ?? 300);
    numExpected = numExpected + delay;
    subs.push(`${numExpected}ms (^!)`);
  }

  return testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('#', {}, conf?.error ?? new Error());
    const result = source.pipe(retryBackoff(conf?.config ?? {}));

    expectObservable(result).toBe(`${numExpected}ms #`, {}, conf?.error ?? new Error());
    expectSubscriptions(source.subscriptions).toBe(subs);
  });
}
