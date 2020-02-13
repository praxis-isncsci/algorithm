import { ExamSide, MotorMuscleValue } from '../../interfaces';
import { checkMotorLevel, checkMotorLevelBeforeStartOfKeyMuscles, checkMotorLevelAtEndOfKeyMuscles, checkWithSensoryCheckLevelResult } from './motorLevel';
import { newEmptySide } from '../commonSpec';
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
const nextLevel = 'C6';

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
    // 11 test
    cases: ['3','4','5','3*','4*','0**','1**','2**','3**','4**','NT**'],
    expected: {continue: true, variable: false},
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
    // 11 test
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['5']) &&
      !contains(test, 'nextLevel', ['0','1','2','0*','1*','2*','NT','NT*'])
    )),
    expected: {continue: true, variable: false},
  }, {
    // 66 test
    cases: allTests.filter(test => (
      contains(test, 'currentLevel', ['0**','1**','2**','3**','4**','NT**']) &&
      !contains(test, 'nextLevel', ['0','1','2','0*','1*','2*','NT','NT*'])
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
})
