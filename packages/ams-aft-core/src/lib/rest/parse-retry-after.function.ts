/**
 * Returns the Retry-After's HTTP header value in miliseconds.
 * @param value The Retry-After's HTTP header value.
 * @returns The value in miliseconds or the number of milliseconds remaining if is a date.
 * Otherwise it will return null.
 */
export function parseRetryAfter(value?: string | null): number | null {
  if (value == null) {
    return null;
  }

  return value.trim().length > 0 ? parseNumber(value) ?? parseDate(value) : null;
}

/**
 * If value is a valid number returns it in milliseconds.
 * Otherwise it will return null.
 * @internal
 */
function parseNumber(value: string): number | null {
  const num = Number(value);

  return isNaN(num) ? null : num * 1000;
}

/**
 * If value is a valid future date returns the number of milliseconds remaining.
 * Otherwise it will return null.
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
