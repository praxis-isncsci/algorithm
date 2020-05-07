// TODO: all of it

import { SensoryPointValue, BinaryObservation } from "../../../interfaces";
import { CheckAISResult, isSensoryPreserved } from "../common";
import { newEmptyExam } from "../../commonSpec";

interface TestValues {
  w: SensoryPointValue;
  x: SensoryPointValue;
  y: SensoryPointValue;
  z: SensoryPointValue;
}

type Test = {
  cases: { sensory: TestValues[]; dap: BinaryObservation[] }[];
  expected: CheckAISResult;
};

const contains = (test: TestValues, type: 'some' | 'only', values: SensoryPointValue[]): boolean => (
  type === 'some' ? [test.w, test.x, test.y, test.z].some(value => values.includes(value))
    : [test.w, test.x, test.y, test.z].every(value => values.includes(value))
)

const allTests: TestValues[] = Array(10000)
  .fill(0)
  .map((v, i) => {
    const indexes = i.toString().padStart(4, '0').split('').map(Number);
    const s: SensoryPointValue[] = ['0', '1', '2', '0*', '1*', '0**', '1**', 'NT', 'NT*', 'NT**'];
    return {w: s[indexes[0]], x: s[indexes[1]], y: s[indexes[2]], z: s[indexes[3]]};
  });

const tests: Test[] = [
  {
    cases: [
      {
        dap: ['No'],
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0'])
        ),
      }
    ],
    expected: {result: false, variable: false},
  }, {
    cases: [
      {
        dap: ['Yes', 'NT'],
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0'])
        ),
      }, {
        dap: ['Yes', 'No', 'NT'],
        sensory: allTests.filter(test =>
          !contains(test, 'only', ['0', '0*', '0**'])
        ),
      }, {
        dap: ['Yes', 'NT'],
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0*', '0**']) &&
          !contains(test, 'only', ['0'])
        ),
      }
    ],
    expected: {result: true, variable: false},
  }, {
    cases: [
      {
        dap: ['No'],
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0*', '0**']) &&
          !contains(test, 'only', ['0'])
        ),
      }
    ],
    expected: {result: true, variable: true},
  },
]

describe('AIS B' ,() => {
  xdescribe('isSensoryPreserved', () => {
    const allValues: string[] = [];
    for (const test of tests) {
      for (const testCase of test.cases) {
        const numberOfTestCases = test.cases.reduce((sum,c) => sum + (c.sensory.length * c.dap.length),0);
        it(`expected: ${JSON.stringify(test.expected)} - ${numberOfTestCases} tests`, () => {
          for (const dap of testCase.dap) {
            for (const sensory of testCase.sensory) {
              const exam = newEmptyExam();
              exam.deepAnalPressure = dap;
              exam.right.lightTouch.S4_5 = sensory.w;
              exam.right.pinPrick.S4_5 = sensory.x;
              exam.left.lightTouch.S4_5 = sensory.y;
              exam.left.pinPrick.S4_5 = sensory.z;

              const result = isSensoryPreserved(exam);
              expect(result.result).toBe(test.expected.result);
              expect(result.variable).toBe(test.expected.variable);
              allValues.push(dap+sensory.w+sensory.x+sensory.y+sensory.z);
            }
          }
        })
      }
    }

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues);
      expect(allValues.length).toBe(hashSet.size);
      expect(allValues.length).toBe(30000);
    })
  })
  xdescribe('motorCanBeNotPreserved', () => {
    expect(undefined).toBeDefined();
  })
})