import { parseKeepAliveTimeout } from './parse-keep-alive-timeout.function';

describe('parseKeepAliveTimeout', () => {
  it(`returns timeout value in milliseconds`, () => {
    expect(parseKeepAliveTimeout('timeout=1, max=1')).toEqual(1000);
  });

  it(`returns null if value is null or undefined`, () => {
    expect(parseKeepAliveTimeout()).toBeNull();
    expect(parseKeepAliveTimeout(null)).toBeNull();
  });

  it(`returns null if value is invalid`, () => {
    expect(parseKeepAliveTimeout('')).toBeNull();
    expect(parseKeepAliveTimeout('timeout:1, max:1')).toBeNull();
    expect(parseKeepAliveTimeout('timeout=aa, max=1')).toBeNull();
  });
});
