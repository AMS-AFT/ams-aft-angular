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
   * The RetryHttpRequestConfig configuration object.
   */
  protected readonly config?: RetryHttpRequestConfig | null = inject(RETRY_INTERCEPTOR_CONFIG, {
    optional: true
  });

  intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    const merged: RetryHttpRequestConfig = {
      shouldRetry: retryInterceptorShouldRetry(request),
      ...(this.config ?? {})
    };

    return next.handle(request).pipe(retryHttpRequest(merged));
  }
}

/**
 * The RetryHttpRequestConfig configuration object injection token.
 * @publicApi
 */
export const RETRY_INTERCEPTOR_CONFIG = new InjectionToken<RetryHttpRequestConfig>('RETRY_INTERCEPTOR_CONFIG');

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
export function retryInterceptorShouldRetry<T>(request: HttpRequest<T>) {
  return (scope: RetryHttpRequestScope & { delay: number }) => {
    return ['GET'].includes(request.method) && retryHttpRequestShouldRetry(scope);
  };
}
