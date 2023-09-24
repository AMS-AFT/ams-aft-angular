import { intervalDelay } from './interval.delay';

const config = {
  error: new Error(),
  maxAttemps: 5,
  interval: 10,
  prevDelay: 0
};

describe('intervalDelay', () => {
  it(`returns fixed interval on each attemp`, () => {
    expect(intervalDelay({ attemp: 1, ...config })).toEqual(10);
    expect(intervalDelay({ attemp: 2, ...config })).toEqual(10);
    expect(intervalDelay({ attemp: 3, ...config })).toEqual(10);
    expect(intervalDelay({ attemp: 4, ...config })).toEqual(10);
    expect(intervalDelay({ attemp: 5, ...config })).toEqual(10);
  });
});
