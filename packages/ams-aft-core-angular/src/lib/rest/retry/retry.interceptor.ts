import { removeNullish } from '@ams-aft/core';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  retryHttpRequest,
  RetryHttpRequestConfig,
  RetryHttpRequestScope,
  retryHttpRequestShouldRetry
} from './retry-http-request.operator';

/**
 * The RetryInterceptor operator configuration object.
 * @publicApi
 */
export interface RetryInterceptorConfig {
  /**
   * The maximum number of times to retry.
   *
   * Defaults to 3.
   */
  count?: number | (<T>(request: HttpRequest<T>) => () => number);
  /**
   * The initial interval in milliseconds.
   *
   * Defaults to random integer between 300 and 500 ms.
   */
  baseInterval?: number | (<T>(request: HttpRequest<T>) => () => number);
  /**
   * The number of milliseconds to delay before retrying.
   *
   * Defaults to the value of the Retry-After HTTP header or `baseInterval * 2^(retryCount-1)`.
   */
  delay?: number | (<T>(request: HttpRequest<T>) => (scope: RetryHttpRequestScope) => number);
  /**
   * Whether or not should resubscribe to the source stream when the source stream errors.
   *
   * Defaults to true if GET request and HttpErrorResponse status is 408, 429, 500, 502, 503 or 504
   * or client connection error. False if the total operation time exceeds the safe maximum
   * of 100s or the value of the Keep-Alive's HTTP header timeout value, whichever is lower.
   */
  shouldRetry?:
    | boolean
    | (<T>(request: HttpRequest<T>) => (scope: RetryHttpRequestScope & { delay: number }) => boolean);
  /**
   * Perform actions or side-effects that do not affect the retry.
   */
  tap?: <T>(request: HttpRequest<T>) => (scope: RetryHttpRequestScope & { delay: number }) => void;
  /**
   * Whether or not to reset the retry counter when the retried subscription emits its first value.
   *
   * Defaults to false.
   */
  resetOnSuccess?: boolean | (<T>(request: HttpRequest<T>) => () => boolean);
}

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 *
 * By default it will retry the failed HTTP GET request up to 3 times with a delay that increases exponentially
 * between attempts as long as it's a network error or the status is one of the following:
 * 408, 429, 500, 502, 503, 504. It will use the value of the Retry-After HTTP header if exists instead of the
 * backoff, and the Keep-Alive Timeout HTTP header value or 100s, whichever is less, as the operation limit.
 * @see {@link RETRY_INTERCEPTOR_CONFIG}
 * @publicApi
 */
@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  /**
   * The RetryInterceptorConfig configuration object.
   */
  protected readonly config?: RetryInterceptorConfig | null = inject(RETRY_INTERCEPTOR_CONFIG, {
    optional: true
  });

  intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    const merged = toRetryHttpRequestConfig(request, this.config);

    return next.handle(request).pipe(retryHttpRequest(merged));
  }
}

export function toRetryHttpRequestConfig<T>(
  request: HttpRequest<T>,
  config?: RetryInterceptorConfig | null
): RetryHttpRequestConfig {
  return removeNullish({
    count: getValueOrFn(request, config?.count),
    baseInterval: getValueOrFn(request, config?.baseInterval),
    delay: getValueOrFn(request, config?.delay),
    shouldRetry: getValueOrFn(request, config?.shouldRetry ?? retryInterceptorShouldRetry),
    tap: config?.tap != null ? config.tap(request) : undefined,
    resetOnSuccess: getValueOrFn(request, config?.resetOnSuccess)
  });
}

function getValueOrFn<T, K>(
  request: HttpRequest<T>,
  value?: K | ((request: HttpRequest<T>) => (...args: any[]) => K)
): K | (() => K) | undefined {
  if (value == null) {
    return;
  }

  return isRetryInterceptorFn<T, K>(value) ? value(request) : (value as K);
}

/**
 * @internal
 */
function isRetryInterceptorFn<T, K>(value: unknown): value is (request: HttpRequest<T>) => (...args: any[]) => K {
  return typeof value === 'function';
}

/**
 * The RetryHttpRequestConfig configuration object injection token.
 * @publicApi
 */
export const RETRY_INTERCEPTOR_CONFIG = new InjectionToken<RetryInterceptorConfig>('RETRY_INTERCEPTOR_CONFIG');

/**
 * The RetryInterceptor provider.
 * @publicApi
 */
export const RETRY_INTERCEPTOR_PROVIDER = { provide: HTTP_INTERCEPTORS, useClass: RetryInterceptor, multi: true };

/**
 * Returns true if the request method is GET and HttpErrorResponse status is 408, 429, 500, 502, 503 or 504 or
 * client connection error. False if the total operation time exceeds the safe maximum of 100s or the value of
 * the Keep-Alive's HTTP header timeout value, whichever is lower.
 * @protected
 */
export function retryInterceptorShouldRetry<T>(
  request: HttpRequest<T>
): (scope: RetryHttpRequestScope & { delay: number }) => boolean {
  return (scope: RetryHttpRequestScope & { delay: number }) => {
    return ['GET'].includes(request.method) && retryHttpRequestShouldRetry(scope);
  };
}
