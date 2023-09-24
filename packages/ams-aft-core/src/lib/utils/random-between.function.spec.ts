import { randomBetween } from './random-between.function';

describe('randomBetween', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0.999);
  });

  it(`returns a random number including min`, () => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
    expect(randomBetween(1, 10)).toEqual(1);
  });

  it(`returns a random number including max`, () => {
    expect(randomBetween(1, 10)).toEqual(10);
  });

  it(`returns min number if max < min`, () => {
    expect(randomBetween(10, 9)).toEqual(10);
  });

  it(`parse min decimal argument to lower integer`, () => {
    jest.spyOn(global.Math, 'random').mockImplementation(() => 0);
    expect(randomBetween(1.1, 1.1)).toEqual(1);
  });

  it(`parse max decimal argument to higer integer`, () => {
    expect(randomBetween(1.1, 1.1)).toEqual(2);
  });
});
