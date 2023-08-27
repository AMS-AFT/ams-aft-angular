import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { retryHttpRequest } from './retry-http-request.operator';

const realRandom = Math.random;
const realNow = Date.now;

const url = 'api/resource';
const errorNetwork = { status: 0, statusText: '', error: new ProgressEvent('') };
const error404 = { status: 404, statusText: '' };
const error429 = { status: 429, statusText: '', headers: { 'Retry-After': '1' } };
const error500 = { status: 500, statusText: '' };
const error502 = { status: 502, statusText: '', headers: { 'Retry-After': '60' } };
const error503 = { status: 503, statusText: '', headers: { 'Retry-After': 'Sun, 1 Jan 2023 12:01:00 GMT' } };
const error504 = { status: 504, statusText: '', headers: { 'Keep-Alive': 'timeout=1, max=1' } };

describe('retryHttpRequest', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    global.Math.random = jest.fn(() => 0);
    global.Date.now = jest.fn(() => new Date('Sun, 1 Jan 2023 12:00:00 GMT').getTime());
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

  it(`retries the HTTP request on retryable HTTP error with default values`, fakeAsync(() => {
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
          expect(error.status).toEqual(errorNetwork.status);
        }
      });

    const req = httpTestingController.expectOne(url);
    req.flush('', errorNetwork);
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

  it(`uses max operation time 100 s`, fakeAsync(() => {
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
    req.flush('', error500);

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
});
