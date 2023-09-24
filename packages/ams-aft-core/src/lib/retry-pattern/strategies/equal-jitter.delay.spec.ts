import { equalJitterDelay } from './equal-jitter.delay';

const config = {
  error: new Error(),
  maxAttemps: 5,
  interval: 10,
  prevDelay: 0
};

describe('equalJitterDelay', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  it(`returns randomBetween(0, exponentialBackoff) on each attemp`, () => {
    expect(equalJitterDelay({ attemp: 1, ...config })).toEqual(5);
    expect(equalJitterDelay({ attemp: 2, ...config })).toEqual(10);
    expect(equalJitterDelay({ attemp: 3, ...config })).toEqual(20);
    expect(equalJitterDelay({ attemp: 4, ...config })).toEqual(40);
    expect(equalJitterDelay({ attemp: 5, ...config })).toEqual(80);

    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(equalJitterDelay({ attemp: 1, ...config })).toEqual(10);
    expect(equalJitterDelay({ attemp: 2, ...config })).toEqual(20);
    expect(equalJitterDelay({ attemp: 3, ...config })).toEqual(40);
    expect(equalJitterDelay({ attemp: 4, ...config })).toEqual(80);
    expect(equalJitterDelay({ attemp: 5, ...config })).toEqual(160);
  });
});
