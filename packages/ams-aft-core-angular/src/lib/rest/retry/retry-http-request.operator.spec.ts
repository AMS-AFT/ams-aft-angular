import { getBackoffDelay, parseKeepAliveTimeout, parseRetryAfter, randomBetween } from '@ams-aft/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { isClientNetworkError } from './is-client-network-error.function';
import { retryHttpRequest, RetryHttpRequestScope } from './retry-http-request.operator';

const realRandom = Math.random;
const realNow = Date.now;

const error = new ProgressEvent('');
const url = '/api';
const networkError = { status: 0, statusText: '' };
const error404 = { status: 404, statusText: '' };
const error429 = { status: 429, statusText: '', headers: { 'Retry-After': '1' } };
const error500 = { status: 500, statusText: '' };
const error502 = { status: 502, statusText: '', headers: { 'Retry-After': '60' } };
const error503 = { status: 503, statusText: '', headers: { 'Retry-After': 'Sun, 1 Jan 2023 12:01:00 GMT' } };
const error504 = { status: 504, statusText: '', headers: { 'Keep-Alive': 'timeout=1, max=1' } };
const error524 = { status: 524, statusText: '' };

describe('retryHttpRequest', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
    jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Sun, 1 Jan 2023 12:00:00 GMT').getTime());
  });

  afterAll(() => {
    global.Math.random = realRandom;
    global.Date.now = realNow;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(`retry on retryable HTTP error`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 500 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error500.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(300);
    req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(600);
    req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(1200);
    req = httpTestingController.expectOne(url);
    req.flush('', error500);
  }));

  it(`retry on network error`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the network error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(networkError.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.error(error, networkError);

    tick(300);
    req = httpTestingController.expectOne(url);
    req.error(error, networkError);

    tick(600);
    req = httpTestingController.expectOne(url);
    req.error(error, networkError);

    tick(1200);
    req = httpTestingController.expectOne(url);
    req.error(error, networkError);
  }));

  it(`doesn't retry on non retryable HTTP error`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 404 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error404.status);
        }
      });

    const req = httpTestingController.expectOne(url);
    req.flush('', error404);
  }));

  it(`uses delay from Retry-After integer`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 429 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error429.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error429);

    tick(1000);
    req = httpTestingController.expectOne(url);
    req.flush('', error429);

    tick(1000);
    req = httpTestingController.expectOne(url);
    req.flush('', error429);

    tick(1000);
    req = httpTestingController.expectOne(url);
    req.flush('', error429);
  }));

  it(`uses delay from Retry-After date`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 503 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error503.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error503);

    tick(60_000);
    req = httpTestingController.expectOne(url);
    req.flush('', error503);

    tick(600);
    req = httpTestingController.expectOne(url);
    req.flush('', error503);

    tick(1200);
    req = httpTestingController.expectOne(url);
    req.flush('', error503);
  }));

  it(`uses max operation time 100s`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 502 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error502.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error502);

    tick(60_000);
    req = httpTestingController.expectOne(url);
    req.flush('', error502);
  }));

  it(`uses max operation time from Keep-Alive`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 504 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error504.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error504);

    tick(300);
    req = httpTestingController.expectOne(url);
    req.flush('', error504);

    tick(600);
    req = httpTestingController.expectOne(url);
    req.flush('', error504);
  }));

  it(`retries on different retryable HTTP errors in the same sequence`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 500 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error500.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error429);

    tick(1000);
    req = httpTestingController.expectOne(url);
    req.error(error, networkError);

    tick(600);
    req = httpTestingController.expectOne(url);
    req.flush('', error503);

    tick(60_000);
    req = httpTestingController.expectOne(url);
    req.flush('', error500);
  }));

  it(`doesn't retry on success in the same sequence`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: (value: unknown) => {
          expect(value).toEqual({});
        },
        error: () => fail('should not have failed')
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(300);
    req = httpTestingController.expectOne(url);
    req.flush({});
  }));

  it(`doesn't retry on non retryable HTTP error in the same sequence`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest())
      .subscribe({
        next: () => fail('should have failed with the 404 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error404.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(300);
    req = httpTestingController.expectOne(url);
    req.flush('', error404);
  }));

  it(`uses custom "count"`, fakeAsync(() => {
    httpClient
      .get(url)
      .pipe(retryHttpRequest({ count: 2 }))
      .subscribe({
        next: () => fail('should have failed with the 500 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toEqual(error500.status);
        }
      });

    let req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(300);
    req = httpTestingController.expectOne(url);
    req.flush('', error500);

    tick(600);
    req = httpTestingController.expectOne(url);
    req.flush('', error500);
  }));

  describe('use cases', () => {
    describe('number of retries based on time of day', () => {
      const count = (): number => (new Date(Date.now()).getHours() <= 6 ? 4 : 2);

      it(`before 6:00`, fakeAsync(() => {
        jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Sun, 1 Jan 2023 1:00:00 GMT').getTime());

        httpClient
          .get(url)
          .pipe(retryHttpRequest({ count }))
          .subscribe({
            next: () => fail('should have failed with the 500 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error500.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(300);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(600);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(1200);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(2400);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);
      }));

      it(`after 6:00`, fakeAsync(() => {
        jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Sun, 1 Jan 2023 12:00:00 GMT').getTime());

        httpClient
          .get(url)
          .pipe(retryHttpRequest({ count }))
          .subscribe({
            next: () => fail('should have failed with the 500 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error500.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(300);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(600);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);
      }));
    });

    describe('base interval based on time of day', () => {
      const baseInterval = (): number =>
        new Date(Date.now()).getHours() <= 6 ? randomBetween(500, 600) : randomBetween(200, 300);

      it(`before 6:00`, fakeAsync(() => {
        jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Sun, 1 Jan 2023 1:00:00 GMT').getTime());

        httpClient
          .get(url)
          .pipe(retryHttpRequest({ baseInterval }))
          .subscribe({
            next: () => fail('should have failed with the 500 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error500.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(500);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(1000);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(2000);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);
      }));

      it(`after 6:00`, fakeAsync(() => {
        jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Sun, 1 Jan 2023 12:00:00 GMT').getTime());

        httpClient
          .get(url)
          .pipe(retryHttpRequest({ baseInterval }))
          .subscribe({
            next: () => fail('should have failed with the 500 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error500.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(200);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(400);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(800);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);
      }));
    });

    describe('set a maximum delay of 1s if no Retry-After', () => {
      const delay = (scope: RetryHttpRequestScope): number => {
        const retryAfter = parseRetryAfter(scope.error.headers.get('Retry-After'));
        return retryAfter ?? Math.min(1_000, getBackoffDelay(scope));
      };

      it(`uses Retry-After`, fakeAsync(() => {
        httpClient
          .get(url)
          .pipe(retryHttpRequest({ delay }))
          .subscribe({
            next: () => fail('should have failed with the 429 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error429.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error429);

        tick(1000);
        req = httpTestingController.expectOne(url);
        req.flush('', error429);

        tick(2000);
        req = httpTestingController.expectOne(url);
        req.flush('', error429);

        tick(3000);
        req = httpTestingController.expectOne(url);
        req.flush('', error429);
      }));

      it(`uses max delay 1s`, fakeAsync(() => {
        httpClient
          .get(url)
          .pipe(retryHttpRequest({ delay }))
          .subscribe({
            next: () => fail('should have failed with the 500 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error500.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(300);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(600);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);

        tick(1000);
        req = httpTestingController.expectOne(url);
        req.flush('', error500);
      }));
    });

    describe('retry on timeout errors with a max operation time defined by Keep-Alive or 1s, whichever is lower', () => {
      const shouldRetry = (scope: RetryHttpRequestScope & { delay: number }): boolean => {
        const keepAlive = parseKeepAliveTimeout(scope.error.headers.get('Keep-Alive'));
        const maxTotal = keepAlive != null ? Math.min(keepAlive, 1_000) : 1_000;
        const should = [408, 504, 524].includes(scope.error.status) || isClientNetworkError(scope.error);
        const shouldnt = scope.totalTime + scope.delay > maxTotal;
        return should && !shouldnt;
      };

      it(`uses Keep-Alive`, fakeAsync(() => {
        httpClient
          .get(url)
          .pipe(retryHttpRequest({ shouldRetry }))
          .subscribe({
            next: () => fail('should have failed with the 504 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error504.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error504);

        tick(300);
        req = httpTestingController.expectOne(url);
        req.flush('', error504);

        tick(600);
        req = httpTestingController.expectOne(url);
        req.flush('', error504);
      }));

      it(`uses max delay 1s`, fakeAsync(() => {
        httpClient
          .get(url)
          .pipe(retryHttpRequest({ shouldRetry }))
          .subscribe({
            next: () => fail('should have failed with the 524 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error524.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.flush('', error524);

        tick(300);
        req = httpTestingController.expectOne(url);
        req.flush('', error524);

        tick(600);
        req = httpTestingController.expectOne(url);
        req.flush('', error524);
      }));

      it(`uses network error`, fakeAsync(() => {
        httpClient
          .get(url)
          .pipe(retryHttpRequest())
          .subscribe({
            next: () => fail('should have failed with the network error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(networkError.status);
            }
          });

        let req = httpTestingController.expectOne(url);
        req.error(error, networkError);

        tick(300);
        req = httpTestingController.expectOne(url);
        req.error(error, networkError);

        tick(600);
        req = httpTestingController.expectOne(url);
        req.error(error, networkError);

        tick(1200);
        req = httpTestingController.expectOne(url);
        req.error(error, networkError);
      }));

      it(`uses custom error codes`, fakeAsync(() => {
        httpClient
          .get(url)
          .pipe(retryHttpRequest({ shouldRetry }))
          .subscribe({
            next: () => fail('should have failed with the 500 error'),
            error: (error: HttpErrorResponse) => {
              expect(error.status).toEqual(error500.status);
            }
          });

        const req = httpTestingController.expectOne(url);
        req.flush('', error500);
      }));
    });

    it(`log every retry`, fakeAsync(() => {
      const fn = jest.fn();
      const tap = (scope: RetryHttpRequestScope & { delay: number }) => fn(`Retry #${scope.retryCount}`);

      httpClient
        .get(url)
        .pipe(retryHttpRequest({ tap }))
        .subscribe({
          next: () => fail('should have failed with the 500 error'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toEqual(error500.status);
            expect(fn).toHaveBeenCalledTimes(3);
          }
        });

      expect(fn).not.toHaveBeenCalled();

      let req = httpTestingController.expectOne(url);
      req.flush('', error500);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenNthCalledWith(1, 'Retry #1');

      tick(300);
      req = httpTestingController.expectOne(url);
      req.flush('', error500);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenNthCalledWith(2, 'Retry #2');

      tick(600);
      req = httpTestingController.expectOne(url);
      req.flush('', error500);
      expect(fn).toHaveBeenCalledTimes(3);
      expect(fn).toHaveBeenNthCalledWith(3, 'Retry #3');

      tick(1200);
      req = httpTestingController.expectOne(url);
      req.flush('', error500);
    }));
  });
});
