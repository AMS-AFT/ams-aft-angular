# AMS-AFT Core: RxJS

## retryBackoff

Returns an Observable that mirrors the source Observable with the exception of an error using a backoff strategy.

```js
function retryBackoff<T, E extends Error>(config?: RetryBackoffConfig<E>): MonoTypeOperatorFunction<T>
```

A function that returns an Observable that will resubscribe to the source stream when the source stream errors using a backoff strategy.

![retryBackoff marble diagram](./retry-backoff.png)

```js
interface RetryBackoffConfig<E extends Error> {
  count?: number;
  shouldRetry?: boolean | ((data: RetryBackoffData<E>) => boolean);
  baseInterval?: number | ((data: RetryBackoffData<E>) => number);
  delay?: (data: RetryBackoffData<E> & { baseInterval: number }) => number;
  shouldNotRetry?: boolean | ((data: RetryBackoffData<E> & { delay: number; baseInterval: number }) => boolean);
  tap?: (data: RetryBackoffData<E> & { delay: number; baseInterval: number }) => void;
  resetOnSuccess?: boolean;
}

interface RetryBackoffData<E extends Error> {
  config: RetryBackoffConfig<E>;
  error: E;
  retryCount: number;
  totalTime: number;
}
```

### Use cases

#### Retry only on certain errors

```js
function shouldRetry<E extends Error>(data: RetryBackoffData<E>): boolean {
    return data.error instanceoff URIError;
};

source$.pipe(retryBackoff({ shouldRetry })).subscribe();
```
