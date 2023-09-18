import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

import { RetryInterceptorConfig, toRetryHttpRequestConfig } from './retry.interceptor';
import { retryHttpRequest } from './retry-http-request.operator';

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 *
 * By default it will retry the failed HTTP GET request up to 3 times with a delay that increases exponentially
 * between attempts as long as it's a network error or the status is one of the following: 408, 429, 500, 502, 503, 504.
 * It will use the value of the Retry-After HTTP header if exists instead of the backoff,
 * and the Keep-Alive Timeout HTTP header value or 100s, whichever is less, as the operation limit.
 * @param config The RetryHttpRequestConfig configuration object.
 * @returns An interceptor for HTTP requests made via HttpClient.
 * @publicApi
 */
export function retryInterceptor(config?: RetryInterceptorConfig): HttpInterceptorFn {
  return <T>(request: HttpRequest<T>, next: HttpHandlerFn) => {
    const merged = toRetryHttpRequestConfig(request, config);

    return next(request).pipe(retryHttpRequest(merged));
  };
}
