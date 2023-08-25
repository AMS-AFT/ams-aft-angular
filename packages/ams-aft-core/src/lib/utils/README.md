# AMS-AFT Core: Utils

## getRandomBetween

Gets a random integer between the minimum and maximum values, both inclusive.

```ts
function getRandomBetween(min: number, max: number): number;
```

Returns a random integer between the minimum and maximum values, both inclusive.

```ts
getRandomBetween(200, 300); // 248
getRandomBetween(200.1, 299.1); // 200
getRandomBetween(200.1, 299.1); // 300
```

## getValueOrFn

Solves for a variable that can be a value or a function.

```ts
function getValueOrFn<T>(value: T | ((...args: any[]) => T), ...args: any[]): T;
```

Returns the value or result of executing the function.

```ts
getValueOrFn(1); // 1
getValueOrFn(() => 1); // 1
getValueOrFn((a, b) => a + b, 1, 1); // 2
```

## stringToObject

Converts a key value pairs string to object.

```ts
function stringToObject(value: string, separators: { properties: string; values: string }): Record<string, string>;
```

Returns the key value pairs string as object or empty object if invalid separators.

```ts
const separators = { properties: ',', values: '=' };
stringToObject('a=0, b=0', separators); // { a: '0', b: '0' }
stringToObject('a:0, b:0', separators); // {}
```

## WithRequired

Makes the specified object properties required.

```ts
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
```

```ts
type Obj = { a?: number; b?: number };
type AObj = WithRequired<Obj, 'a'>; // { a: number, b?: number }
```
