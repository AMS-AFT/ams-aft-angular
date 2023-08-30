import { defer, MonoTypeOperatorFunction, Observable, retry, timer } from 'rxjs';

import { randomBetween, valueOrFn, WithRequired } from '../utils';

/**
 * The scope data generated by retryBackoff.
 * @publicApi
 */
export interface RetryBackoffScope<E extends Error> {
  /**
   * The maximum number of times to retry.
   */
  count: number;
  /**
   * The base interval used to calculate the delay.
   */
  baseInterval: number;
  /**
   * Whether or not to reset the retry counter when the retried subscription emits its first value.
   */
  resetOnSuccess: boolean;
  /**
   * The error that caused the current retry.
   */
  error: E;
  /**
   * The retry attemp number.
   */
  retryCount: number;
  /**
   * The milliseconds since the start of the retries.
   */
  totalTime: number;
}

/**
 * The retryBackoff operator configuration object.
 * @publicApi
 */
export interface RetryBackoffConfig<E extends Error> {
  /**
   * The maximum number of times to retry.
   * Defaults to 5.
   */
  count?: number | (() => number);
  /**
   * The initial interval in milliseconds.
   * Defaults to random integer between 300 and 500 ms.
   */
  baseInterval?: number | (() => number);
  /**
   * The number of milliseconds to delay before retrying.
   * Defaults to `baseInterval * 2^(retryCount-1)`.
   */
  delay?: number | ((scope: RetryBackoffScope<E>) => number);
  /**
   * Whether or not should resubscribe to the source stream when the source stream errors.
   * Defaults to true.
   */
  shouldRetry?: boolean | ((scope: RetryBackoffScope<E> & { delay: number }) => boolean);
  /**
   * Perform actions or side-effects that do not affect the retry.
   */
  tap?: (scope: RetryBackoffScope<E> & { delay: number }) => void;
  /**
   * Whether or not to reset the retry counter when the retried subscription emits its first value.
   * Defaults to false.
   */
  resetOnSuccess?: boolean | (() => boolean);
}

/**
 * Returns an Observable that mirrors the source Observable with the exception of an error.
 *
 * By default will retry all errors up to 5 times using an exponential backoff
 * and a random base interval between 300 and 500 ms.
 * @param config The RetryBackoffConfig configuration object.
 * @returns A function that returns an Observable that will resubscribe to the
 * source stream when the source stream errors using a backoff strategy.
 * @publicApi
 * @example
 * ```ts
 * source$.pipe(retryBackoff()).subscribe()
 * ```
 */
export function retryBackoff<T, E extends Error>(config?: RetryBackoffConfig<E>): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>) => {
    const merged: InnerRetryBackoffConfig<E> = {
      count: 5,
      baseInterval: getBaseInterval,
      shouldRetry: true,
      delay: getBackoffDelay,
      resetOnSuccess: false,
      ...(config ?? {})
    };

    return defer(() => {
      const initiatTime = Date.now();
      const count = valueOrFn(merged.count);
      const baseInterval = valueOrFn(merged.baseInterval);
      const resetOnSuccess = valueOrFn(merged.resetOnSuccess);

      const getDelay = (error: E, retryCount: number) => {
        const scope: RetryBackoffScope<E> = {
          count,
          baseInterval,
          resetOnSuccess,
          error,
          retryCount,
          totalTime: Date.now() - initiatTime
        };

        const delay = valueOrFn(merged.delay, scope);

        if (delay < 0 || !valueOrFn(merged.shouldRetry, { delay, ...scope })) {
          throw error;
        }

        if (merged.tap != null) {
          merged.tap({ delay, ...scope });
        }

        return timer(delay);
      };

      return source.pipe(
        retry({
          count,
          delay: getDelay,
          resetOnSuccess
        })
      );
    });
  };
}

/**
 * @internal
 */
type InnerRetryBackoffConfig<E extends Error> = WithRequired<
  RetryBackoffConfig<E>,
  'count' | 'baseInterval' | 'shouldRetry' | 'delay' | 'resetOnSuccess'
>;

/**
 * Returns a random integer as base interval.
 * @internal
 */
function getBaseInterval(): number {
  const minInterval = 300;
  const maxInterval = 500;

  return randomBetween(minInterval, maxInterval);
}

/**
 * Returns the number of milliseconds to delay before retrying using an exponential backoff strategy.
 * @param scope The scope data generated by retryBackoff.
 * @returns The number of milliseconds to delay.
 * @publicApi
 */
export function getBackoffDelay<E extends Error>(scope: RetryBackoffScope<E>): number {
  return Math.pow(2, scope.retryCount - 1) * scope.baseInterval;
}
