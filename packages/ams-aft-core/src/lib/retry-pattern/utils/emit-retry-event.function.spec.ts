import { emitRetryEvent } from './emit-retry-event.function';

const scope = {
  error: new Error(),
  attemp: 1,
  maxAttemps: 3,
  interval: 500,
  delay: 10,
  minDelay: 0
};

describe('emitRetryEvent', () => {
  it(`emits the event if event`, () => {
    const fn = jest.fn();
    const event = () => fn();
    expect(fn).not.toHaveBeenCalled();
    emitRetryEvent(event);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it(`emits the event with scope and args`, () => {
    const fn = jest.fn();
    const event = (scope: any, arg1: any, arg2: any) => fn(scope, arg1, arg2);
    expect(fn).not.toHaveBeenCalled();
    emitRetryEvent(event, scope, 0, 1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenNthCalledWith(1, scope, 0, 1);
  });

  // it(`doesn't emit the event if no event`, () => {
  //   const fn = jest.fn();
  //   expect(fn).not.toHaveBeenCalled();
  //   emitRetryEvent(undefined, scope, fn);
  //   expect(fn).not.toHaveBeenCalled();
  // });
});
