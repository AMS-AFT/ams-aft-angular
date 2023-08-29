import { valueOrFn } from './value-or-fn.function';

describe('valueOrFn', () => {
  it(`returns value`, () => {
    expect(valueOrFn(1)).toEqual(1);
  });

  it(`returns function`, () => {
    const value = () => 1;
    expect(valueOrFn(value)).toEqual(1);
  });

  it(`returns function with args`, () => {
    const value = (v1: number, v2: string) => 0 + v1 + Number(v2);
    expect(valueOrFn(value, 1, '1')).toEqual(2);
  });
});
