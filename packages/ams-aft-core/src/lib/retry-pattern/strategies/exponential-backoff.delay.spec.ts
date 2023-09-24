import { exponentialBackoffDelay } from './exponential-backoff.delay';

const config = {
  error: new Error(),
  maxAttemps: 5,
  interval: 10,
  prevDelay: 0
};

describe('exponentialBackoffDelay', () => {
  it(`returns interval * 2^(attemp - 1) on each attemp`, () => {
    expect(exponentialBackoffDelay({ attemp: 1, ...config })).toEqual(10);
    expect(exponentialBackoffDelay({ attemp: 2, ...config })).toEqual(20);
    expect(exponentialBackoffDelay({ attemp: 3, ...config })).toEqual(40);
    expect(exponentialBackoffDelay({ attemp: 4, ...config })).toEqual(80);
    expect(exponentialBackoffDelay({ attemp: 5, ...config })).toEqual(160);
  });
});
