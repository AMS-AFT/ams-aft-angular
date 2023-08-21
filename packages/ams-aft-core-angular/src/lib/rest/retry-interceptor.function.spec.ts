import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { retryInterceptor } from './retry-interceptor.function';

const realRandom = Math.random;
const url = 'api/resource';
const error500 = { status: 500, statusText: '' };

describe('retryInterceptor Function', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    global.Math.random = jest.fn(() => 0);
  });

  afterAll(() => {
    global.Math.random = realRandom;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(`retries the HTTP request on retryable HTTP error with default values`, fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([retryInterceptor()])), provideHttpClientTesting()]
    });
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
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([retryInterceptor({ count: 1 })])), provideHttpClientTesting()]
    });
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
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([retryInterceptor()])), provideHttpClientTesting()]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

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
