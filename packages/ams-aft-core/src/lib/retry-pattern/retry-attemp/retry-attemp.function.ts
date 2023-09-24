import { DelayScope, MinScope, RetryContext, RetryScope } from '../retry.types';
import { fullJitterDelay } from '../strategies';
import { emitRetryEvent, parseRetryConfig } from '../utils';
import { RetryAttempConfig } from './retry-attemp.types';

/**
 * Calculates the delay or error in a retry attemp and exposes the used scope data.
 *
 * By default, it will run a maximum of 3 attempts using an exponential backoff with full jitter delay strategy
 * and a base interval of 500 ms.
 * @template Ctx The type of the retry context object. Defaults to undefined.
 * @template E The expected error type. Defaults to Error.
 * @param config The retry configuration object.
 * @returns The retry scope object with all the needed data to run the retry.
 * @throws The original error if should not retry.
 * @publicApi
 */
export function retryAttemp<Ctx extends RetryContext = undefined, E extends Error = Error>(
  config: RetryAttempConfig<Ctx, E>
): RetryScope<Ctx, E> {
  const minScope: MinScope<Ctx, E> = parseMinScope(config);
  const delayScope: DelayScope<Ctx, E> = parseDelayScope(config, minScope);
  const retryScope: RetryScope<Ctx, E> = parseScope(config, delayScope);
  const shouldRetry: boolean = parseShouldRetry(config, retryScope);

  if (shouldNotRetry(shouldRetry, retryScope)) {
    emitRetryEvent(config.onRetryError, retryScope);

    throw config.error;
  }

  emitRetryEvent(config.onRetry, retryScope);

  return retryScope;
}

/**
 * Parses config properties that doesn't require a minimum scope, sets attemp and maxAttemps default values
 * and calculates totalTime if startTime is defined.
 * @internal
 */
export function parseMinScope<Ctx extends RetryContext, E extends Error>(
  config: RetryAttempConfig<Ctx, E>
): MinScope<Ctx, E> {
  const scope: MinScope<Ctx, E> = {
    error: parseRetryConfig({ config: config.error }),
    attemp: parseRetryConfig({ config: config.attemp }) ?? 0,
    maxAttemps: parseRetryConfig({ config: config.maxAttemps, min: 1 }) ?? 3,
    context: parseRetryConfig({ config: config.context }),
    prevDelay: parseRetryConfig({ config: config.prevDelay }),
    startTime: parseRetryConfig({ config: config.startTime })
  };

  scope.totalTime = checkTotalTime(scope.startTime);

  return scope;
}

function checkTotalTime(startTime?: number): number | undefined {
  return startTime !== undefined ? Date.now() - startTime : undefined;
}

/**
 * Parses config properties that require a minimum scope and sets interval default value.
 * @internal
 */
function parseDelayScope<Ctx extends RetryContext, E extends Error>(
  config: RetryAttempConfig<Ctx, E>,
  scope: MinScope<Ctx, E>
): DelayScope<Ctx, E> {
  return {
    interval: parseRetryConfig({ config: config.interval, scope }) ?? 500,
    maxTime: parseRetryConfig({ config: config.maxTime, scope }),
    ...scope
  };
}

/**
 * Parses config properties that require a delay scope and sets delay and minDelay default values,
 * modifying the delay with the min and max values and the first retry logic.
 * @internal
 */
function parseScope<Ctx extends RetryContext, E extends Error>(
  config: RetryAttempConfig<Ctx, E>,
  scope: DelayScope<Ctx, E>
): RetryScope<Ctx, E> {
  const retryScope: RetryScope<Ctx, E> = {
    delay: parseRetryConfig({ config: config.delay, scope }) ?? fullJitterDelay(scope),
    minDelay: parseRetryConfig({ config: config.minDelay, scope }) ?? 0,
    maxDelay: parseRetryConfig({ config: config.maxDelay, scope }),
    firstDelay: parseRetryConfig({ config: config.firstDelay, scope }),
    ...scope
  };

  retryScope.delay = checkMinDelay<Ctx, E>(retryScope);
  retryScope.delay = checkMaxDelay<Ctx, E>(retryScope);
  retryScope.delay = checkFirstDelay<Ctx, E>(retryScope);

  return retryScope;
}

/**
 * Returns minDelay if is defined and is bigger than delay.
 * @internal
 */
function checkMinDelay<Ctx extends RetryContext, E extends Error>(scope: RetryScope<Ctx, E>): number {
  return Math.max(scope.minDelay, scope.delay);
}

/**
 * Returns maxDelay if is defined and is lower than delay.
 * @internal
 */
function checkMaxDelay<Ctx extends RetryContext, E extends Error>(scope: RetryScope<Ctx, E>): number {
  return scope.maxDelay !== undefined ? Math.min(scope.maxDelay, scope.delay) : scope.delay;
}

/**
 * Returns firstDelay if is defined and is the first attemp.
 * @internal
 */
function checkFirstDelay<Ctx extends RetryContext, E extends Error>(scope: RetryScope<Ctx, E>): number {
  return scope.firstDelay !== undefined && scope.attemp === 1 ? scope.firstDelay : scope.delay;
}

/**
 * Parses shouldRetry config property and sets the default value.
 * @internal
 */
function parseShouldRetry<Ctx extends RetryContext, E extends Error>(
  config: RetryAttempConfig<Ctx, E>,
  scope: RetryScope<Ctx, E>
): boolean {
  return parseRetryConfig({ config: config.shouldRetry, scope }) ?? true;
}

/**
 * Returns true if shouldRetry is false, attemp is lower than 1 or bigger than maxAttemps
 * or this attemp should start the retry after totalTime.
 * @internal
 */
function shouldNotRetry<Ctx extends RetryContext, E extends Error>(
  shouldRetry: boolean,
  scope: RetryScope<Ctx, E>
): boolean {
  return scope.attemp < 1 || scope.attemp > scope.maxAttemps || !shouldRetry || exceedsMaxTime(scope);
}

/**
 * Returns true if this attemp should start the retry after totalTime.
 * @internal
 */
function exceedsMaxTime<Ctx extends RetryContext, E extends Error>(scope: RetryScope<Ctx, E>): boolean {
  return scope.totalTime !== undefined && scope.maxTime !== undefined
    ? scope.totalTime + scope.delay > scope.maxTime
    : false;
}
