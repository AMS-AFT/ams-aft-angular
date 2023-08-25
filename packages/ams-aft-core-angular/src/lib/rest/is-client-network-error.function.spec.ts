import { HttpErrorResponse } from '@angular/common/http';

import { isClientNetworkError } from './is-client-network-error.function';

describe('isClientNetworkError', () => {
  it(`returns true if status 0 and ProgressEvent`, () => {
    const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('') });

    expect(isClientNetworkError(error)).toBeTrue();
  });

  it(`returns false if status 0 and no ProgressEvent`, () => {
    const error = new HttpErrorResponse({ status: 0, error: new Error('') });

    expect(isClientNetworkError(error)).toBeFalse();
  });

  it(`returns false if status no 0 and ProgressEvent`, () => {
    const error = new HttpErrorResponse({ status: 500, error: new ProgressEvent('') });

    expect(isClientNetworkError(error)).toBeFalse();
  });

  it(`returns false if status no 0 and no ProgressEvent`, () => {
    const error = new HttpErrorResponse({ status: 500, error: new Error('') });

    expect(isClientNetworkError(error)).toBeFalse();
  });
});
