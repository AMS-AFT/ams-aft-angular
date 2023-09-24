import { defer, MonoTypeOperatorFunction, Observable, retry, tap, timer } from 'rxjs';

import { RetryConfig, RetryContext, RetryScope } from '../retry.types';
import { retryAttemp } from '../retry-attemp';
import { emitRetryEvent, parseRetryConfig } from '../utils';

/**
 * Returns an Observable that mirrors the source Observable with the exception of an error using a retry pattern.
 *
 * By default, it will run a maximum of 3 attempts using an exponential backoff with full jitter delay strategy
 * and a base interval of 500 ms.
 * @template Ctx The type of the retry operator context data. Defaults to `RetryOperatorContext`.
 * @template E The expected error type. Defaults to `Error`.
 * @param config The retry pattern operator configuration object.
 * @returns A function that returns an Observable that will resubscribe to the
 * source stream when the source streams error using a backoff strategy.
 * @publicApi
 * @example
 * ```ts
 * // Uses default config.
 * source$.pipe(retryPattern()).subscribe();
 *
 * // Number of retries and interval based on time of day
 * const isMorning = () => (new Date().getHours() <= 5);
 * const maxAttemps = () => (isMorning() ? 4 : 2);
 * const interval = () => (isMorning() ? 1000 : 500);
 * source$.pipe(retryPattern({ maxAttemps, interval })).subscribe();
 *
 * // Retry only on URIError
 * const shouldRetry = ({ error }) => (error instaceof URIError)
 * source$.pipe(retryPattern({ shouldRetry })).subscribe();
 * ```
 */
export function retryPattern<T, Ctx extends RetryContext = RetryContext, E extends Error = Error>(
  config?: RetryConfig<Ctx, E>
): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>): Observable<T> => {
    return defer((): Observable<T> => {
      const count: number = parseRetryConfig({ config: config?.maxAttemps, min: 1 }) ?? 3;
      const resetOnSuccess: boolean | undefined = parseRetryConfig({ config: config?.resetOnSuccess });
      const startTime: number = Date.now();
      const onSuccess = config?.onSuccess;
      let prevScope: RetryScope<Ctx, E> | undefined;
      let prevDelay: number | undefined = undefined;

      const delay = (error: E, retryCount: number): Observable<number> => {
        const scope: RetryScope<Ctx, E> = retryAttemp<Ctx, E>({
          error,
          attemp: retryCount,
          prevDelay,
          startTime,
          maxAttemps: count,
          ...config
        });

        prevScope = scope;
        prevDelay = scope.delay;

        return timer(scope.delay);
      };

      return source
        .pipe<T>(retry<T>({ count, delay, resetOnSuccess }))
        .pipe(tap((value: T) => emitRetryEvent(onSuccess, prevScope, value)));
    });
  };
}
