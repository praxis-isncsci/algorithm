import { determineMotorZPP, checkLevelForMotorZPP, checkLevelForMotorZPPOnSensory } from "./motorZPP"
import { BinaryObservation, ExamSide, MotorMuscleValue, MotorLevels, SensoryPointValue } from "../../interfaces";
import { newNormalSide, newEmptySide } from "../commonSpec";

let side: ExamSide = newNormalSide();

// 439 tests + 4 verification tests
describe('motorZPP', () => {
  // 300 tests + 1 verification test
  describe('determineMotorZPP with variable VAC and PP/LT at S4_5', () => {
    const allValues: {voluntaryAnalContraction: BinaryObservation ; pinPrick: SensoryPointValue; lightTouch: SensoryPointValue}[] = [];

    beforeEach(() => {
      side = newNormalSide();
    })
    // 100 tests
    describe('VAC = NT', () => {
      const voluntaryAnalContraction = 'NT';
      afterEach(() => {
        allValues.push({voluntaryAnalContraction, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const values: SensoryPointValue[] = ['0', '0*', 'NT*', '1', '2', '1*', '0**', '1**', 'NT', 'NT**'];

      // 100 tests
      for (const x of values) {
        for (const y of values) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction);
            expect(result).toContain('NA');
          })
        }
      }
    })

    // 100 tests
    describe('VAC = No', () => {
      const voluntaryAnalContraction = 'No';
      afterEach(() => {
        allValues.push({voluntaryAnalContraction, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const notExpectNAValues: SensoryPointValue[] = ['0', '1', '0*', '1*', 'NT*'];
      const expectNAValues: SensoryPointValue[] = ['2', '0**', '1**', 'NT', 'NT**'];

      // 25 tests
      for (const x of notExpectNAValues) {
        for (const y of notExpectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction);
            expect(result).not.toContain('NA');
          })
        }
      }

      // 50 tests
      for (const x of expectNAValues) {
        for (const y of notExpectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction);
            expect(result).not.toContain('NA');
          })
          it(`pinPrick.S4_5 = ${y}; lightTouch.S4_5 = ${x};`, () => {
            side.pinPrick.S4_5 = y;
            side.lightTouch.S4_5 = x;
            const result = determineMotorZPP(side, voluntaryAnalContraction);
            expect(result).not.toContain('NA');
          })
        }
      }

      // 25 tests
      for (const x of expectNAValues) {
        for (const y of expectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction);
            expect(result).toContain('NA');
          })
        }
      }
    })

    // 100 tests
    describe('VAC = Yes', () => {
      const voluntaryAnalContraction = 'Yes';
      afterEach(() => {
        allValues.push({voluntaryAnalContraction, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const values: SensoryPointValue[] = ['0', '0*', 'NT*', '1', '2', '1*', '0**', '1**', 'NT', 'NT**'];

      for (const x of values) {
        for (const y of values) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction);
            expect(result).toContain('NA');
          })
        }
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues.map(v => v.voluntaryAnalContraction + v.pinPrick + v.lightTouch));
      expect(allValues.length).toBe(300);
      expect(hashSet.size).toBe(300);
    })
  })

  // 19 + 1 verification test
  describe(`checkLevelForMotorZPP: using currentLevel = L5`, () => {
    const allValues: MotorMuscleValue[] = [];
    const currentLevel = 'L5';

    afterEach(() => {
      allValues.push(side.motor[currentLevel]);
    })
    const continueValues: MotorMuscleValue[] = ['0'];
    const continueWithLevelValues: MotorMuscleValue[] = ['NT*', 'NT'];
    const breakWithLevelValues: MotorMuscleValue[] = [ '1', '2', '3', '4', '5', '1*', '2*', '3*', '4*', '1**', '2**', '3**', '4**', 'NT**'];

    const continueWithLevelValueStar: MotorMuscleValue[] = ['0*'];
    const breakWithLevelValuesStar: MotorMuscleValue[] = ['0**'];

    // 1 test
    for (const x of continueValues) {
      it(`motor.L5 = ${x};`, () => {
        side.motor.L5 = x;
        const result = checkLevelForMotorZPP(side, currentLevel, false);
        expect(result.continue).toBe(true);
        expect(result.level).toBeUndefined();
      })
    }

    // 2 test
    for (const x of continueWithLevelValues) {
      it(`motor.L5 = ${x};`, () => {
        side.motor.L5 = x;
        const result = checkLevelForMotorZPP(side, currentLevel, false);
        expect(result.continue).toBe(true);
        expect(result.level).toBe(currentLevel);
      })
    }

    // 14 test
    for (const x of breakWithLevelValues) {
      it(`motor.L5 = ${x};`, () => {
        side.motor.L5 = x;
        const result = checkLevelForMotorZPP(side, currentLevel, false);
        expect(result.continue).toBe(false);
        expect(result.level).toBe(currentLevel);
      })
    }

    // 1 test
    for (const x of continueWithLevelValueStar) {
      it(`motor.L5 = ${x};`, () => {
        side.motor.L5 = x;
        const result = checkLevelForMotorZPP(side, currentLevel, false);
        expect(result.continue).toBe(true);
        expect(result.level).toBe(currentLevel + '*');
      })
    }

    // 1 test
    for (const x of breakWithLevelValuesStar) {
      it(`motor.L5 = ${x};`, () => {
        side.motor.L5 = x;
        const result = checkLevelForMotorZPP(side, currentLevel, false);
        expect(result.continue).toBe(false);
        expect(result.level).toBe(currentLevel + '*');
      })
    }

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues);
      expect(allValues.length).toBe(19);
      expect(hashSet.size).toBe(19);
    })
  })

  // TODO: rewrite tests
  // 100 + 1 verification test
  describe(`checkLevelForMotorZPPOnSensory: using currentLevel = T12`, () => {
    const allValues: {x: SensoryPointValue; y: SensoryPointValue}[] = [];

    afterEach(() => {
      allValues.push({
        x: side.pinPrick.T12,
        y: side.lightTouch.T12,
      });
    })

    const breakWithLevelValues: SensoryPointValue[] = ['2', '0**', '1**', 'NT**'];
    const continueValues: SensoryPointValue[] = ['0', '1', '0*', '1*', 'NT*'];
    const continueWithLevelValues: SensoryPointValue[] = ['NT'];

    // 16 tests
    describe('continue = false; add level', () => {
      for (const x of breakWithLevelValues) {
        for (const y of breakWithLevelValues) {
          it(`pinPrick.T12 = ${x}; lightTouch.T12 = ${y};`, () => {
            side.pinPrick.T12 = x;
            side.lightTouch.T12 = y;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(false);
            expect(result.level).toBe('T12');
          })
        }
      }
    })

    // 75 tests
    describe('continue = true', () => {
      // 40 tests
      for (const x of breakWithLevelValues) {
        for (const y of continueValues) {
          it(`pinPrick.T12 = ${x}; lightTouch.T12 = ${y};`, () => {
            side.pinPrick.T12 = x;
            side.lightTouch.T12 = y;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
          it(`pinPrick.T12 = ${y}; lightTouch.T12 = ${x};`, () => {
            side.pinPrick.T12 = y;
            side.lightTouch.T12 = x;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
        }
      }

      // 16 tests
      for (const x of continueValues) {
        for (const y of continueValues) {
          it(`pinPrick.T12 = ${x}; lightTouch.T12 = ${y};`, () => {
            side.pinPrick.T12 = x;
            side.lightTouch.T12 = y;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
        }
      }

      // 8 tests
      for (const x of continueWithLevelValues) {
        for (const y of continueValues) {
          it(`pinPrick.T12 = ${x}; lightTouch.T12 = ${y};`, () => {
            side.pinPrick.T12 = x;
            side.lightTouch.T12 = y;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
          it(`pinPrick.T12 = ${y}; lightTouch.T12 = ${x};`, () => {
            side.pinPrick.T12 = y;
            side.lightTouch.T12 = x;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
        }
      }
    })

    // 9 tests
    describe('continue = true; add level', () => {
      // 8 tests
      for (const x of continueWithLevelValues) {
        for (const y of breakWithLevelValues) {
          it(`pinPrick.T12 = ${x}; lightTouch.T12 = ${y};`, () => {
            side.pinPrick.T12 = x;
            side.lightTouch.T12 = y;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('T12');
          })
          it(`pinPrick.T12 = ${y}; lightTouch.T12 = ${x};`, () => {
            side.pinPrick.T12 = y;
            side.lightTouch.T12 = x;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('T12');
          })
        }
      }

      // 1 tests
      for (const x of continueWithLevelValues) {
        for (const y of continueWithLevelValues) {
          it(`pinPrick.T12 = ${x}; lightTouch.T12 = ${y};`, () => {
            side.pinPrick.T12 = x;
            side.lightTouch.T12 = y;
            const result = checkLevelForMotorZPPOnSensory(side, 'T12', false, true, true, true);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('T12');
          })
        }
      }
    })

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues.map(v => v.x + v.y));
      expect(allValues.length).toBe(100);
      expect(hashSet.size).toBe(100);
    })
  })

  // TODO: get more specific requirement for when lowestNonKeyMuscleWithMotorFunction
  // should be used and not used
  xdescribe(`lowestNonKeyMuscleWithMotorFunction`, () => {
    // 20 + 1 verification test
    describe('with empty side', () => {
      beforeAll(() => {
        side = newEmptySide();
      })

      const allValues: string[] = [];
      let vac: BinaryObservation = 'No';
      afterEach(() => {
        allValues.push(vac + side.lowestNonKeyMuscleWithMotorFunction);
      })

      // 20 test
      for (const x of MotorLevels) {
        it(`lowestNonKeyMuscleWithMotorFunction = ${x};`, () => {
          vac = 'No'
          side.lowestNonKeyMuscleWithMotorFunction = x;
          const result = determineMotorZPP(side, vac);
          expect(result).toBe(x);
        })
        it(`lowestNonKeyMuscleWithMotorFunction = ${x};`, () => {
          vac = 'NT'
          side.lowestNonKeyMuscleWithMotorFunction = x;
          const result = determineMotorZPP(side, vac);
          expect(result).toBe(x);
        })
      }

      it('check all tests are unique', () => {
        const hashSet = new Set(allValues);
        expect(allValues.length).toBe(20);
        expect(hashSet.size).toBe(20);
      })
    })

    it('TODO incomplete tests', () => {
      expect(undefined).toBeDefined();
    })
    // 20 + 1 verification test
    describe('with normal side', () => {
      beforeAll(() => {
        side = newNormalSide();
      })

      const allValues: string[] = [];
      let vac: BinaryObservation = 'No';
      afterEach(() => {
        allValues.push(vac + side.lowestNonKeyMuscleWithMotorFunction);
      })

      // 20 test
      for (const x of MotorLevels) {
        it(`lowestNonKeyMuscleWithMotorFunction = ${x};`, () => {
          vac = 'No'
          side.lowestNonKeyMuscleWithMotorFunction = x;
          const result = determineMotorZPP(side, vac);
          expect(result).toBe('NA');
        })
        it(`lowestNonKeyMuscleWithMotorFunction = ${x};`, () => {
          vac = 'NT'
          side.lowestNonKeyMuscleWithMotorFunction = x;
          const result = determineMotorZPP(side, vac);
          expect(result).toBe('NA');
        })
      }

      it('check all tests are unique', () => {
        const hashSet = new Set(allValues);
        expect(allValues.length).toBe(20);
        expect(hashSet.size).toBe(20);
      })
    })
  })
})
