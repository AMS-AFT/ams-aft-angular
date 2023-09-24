import { decorrelatedJitterDelay } from './decorrelated-jitter.delay';

const config = {
  error: new Error(),
  maxAttemps: 5,
  interval: 10,
  prevDelay: 10
};

describe('fullJitterDelay', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  it(`returns randomBetween(interval, prevDelay * 3) if prevDelay`, () => {
    expect(decorrelatedJitterDelay({ attemp: 1, ...config })).toEqual(10);

    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(decorrelatedJitterDelay({ attemp: 1, ...config })).toEqual(30);
  });

  it(`returns full jitter if no prevDelay on each attemp`, () => {
    expect(decorrelatedJitterDelay({ attemp: 1, ...config, prevDelay: undefined })).toEqual(0);
    expect(decorrelatedJitterDelay({ attemp: 5, ...config, prevDelay: undefined })).toEqual(0);

    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(decorrelatedJitterDelay({ attemp: 1, ...config, prevDelay: undefined })).toEqual(10);
    expect(decorrelatedJitterDelay({ attemp: 5, ...config, prevDelay: undefined })).toEqual(160);
  });
});
