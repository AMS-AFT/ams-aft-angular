import { stringToObject } from '../utils';

/**
 * Returns the Keep-Alive's HTTP header timeout value in miliseconds.
 * @param value The Keep-Alive's HTTP header value.
 * @returns The valid Keep-Alive's HTTP header timeout value in miliseconds.
 * Otherwise it will return null.
 */
export function parseKeepAliveTimeout(value?: string | null): number | null {
  if (value == null) {
    return null;
  }

  const timeout = Number(stringToObject(value, { properties: ',', values: '=' })['timeout']);

  return isNaN(timeout) ? null : timeout * 1000;
}
