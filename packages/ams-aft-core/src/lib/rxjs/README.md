# AMS-AFT Core: RxJS

## retryBackoff

Returns an Observable that mirrors the source Observable with the exception of an error using a backoff strategy.

```ts
function retryBackoff<T, E extends Error>(config?: RetryBackoffConfig<E>): MonoTypeOperatorFunction<T>;
```

A function that returns an Observable that will resubscribe to the source stream when the source stream errors using a backoff strategy.

![retryBackoff marble diagram](./retry-backoff.png)

### Use cases

#### Set the base interval depending on the time of day

```ts
function baseInterval(): number {
  const hour = Date.now().getHours();

  return hour <= 6 || hour >= 20 ? getRandomBetween(500, 600) : getRandomBetween(200, 300);
}

source$.pipe(retryBackoff({ baseInterval })).subscribe();
```

#### Retry only on certain error types

```ts
function shouldRetry<E extends Error>(scope: RetryBackoffScope<E>): boolean {
  return scope.error instanceoff URIError;
};

source$.pipe(retryBackoff({ shouldRetry })).subscribe();
```

#### Define a maximum delay

```ts
function delay<E extends Error>(scope: RetryBackoffScope<E>): number {
  const maxDelay = 2_000;
  const backoffDelay = Math.pow(2, scope.retryCount - 1) * scope.baseInterval;

  return Math.min(maxDelay, backoffDelay);
}

source$.pipe(retryBackoff({ delay })).subscribe();
```

#### Define a maximum operation time

```ts
function shouldNotRetry<E extends Error>(scope: RetryBackoffScope<E> & { delay: number }): boolean {
  const maxTime = 2_000;

  return scope.delay + scope.totalTime > maxTime;
}

source$.pipe(retryBackoff({ shouldNotRetry })).subscribe();
```

#### Log every retry

```ts
function tap<E extends Error>(scope: RetryBackoffScope<E> & { delay: number }) {
  console.log(`Retry number ${scope.retryCount} from error ${scope.error.name}`, scope);
}

source$.pipe(retryBackoff({ tap })).subscribe();
```
