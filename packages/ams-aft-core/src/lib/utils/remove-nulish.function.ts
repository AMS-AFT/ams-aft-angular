/**
 * Removes nullish properties from an object.
 * @param obj The object from which to delete nullish properties.
 * @returns A clone of the object without the nullish properties.
 * @example
 * ```ts
 * removeNullish({ a: null, b: undefined, c: 0 }); // { c: 0 }
 * ```
 */
export function removeNullish<T extends Record<string, unknown>>(obj: T): T {
  return Object.keys(obj).reduce((partial: Partial<T>, key: keyof T) => {
    const value = obj[key];

    if (value != null) {
      partial[key] = value;
    }

    return partial;
  }, {}) as T;
}
