/**
 * Makes the specified object properties required.
 * @example
 * ```js
 * type NamedUser = WithRequired<User,'name'>
 * ```
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
