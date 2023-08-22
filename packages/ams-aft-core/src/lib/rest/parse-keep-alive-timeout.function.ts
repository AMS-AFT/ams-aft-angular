import { stringToObject } from '../utils';

/**
 * Returns the Keep-Alive HTTP header timeout value in milliseconds.
 * @param value The Keep-Alive HTTP header value.
 * @returns The timeout value in milliseconds. Otherwise will return null.
 * @publicApi
 * @example
 * ```js
 * parseKeepAliveTimeout('timeout=1, max=1'); // 1_000
 * parseKeepAliveTimeout(); // null
 * parseKeepAliveTimeout(null); // null
 * parseKeepAliveTimeout(''); // null
 * ```
 */
export function parseKeepAliveTimeout(value?: string | null): number | null {
  if (value == null) {
    return null;
  }

  const timeout = Number(stringToObject(value, { properties: ',', values: '=' })['timeout']);

  return isNaN(timeout) ? null : timeout * 1000;
}
