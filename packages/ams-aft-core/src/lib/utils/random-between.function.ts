/**
 * Gets a random integer between the min and max values.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random integer between the min value, round down if decimal, and max value, round up if decimal,
 * both included.
 * @publicApi
 * @example
 * ```ts
 * randomBetween(200, 300); // 248
 * randomBetween(200.1, 299.1); // 200
 * randomBetween(200.1, 299.1); // 300
 * ```
 */
export function randomBetween(min: number, max: number): number {
  const floorMin = Math.floor(min);
  const ceilMax = Math.ceil(max);

  return Math.floor(Math.random() * (ceilMax - floorMin + 1)) + floorMin;
}
