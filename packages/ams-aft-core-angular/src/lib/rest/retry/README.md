# AMS-AFT Core Angular: Rest Retry

Code related to retry pattern with HttpClient.

## isClientNetworkError

Checks if the returned HttpErrorResponse is due to a client network error.

```ts
function isClientNetworkError<E extends HttpErrorResponse>(error: E): boolean;
```

Returns Ttrue if the HttpErrorResponse is due to a client network error. Otherwise false.

```ts
const networkError = new HttpErrorResponse({ status: 0, error: new ProgressEvent('') });
isClientNetworkError(networkError); // true
isClientNetworkError(new HttpErrorResponse({ status: 500 })); // false
```

## retryHttpRequest RxJS operator

Retries an HttpClient request when returns an HttpErrorResponse.

By default it will retry the failed HTTP request 3 times with a delay that increases exponentially between attempts,
as long as it's a network error or the status is one of the following: 408, 429, 500, 502, 503, 504.
It will use the value of the Retry-After HTTP header if exists instead of the backoff delay,
and the Keep-Alive Timeout HTTP header or 100s, whichever is less, as the operation limit.

```ts
function retryHttpRequest<T, E extends HttpErrorResponse>(config?: RetryBackoffConfig<E>): MonoTypeOperatorFunction<T>;
```

Returns a function that returns an Angular Http Request Observable that will resubscribe to the source stream when the source streams an HttpErrorResponse.

### Exposed constants

```ts
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_HTTP_CODES = [408, 429, 500, 502, 503, 504];
```

## RetryInterceptor Angular HTTP Interceptor

### Class Interceptor

```ts
class RetryInterceptor implements HttpInterceptor {
  config?: RetryBackoffConfig<HttpErrorResponse> | null;
  intercept<T, E extends HttpErrorResponse>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>>;
}
```

#### Exposed constants

```ts
const RETRY_INTERCEPTOR_CONFIG: InjectionToken<RetryBackoffConfig<HttpErrorResponse>>;
const RETRY_INTERCEPTOR_PROVIDER: Provider;
```

### Functional Interceptor

```ts
function retryInterceptor<E extends HttpErrorResponse>(config?: RetryBackoffConfig<E>): HttpInterceptorFn;
```

### Exposed constants

```ts
const DEFAULT_RETRY_METODS = ['GET'];
```
