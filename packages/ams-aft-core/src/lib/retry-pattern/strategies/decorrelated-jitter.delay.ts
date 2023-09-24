import { randomBetween } from '../../utils';
import { DelayScope, RetryContext } from '../retry.types';
import { fullJitterDelay } from './full-jitter.delay';

/**
 * Use an exponential backoff delay with a decorrelated jitter strategy between retries.
 * @param scope The scope properties used to calculate each rety attempt delay.
 * @returns The delay in milliseconds.
 */
export function decorrelatedJitterDelay<Ctx extends RetryContext, E extends Error>(scope: DelayScope<Ctx, E>): number {
  return scope.prevDelay != null ? randomBetween(scope.interval, scope.prevDelay * 3) : fullJitterDelay(scope);
}
