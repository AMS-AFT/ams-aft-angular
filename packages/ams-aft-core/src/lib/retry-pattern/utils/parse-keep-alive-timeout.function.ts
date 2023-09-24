import { SECOND_AS_MILLISECOND, stringToObject } from '../../utils';

/**
 * Returns the Keep-Alive HTTP header timeout value in milliseconds.
 * @param value The Keep-Alive HTTP header value.
 * @returns The timeout value in milliseconds. Null if it doesn't exist or invalid format.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive Keep-Alive}
 * @publicApi
 * @example
 * ```js
 * parseKeepAliveTimeout('timeout=1, max=1'); // 1_000
 * parseKeepAliveTimeout(); // null
 * parseKeepAliveTimeout(null); // null
 * parseKeepAliveTimeout(''); // null
 * parseKeepAliveTimeout('timeout:1, max:1'); // null
 * ```
 */
export function parseKeepAliveTimeout(value?: string | null): number | null {
  if (value == null) {
    return null;
  }

  const timeout = Number(stringToObject(value, { property: ',', value: '=' })['timeout']);

  return isNaN(timeout) ? null : timeout * SECOND_AS_MILLISECOND;
}
