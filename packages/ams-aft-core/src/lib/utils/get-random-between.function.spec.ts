import { getRandomBetween } from './get-random-between.function';

const realRandom = Math.random;

describe('getRandomBetween', () => {
  afterAll(() => {
    global.Math.random = realRandom;
  });

  it(`returns a random number including min`, () => {
    global.Math.random = jest.fn(() => 0);
    expect(getRandomBetween(1, 10)).toEqual(1);
  });

  it(`returns a random number including max`, () => {
    global.Math.random = jest.fn(() => 0.9);
    expect(getRandomBetween(1, 10)).toEqual(10);
  });

  it(`parse min decimal argument to lower integer`, () => {
    global.Math.random = jest.fn(() => 0);
    expect(getRandomBetween(1.1, 1.1)).toEqual(1);
  });

  it(`parse max decimal argument to higer integer`, () => {
    global.Math.random = jest.fn(() => 0.9);
    expect(getRandomBetween(1.1, 1.1)).toEqual(2);
  });
});
