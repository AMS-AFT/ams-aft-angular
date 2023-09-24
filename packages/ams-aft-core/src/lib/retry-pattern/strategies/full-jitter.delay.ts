import { randomBetween } from '../../utils';
import { DelayScope, RetryContext } from '../retry.types';
import { exponentialBackoffDelay } from './exponential-backoff.delay';

/**
 * Use an exponential backoff delay with a full jitter strategy between retries.
 * @param scope The scope properties used to calculate each rety attempt delay.
 * @returns The delay in milliseconds.
 */
export function fullJitterDelay<Ctx extends RetryContext, E extends Error>(scope: DelayScope<Ctx, E>): number {
  return randomBetween(0, exponentialBackoffDelay(scope));
}
