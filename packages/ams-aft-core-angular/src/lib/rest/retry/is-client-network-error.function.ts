import { HttpErrorResponse } from '@angular/common/http';

/**
 * Checks if the returned HttpErrorResponse is due to a client network error.
 * @param error The HttpErrorResponse.
 * @returns True if the HttpErrorResponse is due to a client network error. Otherwise false.
 * @publicApi
 * @example
 * ```ts
 * const networkError = new HttpErrorResponse({ status: 0, error: new ProgressEvent('') });
 * isClientNetworkError(networkError); // true
 * isClientNetworkError(new HttpErrorResponse({ status: 500 })); // false
 * ```
 */
export function isClientNetworkError<E extends HttpErrorResponse>(error: E): boolean {
  return error.status === 0 && error.error instanceof ProgressEvent;
}
