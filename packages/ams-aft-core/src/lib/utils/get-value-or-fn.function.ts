/**
 * Solves for a variable that can be a value or a function.
 * @param value The value to solve.
 * @param args The arguments needed to resolve the value of the function.
 * @returns The value or result of executing the function.
 * @publicApi
 * @example
 * ```ts
 * getValueOrFn(1); // 1
 * getValueOrFn(() => 1); // 1
 * getValueOrFn((a, b) => a + b, 1, 1); // 2
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValueOrFn<T>(value: T | ((...args: any[]) => T), ...args: any[]): T {
  return isFunction(value) ? value(...args) : value;
}

/**
 * @internal
 */
const isFunction = (arg: unknown): arg is () => unknown => typeof arg === 'function';
