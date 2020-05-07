import { ExamSide, SensoryPointValue } from '../../interfaces';
import { checkSensoryLevel } from './sensoryLevel';
import { newEmptySide } from '../commonSpec';
import { CheckLevelResult } from '../common';

type Test = {
  cases: { x: SensoryPointValue; y: SensoryPointValue }[];
  expected: CheckLevelResult;
};

const contains = (test: {x: SensoryPointValue; y: SensoryPointValue}, values: SensoryPointValue[]): boolean => {
  return values.some(value => test.x === value || test.y === value);
}

const currentLevel = 'C1';
const nextLevel = 'C2';

const allTests: {x: SensoryPointValue; y: SensoryPointValue}[] = Array(100)
  .fill(0)
  .map((v, i) => {
    const indexes = i.toString().padStart(2, '0').split('').map(Number);
    const s: SensoryPointValue[] = ['0', '1', '2', '0*', '1*', '0**', '1**', 'NT', 'NT*', 'NT**'];
    return {x: s[indexes[0]], y: s[indexes[1]]};
  });

/**
 * All test cases (100 tests)
 */
const tests: Test[] = [
  {
    // 64 tests
    cases: allTests.filter(test => contains(test, ['0', '1', '0*', '1*'])),
    expected: {continue: false, level: currentLevel, variable: false},
  }, {
    // 11 tests
    cases: allTests.filter(test =>
      contains(test, ['NT*']) &&
      !contains(test, ['0', '1', '0*', '1*'])
    ),
    expected: {continue: false, level: currentLevel + '*', variable: true},
  }, {
    // 5 tests
    cases: allTests.filter(test => (
      contains(test, ['NT']) && contains(test, ['2', 'NT**']) ||
      test.x === 'NT' && test.y === 'NT'
    )),
    expected: {continue: true, level: currentLevel, variable: false},
  }, {
    // 4 tests
    cases: allTests.filter(test => (
      contains(test, ['NT']) && contains(test, ['0**', '1**'])
    )),
    expected: {continue: true, level: currentLevel, variable: true},
  }, {
    // 1 test
    cases: allTests.filter(test => test.x === '2' && test.y === '2'),
    expected: {continue: true, variable: false},
  }, {
    // 15 tests
    cases: allTests.filter(test => (
      contains(test, ['0**', '1**', 'NT**']) &&
      !contains(test, ['0', '1', '0*', '1*', 'NT*', 'NT'])
    )),
    expected: {continue: true, variable: true},
  },
];

const allTestedValues: string[] = [];

const checkSensoryLevelTest = (
  variable: boolean,
  side: ExamSide,
  pinPrick: SensoryPointValue,
  lightTouch: SensoryPointValue,
  expected: CheckLevelResult,
): void => {
  it(`pinPrick = ${pinPrick}; lightTouch = ${lightTouch};`, () => {
    side.pinPrick[nextLevel] = pinPrick;
    side.lightTouch[nextLevel] = lightTouch;
    const result = checkSensoryLevel(side, currentLevel, nextLevel, variable);
    if (expected.level) {
      expect(result.level).toBe(expected.level);
    } else {
      expect(result.level).toBeUndefined();
    }
    expect(result.continue).toBe(expected.continue);
    expect(result.variable).toBe(expected.variable);
  })
  allTestedValues.push(pinPrick+lightTouch+variable);
}
// 200 tests + 1 verification test
describe('checkSensoryLevel', () => {
  // 100 tests
  describe(`variable = false`, () => {
    for (const test of tests) {
      describe(JSON.stringify(test.expected), () => {
        const side = newEmptySide();
        for (const testCase of test.cases) {
          checkSensoryLevelTest(false, side, testCase.x, testCase.y, test.expected);
        }
      })
    }
  })

  // 100 tests
  describe(`variable = true`, () => {
    for (const test of tests) {
      const expected = {
        continue: test.expected.continue,
        level: test.expected.level ? test.expected.level + (test.expected.level[2] === '*' ? '' : '*'): undefined,
        variable: true,
      }
      describe(JSON.stringify(expected), () => {
        const side = newEmptySide();
        for (const testCase of test.cases) {
          checkSensoryLevelTest(true, side, testCase.x, testCase.y, expected);
        }
      })
    }
  })

  // verification test
  it('check all tests are unique', () => {
    const hashSet = new Set(allTestedValues);
    expect(hashSet.size).toBe(200);
    expect(allTestedValues.length).toBe(200);
  })
})
