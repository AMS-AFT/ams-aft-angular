import { parseRetryAfter } from './parse-retry-after.function';

const realNow = Date.now;

describe('parseRetryAfter', () => {
  beforeAll(() => {
    global.Date.now = jest.fn(() => new Date('2023-01-01T12:00:00Z').getTime());
  });

  afterAll(() => {
    global.Date.now = realNow;
  });

  it(`returns value in miliseconds or the number`, () => {
    expect(parseRetryAfter('1')).toEqual(1000);
  });

  it(`returns milliseconds remaining if is a date`, () => {
    expect(parseRetryAfter('2023-01-01T12:01:00Z')).toEqual(60000);
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
    expect(parseRetryAfter('2023-01-01T12:00:00Z')).toBeNull();
  });

  it(`returns null if value is past date`, () => {
    expect(parseRetryAfter('2023-01-01T00:00:00Z')).toBeNull();
  });

  it(`returns null if value is invalid date`, () => {
    expect(parseRetryAfter('2023-24-01T00:00:00Z')).toBeNull();
  });
});
