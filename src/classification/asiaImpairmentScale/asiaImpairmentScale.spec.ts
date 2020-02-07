import { canBeInjuryComplete, canBeNormal } from "./asiaImpairmentScale"
import { Exam, NeurologicalLevels } from "../../interfaces";
import { newEmptyExam } from "../commonSpec";

describe('asiaImpairmentScale', () => {
  const exam: Exam = newEmptyExam();

  // 3 tests
  describe('AIS A', () => {
    it('injuryComplete = C', () => {
      expect(canBeInjuryComplete('C')).toBe(true);
    })
    it('injuryComplete = C,I', () => {
      expect(canBeInjuryComplete('C,I')).toBe(true);
    })
    it('injuryComplete = I', () => {
      expect(canBeInjuryComplete('I')).toBe(false);
    })
  })

  describe('AIS B', () => {
    it('TODO incomplete tests', () => {
      expect(undefined).toBeDefined();
    })
  })

  describe('AIS C', () => {
    it('TODO incomplete tests', () => {
      expect(undefined).toBeDefined();
    })
  })

  describe('AIS D', () => {
    it('TODO incomplete tests', () => {
      expect(undefined).toBeDefined();
    })
  })
  // 81 tests + 1 verification test
  describe('AIS E', () => {
    const allValues: string[] = [];

    // 16 tests
    describe('neurologicalLevels all can be normal', () => {
      const canBeNormalSensory = 'S3,INT';
      const isNormalSensory = 'INT';

      const permutations = Array(2 ** 4).fill(0).map((v,i) => {
        const values = i.toString(2).padStart(4,'0').split('');
        return {
          sensoryLeft: values[0] === '1' ? isNormalSensory : canBeNormalSensory,
          sensoryRight: values[1] === '1' ? isNormalSensory : canBeNormalSensory,
          motorRight: values[2] === '1' ? isNormalSensory : canBeNormalSensory,
          motorLeft: values[3] === '1' ? isNormalSensory : canBeNormalSensory,
        };
      })

      for (const neurologicalLevels of permutations) {
        it(`NL sensoryLeft: ${neurologicalLevels.sensoryLeft}; sensoryRight: ${neurologicalLevels.sensoryRight}; motorRight: ${neurologicalLevels.motorRight}; motorLeft: ${neurologicalLevels.motorLeft}; `, () => {
          expect(canBeNormal(neurologicalLevels)).toBe(true);
          allValues.push(
            `${neurologicalLevels.sensoryLeft}${neurologicalLevels.sensoryRight}${neurologicalLevels.motorRight}${neurologicalLevels.motorLeft}`
          );
        })
      }
    })

    // 65 tests (3^4 - 2^4)
    describe('neurologicalLevels can not be all normal', () => {
      const canBeNormalSensory = 'S3,S4_5';
      const isNormalSensory = 'S4_5';
      const isNotNormalSensory = 'S3';

      const permutations = Array(3 ** 4).fill(0)
        .map((v, i) => i.toString(3).padStart(4,'0'))
        .filter(v => v.includes('2'))
        .map((values) => {
          return {
            sensoryLeft: values[0] === '1' ? isNormalSensory : values[0] === '2' ? isNotNormalSensory : canBeNormalSensory,
            sensoryRight: values[1] === '1' ? isNormalSensory : values[1] === '2' ? isNotNormalSensory : canBeNormalSensory,
            motorRight: values[2] === '1' ? isNormalSensory : values[2] === '2' ? isNotNormalSensory : canBeNormalSensory,
            motorLeft: values[3] === '1' ? isNormalSensory : values[3] === '2' ? isNotNormalSensory : canBeNormalSensory,
          }
        })

      for (const neurologicalLevels of permutations) {
        it(`NL sensoryLeft: ${neurologicalLevels.sensoryLeft}; sensoryRight: ${neurologicalLevels.sensoryRight}; motorRight: ${neurologicalLevels.motorRight}; motorLeft: ${neurologicalLevels.motorLeft}; `, () => {
          expect(canBeNormal(neurologicalLevels)).toBe(false);
          allValues.push(
            `${neurologicalLevels.sensoryLeft}${neurologicalLevels.sensoryRight}${neurologicalLevels.motorRight}${neurologicalLevels.motorLeft}`
          );
        })
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues);
      expect(allValues.length).toBe(81);
      expect(hashSet.size).toBe(81);
    })
  })
})
