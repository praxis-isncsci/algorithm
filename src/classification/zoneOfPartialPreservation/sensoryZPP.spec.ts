import { checkLevelForSensoryZPP, determineSensoryZPP } from "./sensoryZPP"
import { BinaryObservation, ExamSide, SensoryPointValue } from "../../interfaces";
import { newNormalSide } from "../commonSpec";

let side: ExamSide = newNormalSide();

// 400 tests + 2 verification tests
describe('sensoryZPP', () => {
  // 300 tests + 1 verification test
  describe('zpp with', () => {
    const allValues: {deepAnalPressure: BinaryObservation ; pinPrick: SensoryPointValue; lightTouch: SensoryPointValue}[] = [];

    beforeEach(() => {
      side = newNormalSide();
    })
    // 100 tests
    describe('DAP = NT', () => {
      const deepAnalPressure = 'NT';
      afterEach(() => {
        allValues.push({deepAnalPressure, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const values: SensoryPointValue[] = ['0', '0*', 'NT*', '1', '2', '1*', '0**', '1**', 'NT', 'NT**'];

      // 100 tests
      for (const x of values) {
        for (const y of values) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineSensoryZPP(side, deepAnalPressure);
            expect(result).toContain('NA');
          })
        }
      }
    })

    // 100 tests
    describe('DAP = No', () => {
      const deepAnalPressure = 'No';
      afterEach(() => {
        allValues.push({deepAnalPressure, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const notExpectNAValues: SensoryPointValue[] = ['0'];
      const expectNAValues: SensoryPointValue[] = ['1', '2', '0*', '1*', '0**', '1**', 'NT', 'NT*', 'NT**'];

      // 1 tests
      for (const x of notExpectNAValues) {
        for (const y of notExpectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineSensoryZPP(side, deepAnalPressure);
            expect(result).not.toContain('NA');
          })
        }
      }

      // 18 tests
      for (const x of expectNAValues) {
        for (const y of notExpectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineSensoryZPP(side, deepAnalPressure);
            expect(result).toContain('NA');
          })
          it(`pinPrick.S4_5 = ${y}; lightTouch.S4_5 = ${x};`, () => {
            side.pinPrick.S4_5 = y;
            side.lightTouch.S4_5 = x;
            const result = determineSensoryZPP(side, deepAnalPressure);
            expect(result).toContain('NA');
          })
        }
      }

      // 81 tests
      for (const x of expectNAValues) {
        for (const y of expectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineSensoryZPP(side, deepAnalPressure);
            expect(result).toContain('NA');
          })
        }
      }
    })

    // 100 tests
    describe('DAP = Yes', () => {
      const deepAnalPressure = 'Yes';
      afterEach(() => {
        allValues.push({deepAnalPressure, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const values: SensoryPointValue[] = ['0', '0*', 'NT*', '1', '2', '1*', '0**', '1**', 'NT', 'NT**'];

      for (const x of values) {
        for (const y of values) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineSensoryZPP(side, deepAnalPressure);
            expect(result).toContain('NA');
          })
        }
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues.map(v => v.deepAnalPressure + v.pinPrick + v.lightTouch));
      expect(allValues.length).toBe(300);
      expect(hashSet.size).toBe(300);
    })
  })

  // 100 tests + 1 verification test
  describe('checkLevelForSensoryZPP', () => {
    const allValues: {pinPrick: SensoryPointValue; lightTouch: SensoryPointValue}[] = [];
    afterEach(() => {
      allValues.push({pinPrick: side.pinPrick.S3, lightTouch: side.lightTouch.S3});
    })
    // 1 tests
    describe('continue', () => {
      const values: SensoryPointValue[] = ['0'];
      for (const x of values) {
        for (const y of values) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
        }
      }
    })

    // 15 tests
    describe('continue; add level', () => {
      const continueValues: SensoryPointValue[] = ['0'];
      const addLevelValues: SensoryPointValue[] = ['NT', '0*', 'NT*'];

      // 6 tests
      for (const x of continueValues) {
        for (const y of addLevelValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3');
          })
          it(`pinPrick.S3 = ${y}; lightTouch.S3 = ${x};`, () => {
            side.pinPrick.S3 = y;
            side.lightTouch.S3 = x;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3');
          })
        }
      }

      // 9 tests
      for (const x of addLevelValues) {
        for (const y of addLevelValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3');
          })
        }
      }
    })

    // 84 tests
    describe(`don't continue; add level`, () => {
      const breakValues: SensoryPointValue[] = ['1', '2', '1*', '0**', '1**', 'NT**'];
      const continueValues: SensoryPointValue[] = ['0', '0*', 'NT*', 'NT'];

      // 48 tests
      for (const x of breakValues) {
        for (const y of continueValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(false);
            expect(result.level).toBe('S3');
          })
          it(`pinPrick.S3 = ${y}; lightTouch.S3 = ${x};`, () => {
            side.pinPrick.S3 = y;
            side.lightTouch.S3 = x;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(false);
            expect(result.level).toBe('S3');
          })
        }
      }

      // 36 tests
      for (const x of breakValues) {
        for (const y of breakValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3');
            expect(result.continue).toBe(false);
            expect(result.level).toBe('S3');
          })
        }
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues.map(v => v.pinPrick + v.lightTouch));
      expect(allValues.length).toBe(100);
      expect(hashSet.size).toBe(100);
    })
  })
})