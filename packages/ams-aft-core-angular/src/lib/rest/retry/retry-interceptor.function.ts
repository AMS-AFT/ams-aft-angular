import { RetryBackoffConfig } from '@ams-aft/core';
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

import { interceptorShouldRetry } from './retry.interceptor';
import { retryHttpRequest } from './retry-http-request.operator';

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 *
 * By default it will retry the failed HTTP GET request 3 times with a delay that increases exponentially between
 * attempts, as long as it's a network error or the status is one of the following: 408, 429, 500, 502, 503, 504.
 * @param config The RetryBackoffConfig configuration object.
 * @returns An interceptor for HTTP requests made via HttpClient.
 * @publicApi
 */
export function retryInterceptor<E extends HttpErrorResponse>(config?: RetryBackoffConfig<E>): HttpInterceptorFn {
  return <T>(request: HttpRequest<T>, next: HttpHandlerFn) => {
    const merged: RetryBackoffConfig<E> = {
      shouldRetry: interceptorShouldRetry(request),
      ...(config ?? {})
    };

    return next(request).pipe(retryHttpRequest(merged));
  };
}
