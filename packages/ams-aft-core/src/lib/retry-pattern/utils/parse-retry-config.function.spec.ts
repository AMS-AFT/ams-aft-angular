import { parseRetryConfig } from './parse-retry-config.function';

describe('parseRetryConfig', () => {
  it(`returns value`, () => {
    expect(parseRetryConfig({ config: 0 })).toEqual(0);
  });

  it(`returns function`, () => {
    const config = () => 1;
    expect(parseRetryConfig({ config })).toEqual(1);
  });

  it(`returns function with args`, () => {
    const config = ({ attemp, maxAttemps }: any) => attemp + maxAttemps;
    const scope = { attemp: 1, maxAttemps: 1 };
    expect(parseRetryConfig({ config, scope })).toEqual(2);
  });

  it(`returns rounded decimal`, () => {
    expect(parseRetryConfig({ config: 1.1 })).toEqual(1);
    expect(parseRetryConfig({ config: 1.9 })).toEqual(2);
  });

  it(`returns undefined if nil`, () => {
    expect(parseRetryConfig({ config: null })).toBeUndefined();
    expect(parseRetryConfig({ config: undefined })).toBeUndefined();
  });

  it(`returns undefined if number < 0`, () => {
    expect(parseRetryConfig({ config: -1 })).toBeUndefined();
  });

  it(`returns undefined if number < min`, () => {
    expect(parseRetryConfig({ config: 0, min: 1 })).toBeUndefined();
  });
});
