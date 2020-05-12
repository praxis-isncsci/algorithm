import { addValues, calculateMotorTotal, calculateSensoryTotal } from "./totals";
import { Motor, Sensory, SensoryPointValue, MotorMuscleValue } from "../interfaces";
import { newEmptySensory, newEmptyMotor } from "../classification/commonSpec";

type Test = { substitute: SensoryPointValue | MotorMuscleValue; expected: string };
type TestSet = { description: string; tests: Test[] };
describe('totals', () => {
  describe('calculateSensoryTotal', () => {
    const testSets: TestSet[] = [
      {
        description: 'values without *',
        tests: [
          {substitute: '0', expected: '0'},
          {substitute: '1', expected: '1'},
          {substitute: '2', expected: '2'},
        ],
      }, {
        description: 'values with *',
        tests: [
          {substitute: '0*', expected: '0'},
          {substitute: '1*', expected: '1'},
          {substitute: '0**', expected: '0'},
          {substitute: '1**', expected: '1'},
        ],
      }, {
        description: 'values with ND',
        tests: [
          {substitute: 'NT', expected: 'ND'},
          {substitute: 'NT*', expected: 'ND'},
          {substitute: 'NT**', expected: 'ND'},
        ],
      }
    ]

    for (const testSet of testSets) {
      describe(testSet.description, () => {
        for (const test of testSet.tests) {
          const sensory: Sensory = newEmptySensory();
          sensory.C2 = test.substitute as SensoryPointValue ;
          it(`${test.substitute} => ${test.expected}`, () => {
            expect(calculateSensoryTotal(sensory)).toBe(test.expected);
          })
        }
      })
    }
  })

  describe('calculateMotorTotal', () => {
    const testSets: TestSet[] = [
      {
        description: 'values without *',
        tests: [
          {substitute: '0', expected: '0'},
          {substitute: '1', expected: '1'},
          {substitute: '2', expected: '2'},
          {substitute: '3', expected: '3'},
          {substitute: '4', expected: '4'},
          {substitute: '5', expected: '5'},
        ],
      }, {
        description: 'values with *',
        tests: [
          {substitute: '0*', expected: '0'},
          {substitute: '1*', expected: '1'},
          {substitute: '2*', expected: '2'},
          {substitute: '3*', expected: '3'},
          {substitute: '4*', expected: '4'},
          {substitute: '0**', expected: '0'},
          {substitute: '1**', expected: '1'},
          {substitute: '2**', expected: '2'},
          {substitute: '3**', expected: '3'},
          {substitute: '4**', expected: '4'},
        ],
      }, {
        description: 'values with NT',
        tests: [
          {substitute: 'NT', expected: 'ND'},
          {substitute: 'NT*', expected: 'ND'},
          {substitute: 'NT**', expected: 'ND'},
        ],
      }
    ]

    for (const testSet of testSets) {
      describe(testSet.description, () => {
        for (const test of testSet.tests) {
          const motor: Motor = newEmptyMotor();
          motor.C5 = test.substitute;
          it(Object.values(motor).join(','), () => {
            expect(calculateMotorTotal(motor, 'all')).toBe(test.expected);
          })
        }
      })
    }

    describe('option', () => {
      const motor: Motor = {
        C5: '1', C6: '1', C7: '1', C8: '1', T1: '1',
        L2: '2', L3: '2', L4: '2', L5: '2', S1: '2',
      }
      it('all', () => expect(calculateMotorTotal(motor, 'all')).toBe('15'))
      it('upper', () => expect(calculateMotorTotal(motor, 'upper')).toBe('5'))
      it('lower', () => expect(calculateMotorTotal(motor, 'lower')).toBe('10'))
    })
  })

  describe('addValues', () => {
    it('basic', () => {
      expect(addValues(1, 1)).toBe('2');
      expect(addValues(1, 2)).toBe('3');
      expect(addValues(1, 2, 3)).toBe('6');
    })

    it('throw', () => {
      const testNaN = (): string => addValues(NaN, 1);
      expect(testNaN).toThrow();
    })
  })

})