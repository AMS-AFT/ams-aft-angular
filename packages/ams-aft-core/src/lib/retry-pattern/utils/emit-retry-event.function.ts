import { RetryContext, RetryScope } from '../retry.types';

/**
 * Emits the event if event is defined.
 * @template Ctx The type of the retry context object.
 * @template E The expected error type.
 * @param event The event no emit.
 * @param scope The scope needed to resolve the event.
 * @param args The extra args to resolve the event.
 */
export function emitRetryEvent<Ctx extends RetryContext, E extends Error>(
  event?: (scope?: RetryScope<Ctx, E>, ...args: unknown[]) => void,
  scope?: RetryScope<Ctx, E>,
  ...args: unknown[]
): void {
  if (event !== undefined) {
    event(scope, ...args);
  }
}
