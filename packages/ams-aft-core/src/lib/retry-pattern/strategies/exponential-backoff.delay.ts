import { DelayScope, RetryContext } from '../retry.types';

/**
 * Use an exponential backoff delay between retries.
 * @param scope The scope properties used to calculate each rety attempt delay.
 * @returns The delay in milliseconds.
 */
export function exponentialBackoffDelay<Ctx extends RetryContext, E extends Error>(scope: DelayScope<Ctx, E>): number {
  return scope.interval * Math.pow(2, scope.attemp - 1);
}
