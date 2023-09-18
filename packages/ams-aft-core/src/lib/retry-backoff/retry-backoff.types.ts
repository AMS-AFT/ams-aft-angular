export type RetryBackoffContext = Record<PropertyKey, unknown> | undefined;

/**
 * The RetryBackoff configuration object.
 *
 * These configuration elements allow you to modify the default behavior of the retry backoff pattern.
 * @template Ctx The type of the context data.
 * @template E The expected error type.
 * @publicApi
 */
export interface RetryBackoffConfig<Ctx extends RetryBackoffContext, E extends Error> {
  /**
   * The context data used to calculate other configurations.
   */
  context?: Ctx;
  /**
   * The error that triggered the retry.
   */
  error: E;
  /**
   * The retry backoff counter.
   *
   * - Rounds to the nearest integer.
   * - Throws error if `count <= 0`.
   */
  count: number | ((config: { context: Ctx; error: E }) => number);
  /**
   * The maximum number of times to retry.
   *
   * - Defaults to 5.
   * - Rounds to the nearest integer.
   * - Throws error if `maxRetries <= 0`.
   * - Throws error if `maxRetries < count`.
   */
  maxRetries?: number | ((config: { context: Ctx; error: E }) => number);
  /**
   * The base interval in milliseconds.
   *
   * - Defaults to random integer between 300 and 500.
   * - Rounds to the nearest integer.
   * - `base = 0` if `base < 0`.
   */
  base?: number | ((config: { context: Ctx; error: E }) => number);
  /**
   * The millisecond in which the operation began.
   *
   * - Rounds to the nearest integer.
   * - Sets to undefined if `startTime < 0`.
   * - Sets `totalTime` if `startTime` is defined.
   */
  startTime?: number | ((config: { context: Ctx; error: E }) => number);
  /**
   * The maximum milliseconds since the operation began.
   *
   * - Rounds to the nearest integer.
   * - Sets to undefined if `maxTime < 0`.
   * - Throws error if `totalTime + delay > maxTime`.
   */
  maxTime?: number | ((config: { context: Ctx; error: E }) => number);
  /**
   * The number of milliseconds to delay before retrying.
   *
   * - Defaults to `({ base, count }) => (base * 2^(count-1))`.
   * - Rounds to the nearest integer.
   * - `delay = 0` if `delay < 0`.
   * - `delay = maxDelay` if `maxDelay < delay`.
   */
  delay?: number | ((config: PartialRetryBackoffResult<Ctx, E>) => number);
  /**
   * The maximum number of milliseconds to delay before retrying.
   *
   * - Rounds to the nearest integer.
   * - Sets to undefined if `maxDelay < 0`.
   * - `delay = maxDelay` if `maxDelay < delay`.
   */
  maxDelay?: number | ((config: PartialRetryBackoffResult<Ctx, E>) => number);
  /**
   * Whether or not should retry on error.
   *
   * - Defaults to true.
   */
  shouldRetry?: boolean | ((config: RetryBackoffResult<Ctx, E>) => boolean);
  /**
   * Whether or not shouldn't retry on error.
   *
   * - Defaults to false.
   */
  shouldNotRetry?: boolean | ((config: RetryBackoffResult<Ctx, E>) => boolean);
  /**
   * Performs actions or side-effects that doesn't affect the retry.
   */
  tap?: (config: RetryBackoffResult<Ctx, E>) => void;
}

/**
 * The RetryBackoff result object.
 * @template Ctx The type of the context data.
 * @template E The expected error type.
 * @publicApi
 */
export interface RetryBackoffResult<Ctx extends RetryBackoffContext, E extends Error> {
  /**
   * The context data used to calculate other configurations.
   */
  context?: Ctx;
  /**
   * The error that triggered the retry.
   */
  error: E;
  /**
   * The retry number.
   */
  count: number;
  /**
   * The maximum number of times to retry.
   */
  maxRetries: number;
  /**
   * The base interval in milliseconds.
   */
  base: number;
  /**
   * The millisecond in which the operation began.
   */
  startTime?: number;
  /**
   * The number of milliseconds since the operation began.
   */
  totalTime?: number;
  /**
   * The maximum milliseconds since the operation began.
   */
  maxTime?: number;
  /**
   * The number of milliseconds to delay before retrying.
   */
  delay: number;
  /**
   * The maximum number of milliseconds to delay before retrying.
   */
  maxDelay?: number;
}

/**
 * The partial RetryBackoff result object.
 * @template Ctx The type of the context data.
 * @template E The expected error type.
 * @publicApi
 */
export type PartialRetryBackoffResult<Ctx extends RetryBackoffContext, E extends Error> = Omit<
  RetryBackoffResult<Ctx, E>,
  'delay' | 'maxDelay'
>;
