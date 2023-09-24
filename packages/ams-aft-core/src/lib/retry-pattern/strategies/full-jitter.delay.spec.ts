import { fullJitterDelay } from './full-jitter.delay';

const config = {
  error: new Error(),
  maxAttemps: 5,
  interval: 10,
  prevDelay: 0
};

describe('fullJitterDelay', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  it(`returns randomBetween(0, exponentialBackoff) on each attemp`, () => {
    expect(fullJitterDelay({ attemp: 1, ...config })).toEqual(0);
    expect(fullJitterDelay({ attemp: 2, ...config })).toEqual(0);
    expect(fullJitterDelay({ attemp: 3, ...config })).toEqual(0);
    expect(fullJitterDelay({ attemp: 4, ...config })).toEqual(0);
    expect(fullJitterDelay({ attemp: 5, ...config })).toEqual(0);

    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(fullJitterDelay({ attemp: 1, ...config })).toEqual(10);
    expect(fullJitterDelay({ attemp: 2, ...config })).toEqual(20);
    expect(fullJitterDelay({ attemp: 3, ...config })).toEqual(40);
    expect(fullJitterDelay({ attemp: 4, ...config })).toEqual(80);
    expect(fullJitterDelay({ attemp: 5, ...config })).toEqual(160);
  });
});
