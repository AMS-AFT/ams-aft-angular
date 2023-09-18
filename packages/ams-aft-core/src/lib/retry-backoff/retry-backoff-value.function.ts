/* eslint-disable @typescript-eslint/no-explicit-any */
import { valueOrFn } from '../utils';

/**
 * Solves for a variable that can be a value or a function.
 * @template T The expected return type.
 * @param value The value to solve.
 * @param args The arguments needed to resolve the value of the function.
 * @returns The value or result of executing the function rounded to the nearest integer if decimal.
 * @publicApi
 * @example
 * ```ts
 * retryBackoffValue(null); // null
 * retryBackoffValue(undefined); // undefined
 * retryBackoffValue(1); // 1
 * retryBackoffValue(() => 1); // 1
 * retryBackoffValue((a, b) => (a + b), 1, 1); // 2
 * retryBackoffValue(1.1); // 1
 * retryBackoffValue(1.9); // 2
 * ```
 */
export function retryBackoffValue<T>(value: T | ((...args: any[]) => T), ...args: any[]): T {
  const tValue: T = valueOrFn<T>(value, ...args);

  return typeof tValue === 'number' ? (Math.round(tValue) as T) : tValue;
}
