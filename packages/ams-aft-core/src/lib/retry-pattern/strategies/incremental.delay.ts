import { DelayScope, RetryContext } from '../retry.types';

/**
 * Use an incremental delay between retries.
 * @param scope The scope properties used to calculate each rety attempt delay.
 * @returns The delay in milliseconds.
 */
export function incrementalDelay<Ctx extends RetryContext, E extends Error>(scope: DelayScope<Ctx, E>): number {
  return scope.interval * scope.attemp;
}
