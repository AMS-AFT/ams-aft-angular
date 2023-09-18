import { retryBackoffValue } from './retry-backoff-value.function';

describe('retryBackoffValue', () => {
  it(`returns value`, () => {
    expect(retryBackoffValue(1)).toEqual(1);
  });

  it(`returns function`, () => {
    const value = () => 1;
    expect(retryBackoffValue(value)).toEqual(1);
  });

  it(`returns function with args`, () => {
    const value = (v1: number, v2: string) => 0 + v1 + Number(v2);
    expect(retryBackoffValue(value, 1, '1')).toEqual(2);
  });

  it(`returns null`, () => {
    expect(retryBackoffValue(null)).toBeNull();
  });

  it(`returns undefined`, () => {
    expect(retryBackoffValue(undefined)).toBeUndefined();
  });

  it(`returns rounded decimal`, () => {
    expect(retryBackoffValue(1.1)).toEqual(1);
    expect(retryBackoffValue(() => 1.1)).toEqual(1);
    expect(retryBackoffValue(1.9)).toEqual(2);
    expect(retryBackoffValue(() => 1.9)).toEqual(2);
  });
});
