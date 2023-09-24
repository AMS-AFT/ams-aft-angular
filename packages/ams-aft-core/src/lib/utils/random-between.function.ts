/**
 * Gets a random integer between `min` and `max` values, both included.
 * @param min The minimum value, rounded down if decimal.
 * @param max The maximum value, rounded up if decimal.
 * @returns A random integer between `min` and `max` values.
 * If `max` is lower than `min` will returns `min`.
 * @publicApi
 * @example
 * ```ts
 * randomBetween(200, 300); // 248
 * randomBetween(300, 200); // 300
 * randomBetween(200.1, 299.1); // 200
 * randomBetween(200.1, 299.1); // 300
 * ```
 */
export function randomBetween(min: number, max: number): number {
  const floorMin = Math.floor(min);
  const ceilMax = Math.ceil(max);

  if (ceilMax < floorMin) {
    return floorMin;
  }

  return Math.floor(Math.random() * (ceilMax - floorMin + 1)) + floorMin;
}
