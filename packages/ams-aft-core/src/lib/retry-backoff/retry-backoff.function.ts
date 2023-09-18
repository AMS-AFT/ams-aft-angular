import { MarkOptional } from 'ts-essentials';

import { randomBetween } from '../utils';
import {
  PartialRetryBackoffResult,
  RetryBackoffConfig,
  RetryBackoffContext,
  RetryBackoffResult
} from './retry-backoff.types';
import { retryBackoffValue } from './retry-backoff-value.function';
/**
 * The RetryBackoff pattern logic.
 * @template Ctx The type of the context data.
 * @template E The expected error type.
 * @param config The RetryBackoff configuration object.
 * @returns The RetryBackoff result object.
 * @throws The original error if should not retry.
 * @publicApi
 */
export function RetryBackoff<Ctx extends RetryBackoffContext = undefined, E extends Error = Error>(
  config: RetryBackoffConfig<Ctx, E>
): RetryBackoffResult<Ctx, E> {
  const partial = parsePartial<Ctx, E>(config);
  const result = parseResult<Ctx, E>(config, partial);
  const should = parseShould<Ctx, E>(config, result);

  if (shouldNotRetry<Ctx, E>(result, should)) {
    throw config.error;
  }

  if (config.tap != null) {
    config.tap(result);
  }

  return result;
}

/**
 * @internal
 */
function parsePartial<Ctx extends RetryBackoffContext, E extends Error>(
  config: RetryBackoffConfig<Ctx, E>
): PartialRetryBackoffResult<Ctx, E> {
  const partial = {
    maxRetries: 5,
    base: randomBetween(300, 500),
    ...getPartialFromConfig(config)
  };

  partial.base = asPositiveIntegerOrZero(partial.base);
  partial.startTime = asPositiveIntegerOrUndefined(partial.startTime);
  partial.maxTime = asPositiveIntegerOrUndefined(partial.maxTime);

  if (partial.startTime != null) {
    partial.totalTime = Date.now() - partial.startTime;
  }

  return partial;
}

/**
 * @internal
 */
type OptionalPartialResult<Ctx extends RetryBackoffContext, E extends Error> = MarkOptional<
  PartialRetryBackoffResult<Ctx, E>,
  'maxRetries' | 'base'
>;

/**
 * @internal
 */
type Key<Ctx extends RetryBackoffContext, E extends Error> = keyof PartialRetryBackoffResult<Ctx, E> &
  keyof RetryBackoffConfig<Ctx, E>;

function getPartialFromConfig<Ctx extends RetryBackoffContext, E extends Error>(
  config: RetryBackoffConfig<Ctx, E>
): OptionalPartialResult<Ctx, E> {
  const keys: Key<Ctx, E>[] = ['context', 'error', 'count', 'maxRetries', 'base', 'startTime', 'maxTime'];
  return keys.reduce((parsed: Record<string, unknown>, key: Key<Ctx, E>) => {
    const value = retryBackoffValue(config[key], config);

    if (value != null) {
      parsed[key] = value;
    }

    return parsed;
  }, {}) as OptionalPartialResult<Ctx, E>;
}

/**
 * @internal
 */
function parseResult<Ctx extends RetryBackoffContext, E extends Error>(
  config: RetryBackoffConfig<Ctx, E>,
  partial: PartialRetryBackoffResult<Ctx, E>
): RetryBackoffResult<Ctx, E> {
  const _config = { ...config, ...partial };
  const result: RetryBackoffResult<Ctx, E> = {
    delay: retryBackoffValue(config.delay, _config) ?? partial.base * Math.pow(2, partial.count - 1),
    maxDelay: retryBackoffValue(config.maxDelay, _config),
    ...partial
  };

  result.delay = asPositiveIntegerOrZero(result.delay);
  result.maxDelay = asPositiveIntegerOrUndefined(result.maxDelay);
  result.delay = getBackoff<Ctx, E>(result);

  return result;
}

/**
 * @internal
 */
function getBackoff<Ctx extends RetryBackoffContext, E extends Error>(config: RetryBackoffResult<Ctx, E>): number {
  const delay = isBiggerThanZero(config.delay) ? config.delay : 0;

  return isBiggerThanZero(config.maxDelay) ? Math.min(config.maxDelay, delay) : delay;
}

/**
 * @internal
 */
function parseShould<Ctx extends RetryBackoffContext, E extends Error>(
  config: RetryBackoffConfig<Ctx, E>,
  result: RetryBackoffResult<Ctx, E>
): { shouldRetry: boolean; shouldNotRetry: boolean } {
  const _config = { ...config, ...result };

  return {
    shouldRetry: retryBackoffValue(config.shouldRetry, _config) ?? true,
    shouldNotRetry: retryBackoffValue(config.shouldNotRetry, _config) ?? false
  };
}

/**
 * @internal
 */
function shouldNotRetry<Ctx extends RetryBackoffContext, E extends Error>(
  result: RetryBackoffResult<Ctx, E>,
  should: { shouldRetry: boolean; shouldNotRetry: boolean }
): boolean {
  return (
    result.count <= 0 ||
    result.count > result.maxRetries ||
    !should.shouldRetry ||
    should.shouldNotRetry ||
    exceedsMaxTime(result)
  );
}

/**
 * @internal
 */
function exceedsMaxTime<Ctx extends RetryBackoffContext, E extends Error>(config: RetryBackoffResult<Ctx, E>): boolean {
  return config.totalTime != null && config.maxTime != null ? config.totalTime + config.delay > config.maxTime : false;
}

/**
 * @internal
 */
function isBiggerThanZero(value?: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

/**
 * @internal
 */
function asPositiveIntegerOrZero(value?: number): number {
  return value != null && value < 0 ? 0 : (value as number);
}

/**
 * @internal
 */
function asPositiveIntegerOrUndefined(value?: number): number | undefined {
  return value != null && value < 0 ? undefined : value;
}
