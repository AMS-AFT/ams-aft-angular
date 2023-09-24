import { valueOrFn } from '../../utils';

/**
 * Parses a retry config that can be a value or a function.
 * @template T The expected return type.
 * @param config The value to solve.
 * @param scope The scope needed to resolve the function.
 * @returns The value or result of executing the function, rounded to the nearest integer if decimal.
 * Undefined if value is nil or a number less than 0.
 * @publicApi
 * @example
 * ```ts
 * parseRetryConfig(1); // 1
 * parseRetryConfig(() => 1); // 1
 * parseRetryConfig(({maxAttemps}) => maxAttemps, scope); // 3
 * parseRetryConfig(1.1); // 1
 * parseRetryConfig(1.9); // 2
 * parseRetryConfig(null); // undefined
 * parseRetryConfig(undefined); // undefined
 * parseRetryConfig(-1); // undefined
 * ```
 */
export function parseRetryConfig<T, Scope = undefined>(config: {
  config?: T | ((scope?: Scope) => T);
  scope?: Scope;
  min?: number;
}): T {
  if (config.config == null) {
    return undefined as T;
  }

  let value: T | number = valueOrFn<T>(config.config, config.scope);

  if (typeof value === 'number') {
    value = Math.round(value);

    return (value < (config.min ?? 0) ? undefined : value) as T;
  }

  return value;
}
