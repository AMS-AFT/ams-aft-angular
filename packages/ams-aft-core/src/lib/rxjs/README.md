# AMS-AFT Core: RxJS

## retryBackoff

Returns an Observable that mirrors the source Observable with the exception of an error using a backoff strategy.

```ts
function retryBackoff<T, E extends Error>(config?: RetryBackoffConfig<E>): MonoTypeOperatorFunction<T>;
```

A function that returns an Observable that will resubscribe to the source stream when the source stream errors using a backoff strategy.

![retryBackoff marble diagram](./retry-backoff.png)

```ts
interface RetryBackoffConfig<E extends Error> {
  count?: number;
  baseInterval?: number | ((config: RetryBackoffConfig<E>) => number);
  shouldRetry?: boolean | ((data: RetryBackoffData<E>) => boolean);
  delay?: (data: RetryBackoffData<E>) => number;
  shouldNotRetry?: boolean | ((data: RetryBackoffData<E> & { delay: number }) => boolean);
  tap?: (data: RetryBackoffData<E> & { delay: number }) => void;
  resetOnSuccess?: boolean;
}

interface RetryBackoffData<E extends Error> {
  config: RetryBackoffConfig<E>;
  error: E;
  retryCount: number;
  totalTime: number;
  baseInterval: number;
}
```

### Use cases

#### Retry only on certain errors

```ts
function shouldRetry<E extends Error>(data: RetryBackoffData<E>): boolean {
  return data.error instanceoff URIError;
};

source$.pipe(retryBackoff({ shouldRetry })).subscribe();
```

#### Define a maximum delay

```ts
function delay<E extends Error>(data: RetryBackoffData<E>): number {
  const maxDelay = 1_000;
  const backoffDelay = Math.pow(2, data.retryCount - 1) * data.baseInterval;

  return Math.min(maxDelay, backoffDelay);
}

source$.pipe(retryBackoff({ delay })).subscribe();
```

#### Do not retry if the next one exeeds a total max time

```ts
function shouldNotRetry<E extends Error>(data: RetryBackoffData<E> & { delay: number }): boolean {
  const maxTime = 2_000;

  return delay + data.totalTime > maxTime;
}

source$.pipe(retryBackoff({ shouldNotRetry })).subscribe();
```

#### Log every retry

```ts
function tap<E extends Error>(data: RetryBackoffData<E> & { delay: number }) {
  console.log(`Retry number ${data.retryCount} from error ${data.error.name}`, data);
}

source$.pipe(retryBackoff({ tap })).subscribe();
```
