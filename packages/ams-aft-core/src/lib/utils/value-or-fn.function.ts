/**
 * Solves for a variable that can be a value or a function.
 * @param value The value to solve.
 * @param args The arguments needed to resolve the value of the function.
 * @returns The value or result of executing the function.
 * @publicApi
 * @example
 * ```ts
 * valueOrFn(1); // 1
 * valueOrFn(() => 1); // 1
 * valueOrFn((a, b) => a + b, 1, 1); // 2
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function valueOrFn<T>(value: T | ((...args: any[]) => T), ...args: any[]): T {
  return isFunction(value) ? value(...args) : value;
}

/**
 * @internal
 */
function isFunction(value: unknown): value is () => unknown {
  return typeof value === 'function';
}
