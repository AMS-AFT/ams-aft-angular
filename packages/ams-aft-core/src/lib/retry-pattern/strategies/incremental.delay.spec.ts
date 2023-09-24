import { incrementalDelay } from './incremental.delay';

const config = {
  error: new Error(),
  maxAttemps: 5,
  interval: 10,
  prevDelay: 0
};

describe('incrementalDelay', () => {
  it(`returns attemp * interval on each attemp`, () => {
    expect(incrementalDelay({ attemp: 1, ...config })).toEqual(10);
    expect(incrementalDelay({ attemp: 2, ...config })).toEqual(20);
    expect(incrementalDelay({ attemp: 3, ...config })).toEqual(30);
    expect(incrementalDelay({ attemp: 4, ...config })).toEqual(40);
    expect(incrementalDelay({ attemp: 5, ...config })).toEqual(50);
  });
});
