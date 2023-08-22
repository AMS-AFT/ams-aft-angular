import {
  getExponentialBackoffDelay,
  parseKeepAliveTimeout,
  parseRetryAfter,
  retryBackoff,
  RetryBackoffConfig,
  RetryBackoffData
} from '@ams-aft/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction } from 'rxjs';

/**
 * Returns an Angular Http Request Observable that mirrors the source Observable with the
 * exception of an HttpErrorResponse using a backoff strategy.
 * @param config The RetryBackoffConfig configuration object.
 * @returns A function that returns an Angular Http Request Observable that will resubscribe to the
 * source stream when the source streams an HttpErrorResponse using a backoff strategy.
 * @publicApi
 */
export function retryHttpRequest<T, E extends HttpErrorResponse>(
  config?: RetryBackoffConfig<E>
): MonoTypeOperatorFunction<T> {
  const merged: RetryBackoffConfig<E> = {
    count: DEFAULT_RETRY_COUNT,
    shouldRetry,
    delay,
    shouldNotRetry,
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
 * Returns true if the HttpErrorResponse status is in the list of safe HTTP error codes.
 * @internal
 */
function shouldRetry<E extends HttpErrorResponse>(data: RetryBackoffData<E>) {
  return DEFAULT_RETRY_HTTP_CODES.includes(data.error.status);
}

/**
 * Default safe HTTP error codes that should retry.
 * @publicApi
 */
export const DEFAULT_RETRY_HTTP_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Returns value of the Retry-After's HTTP header, if it exists. Otherwise the calculated exponential backoff interval.
 * @internal
 */
function delay<E extends HttpErrorResponse>(data: RetryBackoffData<E> & { baseInterval: number }): number {
  const retryAfter = parseRetryAfter(data.error.headers.get('Retry-After'));

  return retryAfter ?? getExponentialBackoffDelay(data);
}

/**
 * Checks if the total operation time exceeds the hardoded safe maximum of 100 seconds
 * or the value of the Keep-Alive's HTTP header timeout value, whichever is lower.
 * @internal
 */
function shouldNotRetry<E extends HttpErrorResponse>(
  data: RetryBackoffData<E> & { delay: number; baseInterval: number }
) {
  const maxTime = 100_000;
  const keepAlive = parseKeepAliveTimeout(data.error.headers.get('Keep-Alive'));
  const maxTotal = keepAlive != null ? Math.min(keepAlive, maxTime) : maxTime;

  return data.totalTime + data.delay > maxTotal;
}
