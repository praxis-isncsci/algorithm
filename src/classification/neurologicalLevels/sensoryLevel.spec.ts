import { ExamSide, SensoryPointValue } from '../../interfaces';
import {
  checkSensoryLevel,
  determineSensoryLevel,
  sensoryLevelSteps,
  SensoryLevelCheckBranch,
  SensoryLevelError,
} from './sensoryLevel';
import {
  newEmptySide,
  newNormalSide,
  propagateSensoryValueFrom,
} from '../commonSpec';
import { CheckLevelResult } from '../common';

type TestExpected = CheckLevelResult & { branch: SensoryLevelCheckBranch };

type Test = {
  cases: { x: SensoryPointValue; y: SensoryPointValue }[];
  expected: TestExpected;
};

const contains = (
  test: { x: SensoryPointValue; y: SensoryPointValue },
  values: SensoryPointValue[],
): boolean => {
  return values.some((value) => test.x === value || test.y === value);
};

const currentLevel = 'C1';
const nextLevel = 'C2';

const allTests: { x: SensoryPointValue; y: SensoryPointValue }[] = Array(100)
  .fill(0)
  .map((v, i) => {
    const indexes = i.toString().padStart(2, '0').split('').map(Number);
    const s: SensoryPointValue[] = [
      '0',
      '1',
      '2',
      '0*',
      '1*',
      '0**',
      '1**',
      'NT',
      'NT*',
      'NT**',
    ];
    return { x: s[indexes[0]], y: s[indexes[1]] };
  });

/**
 * All test cases (100 tests)
 */
const tests: Test[] = [
  {
    // 64 tests
    cases: allTests.filter((test) => contains(test, ['0', '1', '0*', '1*'])),
    expected: {
      continue: false,
      level: currentLevel,
      variable: false,
      branch: 'abnormal',
    },
  },
  {
    // 11 tests
    cases: allTests.filter(
      (test) =>
        contains(test, ['NT*']) && !contains(test, ['0', '1', '0*', '1*']),
    ),
    expected: {
      continue: false,
      level: currentLevel + '*',
      variable: true,
      branch: 'ntStar',
    },
  },
  {
    // 5 tests
    cases: allTests.filter(
      (test) =>
        (contains(test, ['NT']) && contains(test, ['2', 'NT**'])) ||
        (test.x === 'NT' && test.y === 'NT'),
    ),
    expected: {
      continue: true,
      level: currentLevel,
      variable: false,
      branch: 'ntNotVariable',
    },
  },
  {
    // 4 tests
    cases: allTests.filter(
      (test) => contains(test, ['NT']) && contains(test, ['0**', '1**']),
    ),
    expected: {
      continue: true,
      level: currentLevel,
      variable: true,
      branch: 'ntVariable',
    },
  },
  {
    // 1 test
    cases: allTests.filter((test) => test.x === '2' && test.y === '2'),
    expected: { continue: true, variable: false, branch: 'bothNormal' },
  },
  {
    // 15 tests
    cases: allTests.filter(
      (test) =>
        contains(test, ['0**', '1**', 'NT**']) &&
        !contains(test, ['0', '1', '0*', '1*', 'NT*', 'NT']),
    ),
    expected: { continue: true, variable: true, branch: 'otherVariable' },
  },
];

const allTestedValues: string[] = [];

const checkSensoryLevelTest = (
  variable: boolean,
  side: ExamSide,
  pinPrick: SensoryPointValue,
  lightTouch: SensoryPointValue,
  expected: TestExpected,
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
    expect(result.branch).toBe(expected.branch);
  });
  allTestedValues.push(pinPrick + lightTouch + variable);
};
// 200 tests + 1 verification test
describe('checkSensoryLevel', () => {
  // 100 tests
  describe(`variable = false`, () => {
    for (const test of tests) {
      describe(JSON.stringify(test.expected), () => {
        const side = newEmptySide();
        for (const testCase of test.cases) {
          checkSensoryLevelTest(
            false,
            side,
            testCase.x,
            testCase.y,
            test.expected,
          );
        }
      });
    }
  });

  // 100 tests
  describe(`variable = true`, () => {
    for (const test of tests) {
      const expected: TestExpected = {
        continue: test.expected.continue,
        level: test.expected.level
          ? test.expected.level + (test.expected.level[2] === '*' ? '' : '*')
          : undefined,
        variable: true,
        branch: test.expected.branch,
      };
      describe(JSON.stringify(expected), () => {
        const side = newEmptySide();
        for (const testCase of test.cases) {
          checkSensoryLevelTest(true, side, testCase.x, testCase.y, expected);
        }
      });
    }
  });

  // verification test
  it('check all tests are unique', () => {
    const hashSet = new Set(allTestedValues);
    expect(hashSet.size).toBe(200);
    expect(allTestedValues.length).toBe(200);
  });
});

describe('checkSensoryLevel errors', () => {
  it('throws INVALID_NEXT_LEVEL when nextLevel is C1', () => {
    const side = newEmptySide();
    let err: SensoryLevelError | undefined;
    try {
      checkSensoryLevel(side, 'C2', 'C1', false);
    } catch (e) {
      err = e as SensoryLevelError;
    }
    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(SensoryLevelError);
    if (err) expect(err.code).toBe('INVALID_NEXT_LEVEL');
  });

  it('does not throw when LT=NT and PP=0 (NT matches NTNotVariableSensory)', () => {
    // Documents that (NT, 0) returns ntNotVariable; the NT_BRANCH_UNMATCHED
    // throw is unreachable with valid SensoryPointValue.
    const side = newEmptySide();
    side.lightTouch.C2 = 'NT';
    side.pinPrick.C2 = '0';
    expect(() => checkSensoryLevel(side, 'C1', 'C2', false)).not.toThrow();
  });

  it('SensoryLevelError supports NT_BRANCH_UNMATCHED code', () => {
    // Verifies the error code exists for defensive error handling (throw path
    // is unreachable with valid SensoryPointValue).
    const err = new SensoryLevelError('NT_BRANCH_UNMATCHED');
    expect(err.code).toBe('NT_BRANCH_UNMATCHED');
  });
});

describe('determineSensoryLevel', () => {
  it('returns INT when all sensory values are normal', () => {
    const side = newNormalSide();
    expect(determineSensoryLevel(side)).toBe('INT');
  });

  it('returns sensory level when abnormality found', () => {
    const side = newNormalSide();
    propagateSensoryValueFrom(side, 'T5', '0');
    expect(determineSensoryLevel(side)).toBe('T4');
  });

  it('returns INT* when variable sensory at end', () => {
    const side = newNormalSide();
    side.lightTouch.S4_5 = '0**';
    side.pinPrick.S4_5 = '2';
    expect(determineSensoryLevel(side)).toBe('INT*');
  });

  it('returns C4* when NT* is found at C5', () => {
    const side = newNormalSide();
    side.lightTouch.C5 = 'NT*';
    side.pinPrick.C5 = '2';
    expect(determineSensoryLevel(side)).toBe('C4*');
  });
});

describe('sensoryLevelSteps', () => {
  it('yields at least one step', () => {
    const side = newNormalSide();
    const steps = Array.from(sensoryLevelSteps(side));
    expect(steps.length).toBeGreaterThanOrEqual(1);
  });

  it('final step result matches determineSensoryLevel for same inputs', () => {
    const side = newNormalSide();
    propagateSensoryValueFrom(side, 'T5', '0');

    const expected = determineSensoryLevel(side);
    const steps = Array.from(sensoryLevelSteps(side));
    const lastStep = steps[steps.length - 1];
    const actual = lastStep.state.levels.join(',');

    expect(actual).toBe(expected);
  });

  it('all normal yields INT and stops at last step', () => {
    const side = newNormalSide();
    const steps = Array.from(sensoryLevelSteps(side));
    expect(steps[steps.length - 1].next).toBeNull();
    expect(steps[steps.length - 1].state.levels).toEqual(['INT']);
  });

  it('abnormal at level yields multiple steps', () => {
    const side = newNormalSide();
    propagateSensoryValueFrom(side, 'T5', '0');

    const steps = Array.from(sensoryLevelSteps(side));
    expect(steps.length).toBeGreaterThan(1);
    expect(steps[steps.length - 1].next).toBeNull();
    expect(steps[steps.length - 1].state.levels).toContain('T4');
  });

  it('each step has description, actions, state, and next', () => {
    const side = newNormalSide();
    const steps = Array.from(sensoryLevelSteps(side));
    for (const step of steps) {
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('actions');
      expect(step).toHaveProperty('state');
      expect(step).toHaveProperty('next');
      expect(step.description).toHaveProperty('key');
      expect(Array.isArray(step.actions)).toBe(true);
      expect(step.state).toHaveProperty('levels');
    }
  });
});
