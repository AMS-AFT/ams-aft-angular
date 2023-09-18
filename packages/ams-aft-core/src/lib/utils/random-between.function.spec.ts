import { randomBetween } from './random-between.function';

const realRandom = Math.random;

describe('randomBetween', () => {
  afterAll(() => {
    global.Math.random = realRandom;
  });

  it(`returns a random number including min`, () => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
    expect(randomBetween(1, 10)).toEqual(1);
  });

  it(`returns a random number including max`, () => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0.9);
    expect(randomBetween(1, 10)).toEqual(10);
  });

  it(`parse min decimal argument to lower integer`, () => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
    expect(randomBetween(1.1, 1.1)).toEqual(1);
  });

  it(`parse max decimal argument to higer integer`, () => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0.9);
    expect(randomBetween(1.1, 1.1)).toEqual(2);
  });
});
