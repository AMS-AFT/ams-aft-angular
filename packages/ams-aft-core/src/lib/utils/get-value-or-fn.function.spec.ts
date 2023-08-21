import { getValueOrFn } from './get-value-or-fn.function';

describe('getValueOrFn', () => {
  it(`returns value`, () => {
    expect(getValueOrFn(1)).toEqual(1);
  });

  it(`returns function`, () => {
    const value = () => 1;
    expect(getValueOrFn(value)).toEqual(1);
  });

  it(`returns function with args`, () => {
    const value = (v1: number, v2: string) => 0 + v1 + Number(v2);
    expect(getValueOrFn(value, 1, 1)).toEqual(2);
  });
});
