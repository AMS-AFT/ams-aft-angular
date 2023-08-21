import { RetryBackoffConfig, RetryBackoffData } from '@ams-aft/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHandlerFn,
  HttpInterceptor,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { DEFAULT_RETRY_HTTP_CODES, retryHttpRequest } from './retry-http-request.operator';

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 * @publicApi
 */
@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  /**
   * The {@link RetryBackoffConfig} configuration object.
   */
  protected readonly config = inject(RETRY_INTERCEPTOR_CONFIG);

  intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    const merged: RetryBackoffConfig<HttpErrorResponse> = {
      shouldRetry: shouldRetry(request),
      ...(this.config ?? {})
    };

    return next.handle(request).pipe(retryHttpRequest(merged));
  }
}

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 * @param config The {@link RetryBackoffConfig} configuration object.
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

/**
 * Returns true if the request method is GET and the HttpErrorResponse status is in the list of safe HTTP error codes.
 * @internal
 */
function shouldRetry<T, E extends HttpErrorResponse>(request: HttpRequest<T>) {
  return (data: RetryBackoffData<E>) => {
    return DEFAULT_RETRY_METODS.includes(request.method) && DEFAULT_RETRY_HTTP_CODES.includes(data.error.status);
  };
}

/**
 * The default safe HTTP methods that should retry.
 * @publicApi
 */
export const DEFAULT_RETRY_METODS = ['GET'];

/**
 * The {@link RetryInterceptor} {@link RetryBackoffConfig} configuration object injection token.
 * @publicApi
 */
export const RETRY_INTERCEPTOR_CONFIG = new InjectionToken<RetryBackoffConfig<HttpErrorResponse>>(
  'RETRY_INTERCEPTOR_CONFIG'
);
