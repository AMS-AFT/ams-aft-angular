import { defer, MonoTypeOperatorFunction, Observable, retry, timer } from 'rxjs';

import { RetryBackoff } from './retry-backoff.function';
import { RetryBackoffConfig, RetryBackoffContext } from './retry-backoff.types';
import { retryBackoffValue } from './retry-backoff-value.function';

/**
 * The RetryBackoff Operator configuration object.
 * @template Ctx The type of the context data.
 * @template E The expected error type.
 * @publicApi
 */
export interface RetryBackoffOperatorConfig<Ctx extends RetryBackoffContext, E extends Error>
  extends Omit<RetryBackoffConfig<Ctx, E>, 'count' | 'error' | 'startTime'> {
  /**
   * Whether or not to reset the retry counter when the retried subscription emits its first value.
   * Defaults to false.
   */
  resetOnSuccess?: boolean | ((config: { context: Ctx }) => boolean);
}

/**
 * Returns an Observable that mirrors the source Observable with the exception of an error.
 *
 * By default will retry all errors up to 5 times using an exponential backoff delay
 * and a random base interval between 300 and 500 ms.
 * @template Ctx The type of the context data.
 * @template E The expected error type.
 * @param config The RetryBackoff Operator configuration object.
 * @returns A function that returns an Observable that will resubscribe to the
 * source stream when the source streams error using a backoff strategy.
 * @publicApi
 * @example
 * ```ts
 * source$.pipe(retryBackoff()).subscribe();
 * source$.pipe(retryBackoff()).subscribe();
 *
 * // Number of retries and base based on time of day
 * const isMorning = () => new Date().getHours() <= 5;
 * const maxRetries = () => (isMorning() ? 7 : 2);
 * const base = () => (isMorning() ? randomBetween(500, 600) : randomBetween(200, 300));
 *
 * // Retry only on URIError
 * const shouldRetry = ({ error }) => error instaceof URIError
 * ```
 */
export function retryBackoff<T, Ctx extends RetryBackoffContext, E extends Error>(
  config?: RetryBackoffOperatorConfig<Ctx, E>
): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>) => {
    return defer(() => {
      const count = retryBackoffValue(config?.maxRetries, { context: config?.context }) ?? 5;
      const base = retryBackoffValue(config?.base, { context: config?.context });
      const resetOnSuccess: boolean | undefined = retryBackoffValue(config?.resetOnSuccess, {
        context: config?.context
      });
      const startTime = Date.now();

      const delay = (error: E, retryCount: number) => {
        const result = RetryBackoff<Ctx, E>({
          error,
          base,
          startTime,
          count: retryCount,
          ...config
        });

        return timer(result.delay);
      };

      return source.pipe(retry({ count, delay, resetOnSuccess }));
    });
  };
}
