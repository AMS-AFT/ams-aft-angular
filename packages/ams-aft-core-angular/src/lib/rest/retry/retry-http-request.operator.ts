import {
  getBackoffDelay,
  parseKeepAliveTimeout,
  parseRetryAfter,
  retryBackoff,
  RetryBackoffConfig,
  RetryBackoffScope,
  SECOND_AS_MILLISECOND
} from '@ams-aft/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction } from 'rxjs';

import { isClientNetworkError } from './is-client-network-error.function';

/**
 * Retries an HttpClient request when returns an HttpErrorResponse.
 *
 * By default it will retry the failed HTTP request up to 3 times with a delay that increases exponentially
 * between attempts, as long as it's a network error or the status is one of the following:
 * 408, 429, 500, 502, 503, 504. It will use the value of the Retry-After HTTP header if exists instead of the
 * backoff delay, and the Keep-Alive Timeout HTTP header or 100s, whichever is less, as the operation limit.
 * @param config The RetryBackoffConfig configuration object.
 * @returns A function that returns an Angular Http Request Observable that will resubscribe to the
 * source stream when the source streams an HttpErrorResponse using a backoff strategy.
 * @see {@link RetryBackoffConfig}
 * @see {@link retryBackoff}
 * @publicApi
 */
export function retryHttpRequest<T, E extends HttpErrorResponse>(
  config?: RetryBackoffConfig<E>
): MonoTypeOperatorFunction<T> {
  const merged: RetryBackoffConfig<E> = {
    count: DEFAULT_RETRY_COUNT,
    shouldRetry: getShouldRetry,
    delay: getDelay,
    shouldNotRetry: getShouldNotRetry,
    ...(config ?? {})
  };

  return retryBackoff(merged);
}

/**
 * Default safe retry attemps.
 * @publicApi
 */
export const DEFAULT_RETRY_COUNT = 3;

/**
 * Default safe HTTP error codes that should retry.
 * @publicApi
 */
export const DEFAULT_RETRY_HTTP_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Returns true if the HttpErrorResponse status is in the list of safe HTTP error codes
 * or a client connection error occurs.
 * @internal
 */
function getShouldRetry<E extends HttpErrorResponse>(scope: RetryBackoffScope<E>) {
  return DEFAULT_RETRY_HTTP_CODES.includes(scope.error.status) || isClientNetworkError(scope.error);
}

/**
 * Returns value of the Retry-After's HTTP header, if it exists. Otherwise the calculated backoff interval.
 * @internal
 */
function getDelay<E extends HttpErrorResponse>(scope: RetryBackoffScope<E>): number {
  const retryAfter = parseRetryAfter(scope.error.headers.get('Retry-After'));

  return retryAfter ?? getBackoffDelay(scope);
}

/**
 * Checks if the total operation time exceeds the safe maximum of 100 seconds
 * or the value of the Keep-Alive's HTTP header timeout value, whichever is lower.
 * @internal
 */
function getShouldNotRetry<E extends HttpErrorResponse>(scope: RetryBackoffScope<E> & { delay: number }) {
  const maxTime = 100 * SECOND_AS_MILLISECOND;
  const keepAlive = parseKeepAliveTimeout(scope.error.headers.get('Keep-Alive'));
  const maxTotal = keepAlive != null ? Math.min(keepAlive, maxTime) : maxTime;

  return scope.totalTime + scope.delay > maxTotal;
}
