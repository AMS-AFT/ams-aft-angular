/**
 * Gets a random integer between the minimum and maximum values, both inclusive.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random integer between the minimum and maximum values, both inclusive.
 */
export function getRandomBetween(min: number, max: number): number {
  const _min = Math.floor(min);
  const _max = Math.ceil(max);

  return Math.floor(Math.random() * (_max - _min + 1)) + _min;
}
