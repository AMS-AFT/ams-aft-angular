import { randomBetween } from '../../utils';
import { DelayScope, RetryContext } from '../retry.types';
import { exponentialBackoffDelay } from './exponential-backoff.delay';

/**
 * Use an exponential backoff delay with an equal jitter strategy between retries.
 * @param scope The scope properties used to calculate each rety attempt delay.
 * @returns The delay in milliseconds.
 */
export function equalJitterDelay<Ctx extends RetryContext, E extends Error>(scope: DelayScope<Ctx, E>): number {
  const halfExponentialBackoff: number = Math.round(exponentialBackoffDelay(scope) / 2);

  return halfExponentialBackoff + randomBetween(0, halfExponentialBackoff);
}
