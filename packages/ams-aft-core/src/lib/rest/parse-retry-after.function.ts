/**
 * Returns the Retry-After response HTTP header value in milliseconds.
 * @param value The Retry-After HTTP response header value.
 * @returns The value in milliseconds or the milliseconds remaining if is a future date. Otherwise will return null.
 * @publicApi
 * @example
 * ```js
 * // current date 'Sun, 1 Jan 2023 12:00:00 GMT'
 * parseRetryAfter('1'); // 1_000
 * parseRetryAfter('Sun, 1 Jan 2023 12:01:00 GMT'); // 60_000
 * parseRetryAfter(); // null
 * parseRetryAfter(null); // null
 * parseRetryAfter(''); // null
 * parseRetryAfter('a'); // null
 * parseRetryAfter('Sun, 1 Jan 2023 12:00:00 GMT'); // null
 * parseRetryAfter('Sun, 1 Jan 2023 11:00:00 GMT'); // null
 * parseRetryAfter('Sun, 42 Jan 2023 12:00:00 GMT'); // null
 * ```
 */
export function parseRetryAfter(value?: string | null): number | null {
  if (value == null) {
    return null;
  }

  return value.trim().length > 0 ? parseNumber(value) ?? parseDate(value) : null;
}

/**
 * If value is a valid number returns it in milliseconds.
 * Otherwise will return null.
 * @internal
 */
function parseNumber(value: string): number | null {
  const num = Number(value);

  return isNaN(num) ? null : num * 1000;
}

/**
 * If value is a valid future date returns the number of milliseconds remaining.
 * Otherwise will return null.
 * @internal
 */
function parseDate(value: string): number | null {
  const time = new Date(value).getTime();

  if (isNaN(time)) {
    return null;
  }

  const diff = time - Date.now();

  return diff > 0 ? diff : null;
}
