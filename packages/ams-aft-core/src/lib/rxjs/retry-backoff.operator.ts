import { defer, MonoTypeOperatorFunction, Observable, retry, timer } from 'rxjs';

import { getRandomBetween, getValueOrFn, WithRequired } from '../utils';

/**
 * The internal data generated by {@link retryBackoff}.
 */
export interface RetryBackoffData<E extends Error> {
  /**
   * The {@link retryBackoff} operator configuration object.
   */
  config: RetryBackoffConfig<E>;
  /**
   * The error that caused the last retry.
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
 * The {@link retryBackoff} operator configuration object.
 */
export interface RetryBackoffConfig<E extends Error> {
  /**
   * The maximum number of times to retry.
   * If count is omitted will be set to 5.
   */
  count?: number;
  /**
   * Whether or not should resubscribe to the source stream when the source stream errors.
   */
  shouldRetry?: boolean | ((data: RetryBackoffData<E>) => boolean);
  /**
   * The initial interval in milliseconds.
   */
  baseInterval?: number | ((data: RetryBackoffData<E>) => number);
  /**
   * The calculated number of milliseconds to delay before retrying.
   */
  delay?: (data: RetryBackoffData<E> & { baseInterval: number }) => number;
  /**
   * Whether or not should desubscribe to the source stream that should retry.
   */
  shouldNotRetry?: boolean | ((data: RetryBackoffData<E> & { delay: number; baseInterval: number }) => boolean);
  /**
   * Perform actions or side-effects that do not affect the retry.
   */
  tap?: (data: RetryBackoffData<E> & { delay: number; baseInterval: number }) => void;
  /**
   * Whether or not to reset the retry counter when the retried subscription emits its first value.
   */
  resetOnSuccess?: boolean;
}

/**
 * Returns an Observable that mirrors the source Observable with the exception of an error using a backoff strategy.
 * @param config The {@link RetryBackoffConfig} configuration object.
 * @returns A function that returns an Observable that will resubscribe to the
 * source stream when the source stream errors using a backoff strategy.
 */
export function retryBackoff<T, E extends Error>(config?: RetryBackoffConfig<E>): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>) => {
    const initiatTime = Date.now();
    const merged: InnerRetryBackoffConfig<E> = {
      count: 5,
      baseInterval,
      shouldRetry: true,
      delay: getExponentialBackoffDelay,
      ...(config ?? {})
    };

    const delay = (error: E, retryCount: number) => {
      const totalTime = Date.now() - initiatTime;
      const data: RetryBackoffData<E> = {
        error,
        retryCount,
        totalTime,
        config: merged
      };

      if (!getValueOrFn(merged.shouldRetry, data)) {
        throw error;
      }

      const baseInterval = getValueOrFn(merged.baseInterval, data);
      const intervalDelay = merged.delay({ baseInterval, ...data });

      if (intervalDelay <= 0 || getValueOrFn(merged.shouldNotRetry, { baseInterval, delay: intervalDelay, ...data })) {
        throw error;
      }

      if (merged.tap != null) {
        merged.tap({ baseInterval, delay: intervalDelay, ...data });
      }

      return timer(intervalDelay);
    };

    return defer(() => {
      return source.pipe(
        retry({
          delay,
          count: merged.count,
          resetOnSuccess: merged.resetOnSuccess
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
  'baseInterval' | 'shouldRetry' | 'delay'
>;

/**
 * Returns a random integer base interval.
 * @internal
 */
function baseInterval(): number {
  const minInterval = 300;
  const maxInterval = 500;

  return getRandomBetween(minInterval, maxInterval);
}

/**
 * Returns the result of the exponential backoff delay.
 * @param data The internal data generated by {@link retryBackoff}.
 * @returns The result of the exponential function.
 */
export function getExponentialBackoffDelay<E extends Error>(
  data: RetryBackoffData<E> & { baseInterval: number }
): number {
  return Math.pow(2, data.retryCount - 1) * data.baseInterval;
}
