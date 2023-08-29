/**
 * Converts a key value pairs string to object.
 * @param value The key value pairs string to convert.
 * @param separator The strings that separates properties and values.
 * @returns The key value pairs string as object or empty object if invalid separators.
 * @publicApi
 * @example
 * ```ts
 * const separator = { property: ',', value: '=' };
 * stringToObject('a=0, b=0', separator); // {a:'0',b:'0'}
 * stringToObject('a:0, b:0', separator); // {}
 * ```
 */
export function stringToObject(value: string, separator: { property: string; value: string }): Record<string, string> {
  const properties = value.split(separator.property).map((property: string) => property.trim());

  return properties.reduce((previousValue: Record<string, string>, currentValue: string) => {
    const keyValue = currentValue.split(separator.value).map((kv: string) => kv.trim());

    if (keyValue.length === 2) {
      previousValue[keyValue[0]] = keyValue[1];
    }

    return previousValue;
  }, {});
}
