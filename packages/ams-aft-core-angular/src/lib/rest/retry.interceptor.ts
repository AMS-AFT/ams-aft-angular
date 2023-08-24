import { RetryBackoffConfig } from '@ams-aft/core';
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

import { interceptorShouldRetry } from './interceptor-should-retry.function';
import { retryHttpRequest } from './retry-http-request.operator';

/**
 * Intercepts and handles an HttpResponse and retries it if returns a retryable HttpErrorResponse.
 * @publicApi
 */
@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  /**
   * The RetryBackoffConfig configuration object.
   */
  protected readonly config? = inject(RETRY_INTERCEPTOR_CONFIG, { optional: true });

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
