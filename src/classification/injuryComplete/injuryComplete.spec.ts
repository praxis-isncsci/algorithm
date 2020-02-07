import { Exam } from "../../interfaces"
import { determineInjuryComplete } from "./injuryComplete";
import { newEmptyExam } from "../commonSpec";
import { BinaryObservation, InjuryComplete, SensoryPointValue } from "../../interfaces";

interface TestValues {
  w: SensoryPointValue;
  x: SensoryPointValue;
  y: SensoryPointValue;
  z: SensoryPointValue;
}

type Test = {
  cases: { sensory: TestValues[]; anal: {dap: BinaryObservation; vac: BinaryObservation}[] }[];
  expected: InjuryComplete;
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
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0'])
        ),
        anal: [{dap: 'No', vac: 'No'}],
      }
    ],
    expected: 'C',
  }, {
    cases: [
      {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0*', 'NT', 'NT*']) &&
          !contains(test, 'only', ['0', '0*'])
        ),
        anal: [{dap: 'No', vac: 'No'}],
      }, {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0']) ||
          contains(test, 'only', ['0', '0*', 'NT', 'NT*']) &&
          !contains(test, 'only', ['0', '0*'])
        ),
        anal: [
          {dap: 'NT', vac: 'NT'},
          {dap: 'No', vac: 'NT'},
          {dap: 'NT', vac: 'No'},
        ],
      }
    ],
    expected: 'C,I',
  }, {
    cases: [
      {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0*']) && !contains(test, 'only', ['0'])
        ),
        anal: [
          {dap:'No',vac:'No'},
        ]
      }
    ],
    expected: 'C,I*',
  }, {
    cases: [
      {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0*']) && !contains(test, 'only', ['0'])
        ),
        anal: [
          {dap: 'NT', vac: 'NT'},
          {dap: 'No', vac: 'NT'},
          {dap: 'NT', vac: 'No'},
        ]
      }
    ],
    expected: 'C*,I',
  }, {
    cases: [
      {
        sensory: allTests.filter(test =>
          contains(test, 'some', ['1', '2', '1*', '0**', '1**', 'NT**']) &&
          !contains(test, 'only', ['0', '0**'])
        ),
        anal: [
          {dap:'Yes',vac:'Yes'},
          {dap:'Yes',vac:'No'},
          {dap:'Yes',vac:'NT'},
          {dap:'No',vac:'Yes'},
          {dap:'No',vac:'No'},
          {dap:'No',vac:'NT'},
          {dap:'NT',vac:'Yes'},
          {dap:'NT',vac:'No'},
          {dap:'NT',vac:'NT'},
        ]
      }, {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0**']) && !contains(test, 'only', ['0'])
        ),
        anal: [
          {dap:'Yes',vac:'Yes'},
          {dap:'Yes',vac:'No'},
          {dap:'Yes',vac:'NT'},
          {dap:'No',vac:'Yes'},
          {dap:'No',vac:'NT'},
          {dap:'NT',vac:'Yes'},
          {dap:'NT',vac:'No'},
          {dap:'NT',vac:'NT'},
        ]
      }, {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0*', 'NT', 'NT*'])
        ),
        anal: [
          {dap:'Yes',vac:'Yes'},
          {dap:'Yes',vac:'No'},
          {dap:'Yes',vac:'NT'},
          {dap:'No',vac:'Yes'},
          {dap:'NT',vac:'Yes'},
        ]
      }
    ],
    expected: 'I',
  }, {
    cases: [
      {
        sensory: allTests.filter(test =>
          contains(test, 'only', ['0', '0**']) && !contains(test, 'only', ['0'])
        ),
        anal: [
          {dap:'No',vac:'No'},
        ]
      }
    ],
    expected: 'I*',
  }
]

const allValues: string[] = [];

// 90000 tests + 1 validation test
describe('injuryComplete', () => {
  const exam: Exam = newEmptyExam();
  const testInjuryComplete = (test: Test, expected: InjuryComplete): void => {
    for (const testCase of test.cases) {
      for (const sensory of testCase.sensory) {
        exam.right.lightTouch.S4_5 = sensory.w;
        exam.right.pinPrick.S4_5 = sensory.x;
        exam.left.lightTouch.S4_5 = sensory.y;
        exam.left.pinPrick.S4_5 = sensory.z;
        for (const anal of testCase.anal) {
          exam.deepAnalPressure = anal.dap;
          exam.voluntaryAnalContraction = anal.vac;
          expect(determineInjuryComplete(exam)).toBe(expected);
          allValues.push(`${exam.voluntaryAnalContraction}${exam.deepAnalPressure}${exam.right.pinPrick.S4_5}${exam.right.lightTouch.S4_5}${exam.left.pinPrick.S4_5}${exam.left.lightTouch.S4_5}`);
        }
      }
    }
  }

  for (const test of tests) {
    const numberOfTestCases = test.cases.reduce((sum,c) => sum + (c.sensory.length * c.anal.length),0);
    it(`expected: ${test.expected} - ${numberOfTestCases} tests`, () => {
      testInjuryComplete(test, test.expected);
    })
  }

  it('check all tests are unique', () => {
    const hashSet = new Set(allValues);
    expect(allValues.length).toBe(hashSet.size);
    expect(allValues.length).toBe(90000);
  })
})