/**
 * Makes the specified object properties required.
 * @publicApi
 * @example
 * ```ts
 * type Obj = { a?: number; b?: number };
 * type AObj = WithRequired<Obj, 'a'>; // { a: number, b?: number }
 * ```
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
