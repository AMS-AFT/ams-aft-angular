/**
 * Converts a key value pairs string to object.
 * @param value The key value pairs string to convert.
 * @param separators The strings that separates properties and values.
 * @returns The key value pairs string as object.
 */
export function convertStringToObject(
  value: string,
  separators: { properties: string; values: string }
): Record<string, string> {
  const properties = value.split(separators.properties).map((property: string) => property.trim());

  return properties.reduce((previousValue: Record<string, string>, currentValue: string) => {
    const keyValue = currentValue.split(separators.values).map((keyOrValue: string) => keyOrValue.trim());

    if (keyValue.length === 2) {
      previousValue[keyValue[0]] = keyValue[1];
    }

    return previousValue;
  }, {});
}
