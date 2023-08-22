# AMS-AFT Core: REST

Code related with HTTP REST calls.

## parseKeepAliveTimeout

Returns the [Keep-Alive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive) HTTP header timeout value in milliseconds.

```js
function parseKeepAliveTimeout(value?: string | null): number | null
```

Returns the timeout value in milliseconds. Otherwise will return null.

```js
parseKeepAliveTimeout('timeout=1, max=1'); // 1_000
parseKeepAliveTimeout(); // null
parseKeepAliveTimeout(null); // null
parseKeepAliveTimeout(''); // null
```

## parseRetryAfter

Returns the [Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) response HTTP header value in milliseconds.

```js
function parseRetryAfter(value?: string | null): number | null
```

Returns the value in milliseconds or the milliseconds remaining if is a future date. Otherwise will return null.

```js
// current date 'Sun, 1 Jan 2023 12:00:00 GMT'
parseRetryAfter('1'); // 1_000
parseRetryAfter('Sun, 1 Jan 2023 12:01:00 GMT'); // 60_000
parseRetryAfter(); // null
parseRetryAfter(null); // null
parseRetryAfter(''); // null
parseRetryAfter('a'); // null
parseRetryAfter('Sun, 1 Jan 2023 12:00:00 GMT'); // null
parseRetryAfter('Sun, 1 Jan 2023 11:00:00 GMT'); // null
parseRetryAfter('Sun, 42 Jan 2023 12:00:00 GMT'); // null
```
