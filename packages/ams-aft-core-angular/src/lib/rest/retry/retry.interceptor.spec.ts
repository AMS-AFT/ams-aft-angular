import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { RETRY_INTERCEPTOR_CONFIG, RETRY_INTERCEPTOR_PROVIDER } from './retry.interceptor';

const realRandom = Math.random;
const url = 'api/resource';
const error500 = { status: 500, statusText: '' };

describe('RetryInterceptor Class', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
  });

  afterAll(() => {
    global.Math.random = realRandom;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RETRY_INTERCEPTOR_PROVIDER, { provide: RETRY_INTERCEPTOR_CONFIG, useValue: null }]
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(`retries the HTTP request on retryable HTTP error with default values`, fakeAsync(() => {
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    httpClient.get(url).subscribe({
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

  it(`uses custom "count`, fakeAsync(() => {
    TestBed.overrideProvider(RETRY_INTERCEPTOR_CONFIG, { useValue: { count: 1 } });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    httpClient.get(url).subscribe({
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
  }));

  it(`doesn't retry on non GET HTTP method`, fakeAsync(() => {
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    httpClient.post(url, {}).subscribe({
      next: () => fail('should have failed with the 500 error'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toEqual(error500.status);
      }
    });

    const req = httpTestingController.expectOne(url);
    req.flush('', error500);
  }));
});
