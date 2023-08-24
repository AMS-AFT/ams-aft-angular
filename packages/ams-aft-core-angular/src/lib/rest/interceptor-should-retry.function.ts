import { RetryBackoffScope } from '@ams-aft/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

import { isClientNetworkError } from './is-client-network-error.function';
import { DEFAULT_RETRY_METODS } from './retry.interceptor';
import { DEFAULT_RETRY_HTTP_CODES } from './retry-http-request.operator';

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
