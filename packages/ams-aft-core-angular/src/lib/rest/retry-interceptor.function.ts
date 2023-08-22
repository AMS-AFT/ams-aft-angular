import { RetryBackoffConfig } from '@ams-aft/core';
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

import { shouldRetry } from './interceptor-should-retry.function';
import { retryHttpRequest } from './retry-http-request.operator';

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 * @param config The RetryBackoffConfig configuration object.
 * @returns An interceptor for HTTP requests made via HttpClient.
 * @publicApi
 */
export function retryInterceptor<E extends HttpErrorResponse>(config?: RetryBackoffConfig<E>): HttpInterceptorFn {
  return <T>(request: HttpRequest<T>, next: HttpHandlerFn) => {
    const merged: RetryBackoffConfig<E> = {
      shouldRetry: shouldRetry(request),
      ...(config ?? {})
    };

    return next(request).pipe(retryHttpRequest(merged));
  };
}
