import { RetryBackoffConfig, RetryBackoffScope } from '@ams-aft/core';
import {
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { isClientNetworkError } from './is-client-network-error.function';
import { DEFAULT_RETRY_HTTP_CODES, retryHttpRequest } from './retry-http-request.operator';

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 *
 * By default it will retry the failed HTTP GET request 3 times with a delay that increases exponentially between
 * attempts, as long as it's a network error or the status is one of the following: 408, 429, 500, 502, 503, 504.
 * @see {@link RETRY_INTERCEPTOR_CONFIG}
 * @publicApi
 */
@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  /**
   * The RetryBackoffConfig configuration object.
   */
  protected readonly config?: RetryBackoffConfig<HttpErrorResponse> | null = inject(RETRY_INTERCEPTOR_CONFIG, {
    optional: true
  });

  intercept<T, E extends HttpErrorResponse>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    const merged: RetryBackoffConfig<E> = {
      shouldRetry: interceptorShouldRetry(request),
      ...(this.config ?? {})
    };

    return next.handle(request).pipe(retryHttpRequest(merged));
  }
}

/**
 * Default safe HTTP methods that should retry.
 * @publicApi
 */
export const DEFAULT_RETRY_METODS = ['GET'];

/**
 * RetryBackoffConfig configuration object injection token.
 * @publicApi
 */
export const RETRY_INTERCEPTOR_CONFIG = new InjectionToken<RetryBackoffConfig<HttpErrorResponse>>(
  'RETRY_INTERCEPTOR_CONFIG'
);

/**
 * Retry interceptor provider.
 * @publicApi
 */
export const RETRY_INTERCEPTOR_PROVIDER = { provide: HTTP_INTERCEPTORS, useClass: RetryInterceptor, multi: true };

/**
 * Returns true if the request method is GET and the HttpErrorResponse status is in the list of safe HTTP error codes
 * or a client connection error occurs.
 * @internal
 */
export function interceptorShouldRetry<T, E extends HttpErrorResponse>(request: HttpRequest<T>) {
  return (scope: RetryBackoffScope<E>) => {
    return (
      (DEFAULT_RETRY_METODS.includes(request.method) && DEFAULT_RETRY_HTTP_CODES.includes(scope.error.status)) ||
      isClientNetworkError(scope.error)
    );
  };
}
