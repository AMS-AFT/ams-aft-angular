import { parseRetryAfter } from './parse-retry-after.function';

const realNow = Date.now;

describe('parseRetryAfter', () => {
  beforeAll(() => {
    global.Date.now = jest.fn(() => new Date('Sun, 1 Jan 2023 12:00:00 GMT').getTime());
  });

  afterAll(() => {
    global.Date.now = realNow;
  });

  it(`returns value in miliseconds or the number`, () => {
    expect(parseRetryAfter('1')).toEqual(1_000);
  });

  it(`returns milliseconds remaining if is a date`, () => {
    expect(parseRetryAfter('Sun, 1 Jan 2023 12:01:00 GMT')).toEqual(60_000);
  });

  it(`returns null if value is null or undefined`, () => {
    expect(parseRetryAfter()).toBeNull();
    expect(parseRetryAfter(null)).toBeNull();
  });

  it(`returns null if value is invalid number`, () => {
    expect(parseRetryAfter('')).toBeNull();
    expect(parseRetryAfter('  ')).toBeNull();
    expect(parseRetryAfter('a')).toBeNull();
  });

  it(`returns null if value is exact date`, () => {
    expect(parseRetryAfter('Sun, 1 Jan 2023 12:00:00 GMT')).toBeNull();
  });

  it(`returns null if value is past date`, () => {
    expect(parseRetryAfter('Sun, 1 Jan 2023 11:00:00 GMT')).toBeNull();
  });

  it(`returns null if value is invalid date`, () => {
    expect(parseRetryAfter('Sun, 42 Jan 2023 12:00:00 GMT')).toBeNull();
  });
});
