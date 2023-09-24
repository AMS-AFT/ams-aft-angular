import { DelayScope, MinScope, RetryContext, RetryScope } from '../retry.types';

/**
 * The retry attemp configuration object.
 *
 * These configuration elements allows to modify the default behavior of the retry implementation.
 * Each property defines its default value and the logic it uses for calculations.
 * @template Ctx The type of the retry context object.
 * @template E The expected error type.
 * @publicApi
 */
export interface RetryAttempConfig<Ctx extends RetryContext, E extends Error> {
  /**
   * The error that triggered the retry.
   */
  error: E | (() => E);

  /**
   * The retry attemp number.
   *
   * Rounds to the nearest integer.
   * Throws error if is less than 1.
   */
  attemp: number | (() => number);

  /**
   * The context data used to calculate the retry configurations.
   */
  context?: Ctx | (() => Ctx);

  /**
   * The previous delay in milliseconds.
   *
   * Rounds to the nearest integer.
   * Sets to undefined if is less than 0.
   */
  prevDelay?: number | (() => number);

  /**
   * The millisecond in which the operation began.
   *
   * Rounds to the nearest integer.
   * Sets to undefined if is less than 0.
   * Sets totalTime if is defined.
   */
  startTime?: number | (() => number);

  /**
   * The maximum number of attempts.
   *
   * Defaults to 3.
   * Rounds to the nearest integer.
   * Sets to defaut value if is less than 1.
   * Throws error if is less than attemp.
   */
  maxAttemps?: number | (() => number);

  /**
   * The base interval in milliseconds.
   *
   * Defaults to 500 ms.
   * Rounds to the nearest integer.
   * Sets to defaut value if is less than 0.
   */
  interval?: number | ((scope?: MinScope<Ctx, E>) => number);

  /**
   * The maximum milliseconds since the operation began.
   *
   * Rounds to the nearest integer.
   * Sets to undefined if is less than 0.
   * Throws error if the next delay time exceeds this value.
   */
  maxTime?: number | ((scope?: MinScope<Ctx, E>) => number);

  /**
   * The number of milliseconds to delay before retrying.
   *
   * Defaults to an exponential backoff with full jitter strategy.
   * Rounds to the nearest integer.
   * Sets to 0 if is less than 0.
   */
  delay?: number | ((scope?: DelayScope<Ctx, E>) => number);

  /**
   * The minimum number of milliseconds to delay before retrying.
   *
   * Defaults to 0.
   * Rounds to the nearest integer.
   * Sets to default value if is less than 0.
   * Sets delay with this value if delay is lower.
   */
  minDelay?: number | ((scope?: DelayScope<Ctx, E>) => number);

  /**
   * The maximum number of milliseconds to delay before retrying.
   *
   * Rounds to the nearest integer.
   * Sets to undefined if is less than 0.
   * Sets delay with this value if delay is bigger.
   * Has preference over minDelay.
   */
  maxDelay?: number | ((scope?: DelayScope<Ctx, E>) => number);

  /**
   * The number of milliseconds to delay before retrying the first time.
   *
   * Rounds to the nearest integer.
   * Sets to undefined if is less than 0.
   * Has preference over minDelay and maxDelay.
   */
  firstDelay?: number | ((scope?: DelayScope<Ctx, E>) => number);

  /**
   * Whether or not should retry on error.
   *
   * Defaults to true.
   */
  shouldRetry?: boolean | ((scope?: RetryScope<Ctx, E>) => boolean);

  /**
   * Emits if retry with the scope used in this attemp.
   */
  onRetry?: (scope?: RetryScope<Ctx, E>) => void;

  /**
   * Emits if throws the error with the scope used in this attemp.
   */
  onRetryError?: (scope?: RetryScope<Ctx, E>) => void;
}
