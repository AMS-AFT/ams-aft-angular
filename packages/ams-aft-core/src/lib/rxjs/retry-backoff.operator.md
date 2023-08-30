# retryBackoff

Returns an Observable that mirrors the source Observable with the exception of an error.

## Use cases

![retryBackoff marble diagram](./retry-backoff.png)

### Configure the number of retries and base interval depending on the time of the day

```ts
function count(): number {
  const hour = Date.now().getHours();
  return hour <= 6 || hour >= 20 ? 7 : 2;
}

function baseInterval(): number {
  const hour = Date.now().getHours();
  return hour <= 6 || hour >= 20 ? randomBetween(500, 600) : randomBetween(200, 300);
}

source$.pipe(retryBackoff({ count, baseInterval })).subscribe();
```

### Retry only on certain error types

```ts
function shouldRetry<E extends Error>(scope: RetryBackoffScope<E>): boolean {
  return scope.error instanceoff URIError;
};

source$.pipe(retryBackoff({ shouldRetry })).subscribe();
```

### Define a maximum delay

```ts
function delay<E extends Error>(scope: RetryBackoffScope<E>): number {
  const maxDelay = 2_000;
  const backoffDelay = Math.pow(2, scope.retryCount - 1) * scope.baseInterval;
  return Math.min(maxDelay, backoffDelay);
}

source$.pipe(retryBackoff({ delay })).subscribe();
```

### Define a maximum operation time

```ts
function shouldRetry<E extends Error>(scope: RetryBackoffScope<E> & { delay: number }): boolean {
  const maxTime = 2_000;
  const shouldNotRetry = scope.delay + scope.totalTime > maxTime;
  return !shouldNotRetry;
}

source$.pipe(retryBackoff({ shouldRetry })).subscribe();
```

### Log every retry

```ts
function tap<E extends Error>(scope: RetryBackoffScope<E> & { delay: number }) {
  console.log(`Retry #${scope.retryCount} from error ${scope.error.name}`, scope);
}

source$.pipe(retryBackoff({ tap })).subscribe();
```
