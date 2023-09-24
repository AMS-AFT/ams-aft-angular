import { RetryAttempConfig } from './retry-attemp';

/**
 * The context data used to calculate the retry configurations.
 */
export type RetryContext = Record<PropertyKey, unknown> | undefined;

export type RetryConfig<Ctx extends RetryContext, E extends Error> = Omit<
  RetryAttempConfig<Ctx, E>,
  'error' | 'attemp' | 'startTime' | 'prevDelay'
> & {
  /**
   * Controls whether or not the attemp is shared among all the retries due to errors.
   *
   * Defaults to false.
   */
  resetOnSuccess?: boolean | (() => boolean);

  /**
   * Emits if success with the scope used in the last attemp.
   */
  onSuccess?: <T>(scope?: RetryScope<Ctx, E>, value?: T) => void;
};

/**
 * The minimum scope properties needed to calculate each rety attempt.
 *
 * These values must be provided by each implementation to get the retry attempt scope object.
 * @template Ctx The type of the retry context object.
 * @template E The expected error type.
 * @publicApi
 */
export type MinScope<Ctx extends RetryContext, E extends Error> = Pick<
  RetryScope<Ctx, E>,
  'error' | 'attemp' | 'maxAttemps' | 'context' | 'prevDelay' | 'startTime' | 'totalTime'
>;

/**
 * The scope properties used to calculate each rety attempt delay.
 * @template Ctx The type of the retry context object.
 * @template E The expected error type.
 * @publicApi
 */
export type DelayScope<Ctx extends RetryContext, E extends Error> = Omit<
  RetryScope<Ctx, E>,
  'delay' | 'firstDelay' | 'minDelay' | 'maxDelay'
>;

/**
 * The scope properties used in each rety attempt.
 * @template Ctx The type of the retry context object.
 * @template E The expected error type.
 * @publicApi
 */
export interface RetryScope<Ctx extends RetryContext, E extends Error>
  extends Omit<RetryAttempConfig<Ctx, E>, 'shouldRetry' | 'onRetry' | 'onRetryError'> {
  error: E;
  attemp: number;
  context?: Ctx;
  prevDelay?: number;
  startTime?: number;
  maxAttemps: number;
  interval: number;
  maxTime?: number;
  delay: number;
  firstDelay?: number;
  minDelay: number;
  maxDelay?: number;

  /**
   * The number of milliseconds since the operation began.
   */
  totalTime?: number;
}
