import { stringToObject } from './string-to-object.function';

describe('stringToObject', () => {
  const separator = { property: ',', value: '=' };
  const obj = { a: '1', b: '1' };

  it(`returns the string as object`, () => {
    const value = 'a=1,b=1';
    expect(stringToObject(value, separator)).toEqual(obj);
  });

  it(`returns the string as object avoiding extra spaces`, () => {
    const value = 'a = 1 , b = 1';
    expect(stringToObject(value, separator)).toEqual(obj);
  });

  it(`returns empty object if invalid separators`, () => {
    const value = 'a:1, b:1';
    expect(stringToObject(value, separator)).toEqual({});
  });
});
