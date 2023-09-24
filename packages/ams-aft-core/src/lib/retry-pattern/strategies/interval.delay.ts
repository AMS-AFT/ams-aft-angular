import { DelayScope, RetryContext } from '../retry.types';

/**
 * Use the same delay between retries.
 * @param scope The scope properties used to calculate each rety attempt delay.
 * @returns The delay in milliseconds.
 */
export function intervalDelay<Ctx extends RetryContext, E extends Error>(scope: DelayScope<Ctx, E>): number {
  return scope.interval;
}
