import { TestScheduler } from 'rxjs/testing';

import { retryBackoff, RetryBackoffOperatorConfig } from './retry-backoff.operator';
import { RetryBackoffContext } from './retry-backoff.types';

type TCtx = { a: number };
const context: TCtx = { a: 10 };
const maxRetries = 5;
const error = new Error();

describe('retryBackoff', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
  });

  it(`resubscribes to the observable on error with default values`, () => {
    testBackoffOperator();
  });

  it(`uses custom "contexts"`, () => {
    const shouldRetry = ({ context }: any) => context.a === 10;
    testBackoffOperator({ config: { context, shouldRetry } });
  });

  it(`uses custom "maxRetries"`, () => {
    testBackoffOperator({ maxRetries: 2, config: { maxRetries: 2 } });
  });

  it(`uses custom "base"`, () => {
    testBackoffOperator({ base: 10, config: { base: 10 } });
  });

  it(`uses custom "maxTime"`, () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(10).mockReturnValue(20);
    testBackoffOperator({ maxRetries: 0, delay: 10, config: { delay: 10, maxTime: 19 } });
  });

  it(`uses custom "delay"`, () => {
    testBackoffOperator({ delay: 10, config: { delay: 10 } });
  });

  it(`uses custom "maxDelay"`, () => {
    testBackoffOperator({ delay: 10, config: { delay: 20, maxDelay: 10 } });
  });

  it(`uses custom "shouldRetry"`, () => {
    testBackoffOperator({ config: { shouldRetry: true } });
    testBackoffOperator({ maxRetries: 0, config: { shouldRetry: false } });
  });

  it(`uses custom "shouldNotRetry"`, () => {
    testBackoffOperator({ maxRetries: 0, config: { shouldNotRetry: true } });
    testBackoffOperator({ config: { shouldNotRetry: false } });
  });

  it(`uses custom "tap"`, () => {
    const fn = jest.fn();
    expect(fn).not.toHaveBeenCalled();
    testBackoffOperator({ config: { tap: () => fn() } });
    expect(fn).toHaveBeenCalledTimes(5);
  });
});

function testBackoffOperator<Ctx extends RetryBackoffContext>(conf?: {
  maxRetries?: number;
  base?: number;
  error?: Error;
  delay?: number;
  config?: RetryBackoffOperatorConfig<Ctx, Error>;
}) {
  const testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  const subs = ['(^!)'];
  const merged = {
    maxRetries,
    error,
    base: 300,
    ...(conf ?? {})
  };

  let numExpected = 0;

  for (let i = 1; i <= merged.maxRetries; i++) {
    numExpected += merged.delay ?? Math.pow(2, i - 1) * merged.base;
    subs.push(`${numExpected}ms (^!)`);
  }

  return testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold('#', {}, merged.error);
    const result = source.pipe(retryBackoff(merged?.config));

    expectObservable(result).toBe(`${numExpected}ms #`, {}, merged.error);
    expectSubscriptions(source.subscriptions).toBe(subs);
  });
}
