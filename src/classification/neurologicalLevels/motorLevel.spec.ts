import { ExamSide, MotorMuscleValue } from '../../interfaces';
import {
  checkMotorLevel,
  checkMotorLevelBeforeStartOfKeyMuscles,
  checkMotorLevelAtEndOfKeyMuscles,
  checkWithSensoryCheckLevelResult,
  determineMotorLevel,
  motorLevelSteps,
  getInitialState,
  initializeMotorLevelIteration,
  checkLevel,
} from './motorLevel';
import { newEmptySide, newNormalSide, propagateSensoryValueFrom } from '../commonSpec';
import { CheckLevelResult } from '../common';

type TestCase = { currentLevel: MotorMuscleValue; nextLevel: MotorMuscleValue }
type Test = {
  cases: TestCase[];
  expected: CheckLevelResult | undefined;
};

type BeforeMotorTest = {
  cases: MotorMuscleValue[];
  expected: CheckLevelResult;
};

type AfterMotorTestCase = { values: MotorMuscleValue[]; sensoryCheckLevelResults?: CheckLevelResult[] }
type AfterMotorTest = {
  cases: AfterMotorTestCase[];
  expected: CheckLevelResult | undefined;
};

const currentLevel = 'C5';

const contains = (test: TestCase, type: 'currentLevel' | 'nextLevel', values: MotorMuscleValue[]): boolean => {
  return values.some(value => test[type] === value);
}

const allTests: {currentLevel: MotorMuscleValue; nextLevel: MotorMuscleValue}[] = Array(19*19)
  .fill(0)
  .map((v, i) => {
    const s: MotorMuscleValue[] = ['0', '1', '2', '3', '4', '5', '0*', '1*', '2*', '3*', '4*', '0**', '1**', '2**', '3**', '4**', 'NT', 'NT*', 'NT**'];
    const indexes = i.toString(19).padStart(2, '0').split('').map(v => parseInt(v, 19));
    return {currentLevel: s[indexes[0]], nextLevel: s[indexes[1]]};
  });

const beforeKeyMusclesTests: BeforeMotorTest[] = [
  {
    // 3 tests
    cases: ['0','1','2'],
    expected: {continue: false, level: 'C4', variable: false},
  }, {
    // 5 test
    cases: ['0*','1*','2*','NT','NT*'],
    expected: {continue: true, level: 'C4', variable: false},
  }, {
    // 11 test??? TODO
    cases: ['3','4','5','3*','4*','3**','4**','NT**'],
    expected: {continue: true, variable: false},
  }, {
    // 11 test??? TODO
    cases: ['0**','1**','2**'],
    expected: {continue: true, variable: true},
  },
];

const tests: Test[] = [
  {
    // 57 tests
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['0','1','2'])
    )),
    expected: undefined, // throw error
  }, {
    // 100 tests
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['3','4','3*','4*']) ||
      (
        contains(test, 'currentLevel', ['5','0**','1**','2**','3**','4**','NT','NT**']) &&
        contains(test, 'nextLevel', ['0','1','2'])
      )
    )),
    expected: {continue: false, level: currentLevel, variable: false},
  }, {
    // 76 test
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['0*','1*','2*','NT*'])
    )),
    expected: {continue: false, level: currentLevel + '*', variable: true},
  }, {
    // 11 test??? TODO
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['5']) &&
      !contains(test, 'nextLevel', ['0','1','2','0*','1*','2*','0**','1**','2**','NT','NT*'])
    )),
    expected: {continue: true, variable: false},
  }, {
    // 66 test??? TODO
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['0**','1**','2**','3**','4**','NT**']) &&
      !contains(test, 'nextLevel', ['0','1','2','0*','1*','2*','NT','NT*'])
    ) || (
      contains(test, 'currentLevel', ['5']) &&
      contains(test, 'nextLevel', ['0**','1**','2**'])
    )),
    expected: {continue: true, variable: true},
  }, {
    // 21 test
    cases: allTests.filter(test => (
      (
        contains(test, 'currentLevel', ['5']) &&
        contains(test, 'nextLevel', ['0*','1*','2*','NT','NT*'])
      ) || (
        contains(test, 'currentLevel', ['NT']) &&
        !contains(test, 'nextLevel', ['0','1','2'])
      )
    )),
    expected: {continue: true, level: currentLevel, variable: false},
  }, {
    // 15 test
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['3**','4**','NT**']) &&
      contains(test, 'nextLevel', ['0*','1*','2*','NT','NT*'])
    )),
    expected: {continue: true, level: currentLevel, variable: true},
  }, {
    // 15 test
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['0**','1**','2**']) &&
      contains(test, 'nextLevel', ['0*','1*','2*','NT','NT*'])
    )),
    expected: {continue: true, level: currentLevel + '*', variable: true},
  },
];

const afterMotorTests: AfterMotorTest[] = [
  {
    // 24 tests
    cases: [{ values: ['0','1','2'] }],
    expected: undefined,
  }, {
    cases: [
      {
        values: ['3','4','3*','4*']
      }, {
        values: ['5','3**','4**','NT**','NT'],
        sensoryCheckLevelResults: [
          {continue: false, variable: false},
          {continue: false, variable: true},
          {continue: false, level: 'foo', variable: false},
          {continue: false, level: 'foo', variable: true},
        ],
      }
    ],
    expected: {continue: false, level: 'T1', variable: false},
  }, {
    // 32 tests
    cases: [
      {
        values: ['0*','1*','2*','NT*']
      }, {
        values: ['0**','1**','2**'],
        sensoryCheckLevelResults: [
          {continue: false, variable: false},
          {continue: false, variable: true},
          {continue: false, level: 'foo', variable: false},
          {continue: false, level: 'foo', variable: true},
        ]
      }
    ],
    expected: {continue: false, level: 'T1*', variable: true},
  }, {
    // 16 tests
    cases: [
      {
        values: ['NT'],
        sensoryCheckLevelResults: [
          {continue: true, variable: false},
        ],
      }, {
        values: ['5','NT'],
        sensoryCheckLevelResults: [
          {continue: true, level: 'foo', variable: false},
          {continue: true, level: 'foo', variable: true},
        ],
      }
    ],
    expected: {continue: true, level: 'T1', variable: false},
  }, {
    cases: [
      {
        values: ['NT'],
        sensoryCheckLevelResults: [
          {continue: true, variable: true},
        ],
      }, {
        values: ['3**','4**','NT**'],
        sensoryCheckLevelResults: [
          {continue: true, level: 'foo', variable: true},
          {continue: true, level: 'foo', variable: false},
        ],
      }
    ],
    expected: {continue: true, level: 'T1', variable: true},
  }, {
    cases: [{
      values: ['0**','1**','2**'],
      sensoryCheckLevelResults: [
        {continue: true, level: 'foo', variable: true},
        {continue: true, level: 'foo', variable: false},
      ],
    }],
    expected: {continue: true, level: 'T1*', variable: true},
  }, {
    cases: [{
      values: ['5'],
      sensoryCheckLevelResults: [
        {continue: true, variable: false},
      ],
    }],
    expected: {continue: true, variable: false},
  }, {
    cases: [
      {
        values: ['5'],
        sensoryCheckLevelResults: [
          {continue: true, variable: true},
        ],
      }, {
        values: ['0**','1**','2**','3**','4**','NT**'],
        sensoryCheckLevelResults: [
          {continue: true, variable: false},
          {continue: true, variable: true},
        ],
      }
    ],
    expected: {continue: true, variable: true},
  },
]

// 1064 tests + 3 verification test
describe('determineMotorLevel', () => {
  // 38 tests (19 * 2) + 1 verification test
  describe(`checkMotorLevelBeforeStartOfKeyMuscles`, () => {
    const currentLevel = 'C4';
    const nextLevel = 'C5';
    const allValues: string[] = [];
    const checkMotorLevelBeforeStartOfKeyMusclesTest = (variable: boolean, testCase: MotorMuscleValue, expected: CheckLevelResult): void => {
      const side: ExamSide = newEmptySide();
      side.motor[nextLevel] = testCase;
      it(`${testCase}`, () => {
        const result = checkMotorLevelBeforeStartOfKeyMuscles(side, currentLevel, nextLevel, variable);
        expect(result.level).toBe(expected.level);
        expect(result.continue).toBe(expected.continue);
        expect(result.variable).toBe(expected.variable);
      })
      allValues.push(side.motor[nextLevel]+variable);
    }

    describe('variable = false', () => {
      for (const test of beforeKeyMusclesTests) {
        describe(`expected: ${JSON.stringify(test.expected)}`, () => {
          for (const testCase of test.cases) {
            checkMotorLevelBeforeStartOfKeyMusclesTest(false, testCase, test.expected);
          }
        })
      }
    })

    describe('variable = true', () => {
      for (const test of beforeKeyMusclesTests) {
        const expected = {
          continue: test.expected.continue,
          level: test.expected.level ? test.expected.level + '*' : undefined,
          variable: true,
        };
        describe(`expected: ${JSON.stringify(expected)}`, () => {
          for (const testCase of test.cases) {
            checkMotorLevelBeforeStartOfKeyMusclesTest(true, testCase, expected);
          }
        })
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues);
      expect(allValues.length).toBe(19 * 2);
      expect(hashSet.size).toBe(19 * 2);
    })
  })

  // 722 tests (19 * 19 * 2) + 1 verification test
  describe(`checkMotorLevel`, () => {
    const allValues: string[] = [];

    const checkMotorLevelTest = (variable: boolean, testCase: TestCase, expected?: CheckLevelResult): string => {
      const currentLevel = 'C5';
      const nextLevel = 'C6';
      const side = newEmptySide();
      side.motor[currentLevel] = testCase.currentLevel;
      side.motor[nextLevel] = testCase.nextLevel;

      it(`${testCase.currentLevel} ${testCase.nextLevel}`, () => {
        if (expected === undefined) {
          const currentLevelMotorIsImpairedTest = (): void => {
            checkMotorLevel(side, currentLevel, nextLevel, variable);
          }
          expect(currentLevelMotorIsImpairedTest).toThrowError();
        } else {
          const result = checkMotorLevel(side, currentLevel, nextLevel, variable);
          if (expected.level) {
            expect(result.level).toBe(expected.level);
          } else {
            expect(result.level).toBeUndefined();
          }
          expect(result.continue).toBe(expected.continue);
          expect(result.variable).toBe(expected.variable);
        }
      })
      return variable+side.motor[currentLevel]+side.motor[nextLevel];
    }

    describe('variable = false', () => {
      for (const test of tests) {
        describe(`expected: ${JSON.stringify(test.expected)}`, () => {
          for (const testCase of test.cases) {
            allValues.push(checkMotorLevelTest(false, testCase, test.expected));
          }
        })
      }
    })

    describe('variable = true', () => {
      for (const test of tests) {
        const expected = test.expected ? {
          continue: test.expected.continue,
          level: !test.expected.level ? undefined
            : test.expected.level.includes('*') ? test.expected.level
              : test.expected.level + '*',
          variable: true,
        } : undefined;

        describe(`expected: ${JSON.stringify(expected)}`, () => {
          for (const testCase of test.cases) {
            allValues.push(checkMotorLevelTest(true, testCase, expected));
          }
        })
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues);
      expect(allValues.length).toBe(361 * 2);
      expect(hashSet.size).toBe(361 * 2);
    })
  })

  // 304 tests (19 * 8 * 2) + 1 verification test
  describe(`checkMotorLevelAtEndOfKeyMuscles: checkWithSensoryCheckLevelResult`, () => {
    const allValues: string[] = [];

    const checkWithSensoryCheckLevelResultTest = (variable: boolean, testCase: AfterMotorTestCase, expected?: CheckLevelResult): void => {
      const currentLevel = 'T1';
      const side = newEmptySide();

      for (const value of testCase.values) {
        side.motor[currentLevel] = value;
        const sensoryCheckLevelResults = testCase.sensoryCheckLevelResults ?
          testCase.sensoryCheckLevelResults : [
            {continue: false, variable: false},
            {continue: false, variable: true},
            {continue: false, level: 'foo', variable: false},
            {continue: false, level: 'foo', variable: true},
            {continue: true, variable: false},
            {continue: true, variable: true},
            {continue: true, level: 'foo', variable: false},
            {continue: true, level: 'foo', variable: true},
          ];

        for (const sensoryCheckLevelResult of sensoryCheckLevelResults) {
          it(`${value} ${JSON.stringify(sensoryCheckLevelResult)}`, () => {
            if (expected === undefined) {
              const errorCheckMotorLevelAtEndOfKeyMusclesTest = (): void => {
                checkMotorLevelAtEndOfKeyMuscles(side, currentLevel, variable);
              }
              expect(errorCheckMotorLevelAtEndOfKeyMusclesTest).toThrowError();
            } else {
              const result = checkWithSensoryCheckLevelResult(side, currentLevel, variable, sensoryCheckLevelResult);
              if (expected.level) {
                expect(result.level).toBe(expected.level);
              } else {
                expect(result.level).toBeUndefined();
              }
              expect(result.continue).toBe(expected.continue);
              expect(result.variable).toBe(expected.variable);
            }
          })
          allValues.push(variable+side.motor[currentLevel]+sensoryCheckLevelResult.continue+sensoryCheckLevelResult.level+sensoryCheckLevelResult.variable);
        }
      }
    }

    describe('variable = false', () => {
      for (const test of afterMotorTests) {
        describe(`expected: ${JSON.stringify(test.expected)}`, () => {
          for (const testCase of test.cases) {
            checkWithSensoryCheckLevelResultTest(false, testCase, test.expected);
          }
        })
      }
    })

    describe('variable = true', () => {
      for (const test of afterMotorTests) {
        const expected = test.expected ? {
          continue: test.expected.continue,
          level: !test.expected.level ? undefined
            : test.expected.level.includes('*') ? test.expected.level
              : test.expected.level + '*',
          variable: true,
        } : undefined;
        describe(`expected: ${JSON.stringify(expected)}`, () => {
          for (const testCase of test.cases) {
            checkWithSensoryCheckLevelResultTest(true, testCase, expected);
          }
        })
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues);
      expect(allValues.length).toBe(152 * 2);
      expect(hashSet.size).toBe(152 * 2);
    })
  })

  /* *************************************** */
  /*  Step-Based Structure Tests            */
  /* *************************************** */

  describe('getInitialState', () => {
    it('creates initial state with correct properties', () => {
      const side = newNormalSide();
      const vac = 'No';
      const state = getInitialState(side, vac);

      expect(state.side).toBe(side);
      expect(state.vac).toBe(vac);
      expect(state.levels).toEqual([]);
      expect(state.variable).toBe(false);
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('initializeMotorLevelIteration', () => {
    it('initializes state correctly and chains to checkLevel', () => {
      const side = newNormalSide();
      const state = getInitialState(side, 'No');
      const step = initializeMotorLevelIteration(state);

      expect(step.state.levels).toEqual([]);
      expect(step.state.variable).toBe(false);
      expect(step.state.currentIndex).toBe(0);
      expect(step.next).toBe(checkLevel);
      expect(step.description.key).toBe('motorLevelInitializeMotorLevelIterationDescription');
      expect(step.actions.length).toBe(1);
      expect(step.actions[0].key).toBe('motorLevelInitializeMotorLevelIterationAction');
    });
  });

  describe('checkLevel step handler', () => {
    describe('sensory regions (C1-C3)', () => {
      it('checks sensory at C2 when all values are normal', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 1; // C2

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('C2');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelSensoryRegionAction')).toBe(true);
        expect(step.next).toBe(checkLevel);
        expect(step.state.currentIndex).toBe(2);
      });

      it('evaluates C2 when sensory values are impaired', () => {
        const side = newNormalSide();
        side.lightTouch.C2 = '0';
        side.pinPrick.C2 = '0';
        const state = getInitialState(side, 'No');
        state.currentIndex = 1; // C2

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('C2');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelSensoryRegionAction')).toBe(true);
        // Verify step executes correctly; actual stop behavior depends on checkSensoryLevel logic
      });
    });

    describe('before key muscles (C4)', () => {
      it('checks C4 before cervical key muscles with normal C5', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 3; // C4

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('C4');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelBeforeKeyMusclesAction')).toBe(true);
        expect(step.actions.some(a => a.params?.nextLevel === 'C5')).toBe(true);
        expect(step.next).toBe(checkLevel);
      });

      it('stops at C4 when C5 motor is impaired', () => {
        const side = newNormalSide();
        side.motor.C5 = '0';
        const state = getInitialState(side, 'No');
        state.currentIndex = 3; // C4

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('C4');
      });
    });

    describe('before key muscles (L1)', () => {
      it('checks L1 before lumbar key muscles with normal L2', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 20; // L1

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('L1');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelBeforeKeyMusclesAction')).toBe(true);
        expect(step.actions.some(a => a.params?.nextLevel === 'L2')).toBe(true);
        expect(step.next).toBe(checkLevel);
      });
    });

    describe('key motor regions (C5-C8)', () => {
      it('checks C5 motor level with normal values', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 4; // C5

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('C5');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelKeyMotorAction')).toBe(true);
        expect(step.next).toBe(checkLevel);
      });

      it('stops at C6 when motor grade is 3', () => {
        const side = newNormalSide();
        side.motor.C6 = '3';
        const state = getInitialState(side, 'No');
        state.currentIndex = 5; // C6

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('C6');
        expect(step.state.variable).toBe(false);
      });

      it('stops at C7 with variable false when motor is 3*', () => {
        const side = newNormalSide();
        side.motor.C7 = '3*';
        const state = getInitialState(side, 'No');
        state.currentIndex = 6; // C7

        const step = checkLevel(state);

        // Based on checkMotorLevel logic, '3*' in currentLevel returns {continue: false, level: currentLevel, variable: false}
        expect(step.state.variable).toBe(false);
        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('C7');
      });
    });

    describe('key motor regions (L2-L5)', () => {
      it('checks L2 motor level with normal values', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 21; // L2

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('L2');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelKeyMotorAction')).toBe(true);
        expect(step.next).toBe(checkLevel);
      });

      it('stops at L3 when motor grade is 4', () => {
        const side = newNormalSide();
        side.motor.L3 = '4';
        const state = getInitialState(side, 'No');
        state.currentIndex = 22; // L3

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('L3');
      });
    });

    describe('end of key muscles (T1)', () => {
      it('checks T1 at end of cervical key muscles', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 8; // T1

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('T1');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelEndOfKeyMusclesAction')).toBe(true);
        expect(step.next).toBe(checkLevel);
      });

      it('stops at T1 when motor grade is 3', () => {
        const side = newNormalSide();
        side.motor.T1 = '3';
        const state = getInitialState(side, 'No');
        state.currentIndex = 8; // T1

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('T1');
      });
    });

    describe('end of key muscles (S1)', () => {
      it('checks S1 at end of lumbar key muscles', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 25; // S1

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.description.params?.levelName).toBe('S1');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelEndOfKeyMusclesAction')).toBe(true);
        expect(step.next).toBe(checkLevel);
      });

      it('stops at S1 when motor grade is 4*', () => {
        const side = newNormalSide();
        side.motor.S1 = '4*';
        const state = getInitialState(side, 'No');
        state.currentIndex = 25; // S1

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('S1');
        // Based on checkMotorLevelAtEndOfKeyMuscles -> checkWithSensoryCheckLevelResult logic
        // '4*' returns level without variable flag set
        expect(step.state.variable).toBe(false);
      });
    });

    describe('VAC handling at S4_5', () => {
      it('VAC=No with S3 not in levels adds S3 and stops', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.description.key).toBe('motorLevelCheckLevelDescription');
        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelVACNoAction')).toBe(true);
        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('S3');
      });

      it('VAC=No with S3 already in levels stops without adding', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.levels = ['S3'];
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toEqual(['S3']);
      });

      it('VAC=NT with S3 not in levels adds S3 and INT', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'NT');
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelVACNTAction')).toBe(true);
        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('S3');
        expect(step.state.levels).toContain('INT');
      });

      it('VAC=NT with S3 already in levels adds INT only', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'NT');
        state.levels = ['S3'];
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('S3');
        expect(step.state.levels).toContain('INT');
        expect(step.state.levels.length).toBe(2);
      });

      it('VAC=Yes adds INT and stops', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'Yes');
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.actions.some(a => a.key === 'motorLevelCheckLevelVACYesAction')).toBe(true);
        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('INT');
        expect(step.state.levels).not.toContain('S3');
      });

      it('VAC=No with variable flag adds S3* and stops', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'No');
        state.variable = true;
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('S3*');
      });

      it('VAC=Yes with variable flag adds INT* and stops', () => {
        const side = newNormalSide();
        const state = getInitialState(side, 'Yes');
        state.variable = true;
        state.currentIndex = 28; // S4_5

        const step = checkLevel(state);

        expect(step.next).toBeNull();
        expect(step.state.levels).toContain('INT*');
      });
    });
  });

  describe('motorLevelSteps generator', () => {
    it('yields at least one step', () => {
      const side = newNormalSide();
      const steps = Array.from(motorLevelSteps(side, 'No'));
      expect(steps.length).toBeGreaterThanOrEqual(1);
    });

    it('final step result matches determineMotorLevel for same inputs', () => {
      const side = newNormalSide();
      side.motor.C6 = '3';

      const expected = determineMotorLevel(side, 'No');
      const steps = Array.from(motorLevelSteps(side, 'No'));
      const lastStep = steps[steps.length - 1];
      const actual = lastStep.state.levels.join(',');

      expect(actual).toBe(expected);
    });

    it('each step has description, actions, state, and next', () => {
      const side = newNormalSide();
      const steps = Array.from(motorLevelSteps(side, 'No'));

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

    it('stops when motor level is found at C6', () => {
      const side = newNormalSide();
      side.motor.C6 = '3';

      const steps = Array.from(motorLevelSteps(side, 'No'));
      const lastStep = steps[steps.length - 1];

      expect(lastStep.next).toBeNull();
      expect(lastStep.state.levels).toContain('C6');
    });

    it('yields multiple steps for full traversal to S4_5', () => {
      const side = newNormalSide();

      const steps = Array.from(motorLevelSteps(side, 'Yes'));

      expect(steps.length).toBeGreaterThan(1);
      expect(steps[steps.length - 1].next).toBeNull();
      expect(steps[steps.length - 1].state.levels).toContain('INT');
    });

    it('handles VAC=NT correctly in generator', () => {
      const side = newNormalSide();

      const steps = Array.from(motorLevelSteps(side, 'NT'));
      const lastStep = steps[steps.length - 1];

      expect(lastStep.state.levels).toContain('S3');
      expect(lastStep.state.levels).toContain('INT');
    });

    it('matches original determineMotorLevel for normal side with VAC=No', () => {
      const side = newNormalSide();
      const expected = determineMotorLevel(side, 'No');
      const steps = Array.from(motorLevelSteps(side, 'No'));
      const actual = steps[steps.length - 1].state.levels.join(',');

      expect(actual).toBe(expected);
    });

    it('matches original determineMotorLevel for impaired motor at T1', () => {
      const side = newNormalSide();
      side.motor.T1 = '3*';

      const expected = determineMotorLevel(side, 'No');
      const steps = Array.from(motorLevelSteps(side, 'No'));
      const actual = steps[steps.length - 1].state.levels.join(',');

      expect(actual).toBe(expected);
      expect(actual).toBe('T1');
    });

    it('matches original determineMotorLevel for complex case with sensory regions', () => {
      const side = newNormalSide();
      propagateSensoryValueFrom(side, 'T5', '0');

      const expected = determineMotorLevel(side, 'No');
      const steps = Array.from(motorLevelSteps(side, 'No'));
      const actual = steps[steps.length - 1].state.levels.join(',');

      expect(actual).toBe(expected);
    });

    it('matches original determineMotorLevel for lumbar impairment', () => {
      const side = newNormalSide();
      side.motor.L3 = '4*';

      const expected = determineMotorLevel(side, 'No');
      const steps = Array.from(motorLevelSteps(side, 'No'));
      const actual = steps[steps.length - 1].state.levels.join(',');

      expect(actual).toBe(expected);
      expect(actual).toBe('L3');
    });

    it('variable flag accumulates across multiple levels', () => {
      const side = newNormalSide();
      side.motor.C5 = '5';
      side.motor.C6 = '0**'; // This should set variable

      const steps = Array.from(motorLevelSteps(side, 'No'));

      // Find step where variable becomes true
      const variableSteps = steps.filter(s => s.state.variable === true);
      expect(variableSteps.length).toBeGreaterThan(0);
    });

    it('currentIndex increments correctly through iteration', () => {
      const side = newNormalSide();
      side.motor.C7 = '3';

      const steps = Array.from(motorLevelSteps(side, 'No'));

      // Check that currentIndex starts at 0 and increments
      expect(steps[0].state.currentIndex).toBe(0);

      for (let i = 1; i < steps.length - 1; i++) {
        if (steps[i].next !== null) {
          expect(steps[i].state.currentIndex).toBeGreaterThan(steps[i - 1].state.currentIndex);
        }
      }
    });
  });

  describe('determineMotorLevel with step-based implementation', () => {
    it('returns correct motor level for normal side with VAC=No', () => {
      const side = newNormalSide();
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('S3');
    });

    it('returns correct motor level for normal side with VAC=Yes', () => {
      const side = newNormalSide();
      const result = determineMotorLevel(side, 'Yes');
      expect(result).toBe('INT');
    });

    it('returns correct motor level for normal side with VAC=NT', () => {
      const side = newNormalSide();
      const result = determineMotorLevel(side, 'NT');
      expect(result).toBe('S3,INT');
    });

    it('returns C6 when C6 motor grade is 3', () => {
      const side = newNormalSide();
      side.motor.C6 = '3';
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('C6');
    });

    it('returns C4 when C5 motor is 0', () => {
      const side = newNormalSide();
      side.motor.C5 = '0';
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('C4');
    });

    it('returns C6 without * when motor is 3*', () => {
      const side = newNormalSide();
      side.motor.C6 = '3*';
      const result = determineMotorLevel(side, 'No');
      // Based on checkMotorLevel logic, '3*' returns level without * suffix
      expect(result).toBe('C6');
    });

    it('handles sensory region impairment at C2', () => {
      const side = newNormalSide();
      side.lightTouch.C2 = '0';
      side.pinPrick.C2 = '0';
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('C1');
    });

    it('handles end of key muscles at T1 correctly', () => {
      const side = newNormalSide();
      side.motor.T1 = '3';
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('T1');
    });

    it('handles end of key muscles at S1 correctly', () => {
      const side = newNormalSide();
      side.motor.S1 = '4';
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('S1');
    });

    it('handles lumbar impairment correctly', () => {
      const side = newNormalSide();
      side.motor.L3 = '4';
      const result = determineMotorLevel(side, 'No');
      expect(result).toBe('L3');
    });
  });
})
