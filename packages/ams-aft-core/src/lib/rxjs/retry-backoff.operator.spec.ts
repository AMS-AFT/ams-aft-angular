import { TestScheduler } from 'rxjs/testing';

import { retryBackoff } from './retry-backoff.operator';

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
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '9360ms #';
      const subs = ['^ 9ms !', '310ms ^ 9ms !', '920ms ^ 9ms !', '2130ms ^ 9ms !', '4540ms ^ 9ms !', '9350ms ^ 9ms !'];
      const result = source.pipe(retryBackoff());

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "count"`, () => {
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '930ms #';
      const subs = ['^ 9ms !', '310ms ^ 9ms !', '920ms ^ 9ms !'];
      const result = source.pipe(retryBackoff({ count: 2 }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "shouldRetry"`, () => {
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '10ms #';
      const subs = ['^ 9ms !'];
      const result = source.pipe(retryBackoff({ shouldRetry: false }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "baseInterval"`, () => {
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '370ms #';
      const subs = ['^ 9ms !', '20ms ^ 9ms !', '50ms ^ 9ms !', '100ms ^ 9ms !', '190ms ^ 9ms !', '360ms ^ 9ms !'];
      const result = source.pipe(retryBackoff({ baseInterval: 10 }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "delay"`, () => {
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '110ms #';
      const subs = ['^ 9ms !', '20ms ^ 9ms !', '40ms ^ 9ms !', '60ms ^ 9ms !', '80ms ^ 9ms !', '100ms ^ 9ms !'];
      const result = source.pipe(retryBackoff({ delay: () => 10 }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "shouldNotRetry"`, () => {
    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '10ms #';
      const subs = ['^ 9ms !'];
      const result = source.pipe(retryBackoff({ shouldNotRetry: true }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it(`uses custom "tap"`, () => {
    const fn = jest.fn();
    const tap = () => {
      fn();
    };

    expect(fn).not.toHaveBeenCalled();

    rxTest.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('10ms #');
      const expected = '9360ms #';
      const subs = ['^ 9ms !', '310ms ^ 9ms !', '920ms ^ 9ms !', '2130ms ^ 9ms !', '4540ms ^ 9ms !', '9350ms ^ 9ms !'];
      const result = source.pipe(retryBackoff({ tap }));

      expectObservable(result).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });

    expect(fn).toHaveBeenCalledTimes(5);
  });
});
