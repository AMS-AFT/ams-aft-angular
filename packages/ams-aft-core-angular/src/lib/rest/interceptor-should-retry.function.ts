import { RetryBackoffData } from '@ams-aft/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

import { DEFAULT_RETRY_METODS } from './retry.interceptor';
import { DEFAULT_RETRY_HTTP_CODES } from './retry-http-request.operator';

/**
 * Returns true if the request method is GET and the HttpErrorResponse status is in the list of safe HTTP error codes.
 * @internal
 */
export function shouldRetry<T, E extends HttpErrorResponse>(request: HttpRequest<T>) {
  return (data: RetryBackoffData<E>) => {
    return DEFAULT_RETRY_METODS.includes(request.method) && DEFAULT_RETRY_HTTP_CODES.includes(data.error.status);
  };
}
