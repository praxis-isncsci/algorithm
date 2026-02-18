import {
  checkIfSensoryZPPIsApplicable,
  checkLevel,
  checkLevelForSensoryZPP,
  checkSacralLevel,
  determineSensoryZPP,
  getInitialState,
  getTopAndBottomLevelsForCheck,
  sensoryZPPSteps,
  sortSensoryZPP,
  SensoryZPPError,
} from './sensoryZPP';
import { BinaryObservation, ExamSide, SensoryPointValue } from '../../interfaces';
import { newNormalSide, propagateSensoryValueFrom } from '../commonSpec';

let side: ExamSide = newNormalSide();

describe('sensoryZPP', () => {
  describe('determineSensoryZPP with variable DAP and PP/LT at S4_5', () => {
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
    });

    it('produces correct level output when DAP=No and S4_5 absent', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      propagateSensoryValueFrom(side, 'S3', '0');

      const result = determineSensoryZPP(side, 'No');
      expect(result).not.toContain('NA');
      expect(result).toContain('S2');
    });

    it('does not propagate sacral variable to S3 and above (S4_5=0*/0*, S3=NT)', () => {
      // S4_5=0*/0* would set variable=true in checkLevelForSensoryZPP, but original
      // does NOT propagate that to the S3→C1 loop. S3 with NT should get S3 (no asterisk).
      propagateSensoryValueFrom(side, 'S2', '0');
      side.lightTouch.S4_5 = '0*';
      side.pinPrick.S4_5 = '0*';
      side.lightTouch.S3 = 'NT';
      side.pinPrick.S3 = '0';

      const result = determineSensoryZPP(side, 'No');
      expect(result).toContain('NA');
      expect(result).toContain('S3');
      expect(result).not.toContain('S3*');
    });
  });

  describe('checkLevelForSensoryZPP', () => {
    beforeEach(() => {
      side = newNormalSide();
    });
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
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(true);
            expect(result.level).toBeUndefined();
          })
        }
      }
    })

    // 12 tests
    describe('continue; add level', () => {
      const continueValues: SensoryPointValue[] = ['0', '0*'];
      const addLevelValues: SensoryPointValue[] = ['NT', 'NT*'];

      // 6 tests
      for (const x of continueValues) {
        for (const y of addLevelValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3');
          })
          it(`pinPrick.S3 = ${y}; lightTouch.S3 = ${x};`, () => {
            side.pinPrick.S3 = y;
            side.lightTouch.S3 = x;
            const result = checkLevelForSensoryZPP(side, 'S3', false);
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
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3');
          })
        }
      }
    })

    // 3 tests
    describe('continue; add level*', () => {
      const continueValues: SensoryPointValue[] = ['0'];
      const addLevelValues: SensoryPointValue[] = ['0*'];

      // 2 tests
      for (const x of continueValues) {
        for (const y of addLevelValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3*');
          })
          it(`pinPrick.S3 = ${y}; lightTouch.S3 = ${x};`, () => {
            side.pinPrick.S3 = y;
            side.lightTouch.S3 = x;
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3*');
          })
        }
      }

      // 1 test
      for (const x of addLevelValues) {
        for (const y of addLevelValues) {
          it(`pinPrick.S3 = ${x}; lightTouch.S3 = ${y};`, () => {
            side.pinPrick.S3 = x;
            side.lightTouch.S3 = y;
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(true);
            expect(result.level).toBe('S3*');
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
            const result = checkLevelForSensoryZPP(side, 'S3', false);
            expect(result.continue).toBe(false);
            expect(result.level).toBe('S3');
          })
          it(`pinPrick.S3 = ${y}; lightTouch.S3 = ${x};`, () => {
            side.pinPrick.S3 = y;
            side.lightTouch.S3 = x;
            const result = checkLevelForSensoryZPP(side, 'S3', false);
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
            const result = checkLevelForSensoryZPP(side, 'S3', false);
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
    });

    it('throws SensoryZPPError when level is C1', () => {
      expect(() => checkLevelForSensoryZPP(side, 'C1', false)).toThrow(SensoryZPPError);
      expect(() => checkLevelForSensoryZPP(side, 'C1', false)).toThrow(
        'checkLevelForSensoryZPP :: invalid argument level: C1',
      );
    });

    it('adds asterisk to level when variable is true and sensory boundary found', () => {
      side.pinPrick.S3 = '1';
      side.lightTouch.S3 = '0';
      const result = checkLevelForSensoryZPP(side, 'S3', true);
      expect(result.continue).toBe(false);
      expect(result.level).toBe('S3*');
    });
  });

  /* *************************************** */
  /*  checkIfSensoryZPPIsApplicable tests   */
  /* *************************************** */

  describe('checkIfSensoryZPPIsApplicable', () => {
    beforeEach(() => {
      side = newNormalSide();
    });

    describe('DAP = Yes', () => {
      it('adds NA to Sensory ZPP and stops', () => {
        const state = getInitialState(side, 'Yes');
        const step = checkIfSensoryZPPIsApplicable(state);

        expect(step.state.zpp).toEqual(['NA']);
        expect(step.next).toBeNull();
        expect(step.description.key).toBe('sensoryZPPCheckIfSensoryZPPIsApplicableDescription');
        expect(step.actions.length).toEqual(1);
        expect(step.actions[0].key).toEqual('sensoryZPPCheckIfSensoryZPPIsApplicableYesAction');
      });
    });

    describe('DAP = NT', () => {
      it('leaves zpp empty and continues to checkSacralLevel', () => {
        side.lightTouch.S4_5 = '0';
        side.pinPrick.S4_5 = '0';
        const state = getInitialState(side, 'NT');

        const step = checkIfSensoryZPPIsApplicable(state);

        expect(step.state.zpp).toEqual([]);
        expect(step.state.variable).toBe(false);
        expect(step.next).toBe(checkSacralLevel);
        expect(step.actions[0].key).toEqual('sensoryZPPCheckIfSensoryZPPIsApplicableProceedAction');
      });
    });

    describe('DAP = No', () => {
      it('leaves zpp empty and continues to checkSacralLevel when S4_5 absent', () => {
        side.lightTouch.S4_5 = '0';
        side.pinPrick.S4_5 = '0';
        const state = getInitialState(side, 'No');

        const step = checkIfSensoryZPPIsApplicable(state);

        expect(step.state.zpp).toEqual([]);
        expect(step.state.variable).toBe(false);
        expect(step.next).toBe(checkSacralLevel);
        expect(step.actions[0].key).toEqual('sensoryZPPCheckIfSensoryZPPIsApplicableProceedAction');
      });

      it('adds NA and stops when S4_5 has preserved sensation', () => {
        side.lightTouch.S4_5 = '2';
        side.pinPrick.S4_5 = '0';
        const state = getInitialState(side, 'No');

        const step = checkIfSensoryZPPIsApplicable(state);

        expect(step.state.zpp).toEqual(['NA']);
        expect(step.next).toBeNull();
        expect(step.actions[0].key).toEqual('sensoryZPPCheckIfSensoryZPPIsApplicableS4_5PreservedAction');
      });
    });
  });

  /* *************************************** */
  /*  checkSacralLevel tests                 */
  /* *************************************** */

  describe('checkSacralLevel', () => {
    beforeEach(() => {
      side = newNormalSide();
    });

    describe('DAP = NT', () => {
      it('adds NA to zpp and continues to getTopAndBottomLevelsForCheck', () => {
        side.lightTouch.S4_5 = '0';
        side.pinPrick.S4_5 = '0';
        const state = getInitialState(side, 'NT');
        state.zpp = [];
        state.variable = false;

        const step = checkSacralLevel(state);

        expect(step.state.zpp).toEqual(['NA']);
        expect(step.next).toBe(getTopAndBottomLevelsForCheck);
        expect(step.actions[0].key).toEqual('sensoryZPPCheckSacralLevelAddNAAction');
      });
    });

    describe('DAP = No with sacral absent', () => {
      it('adds NA to zpp when sacral result has level', () => {
        side.lightTouch.S4_5 = '0';
        side.pinPrick.S4_5 = 'NT';
        const state = getInitialState(side, 'No');
        state.zpp = [];
        state.variable = false;

        const step = checkSacralLevel(state);

        expect(step.state.zpp).toEqual(['NA']);
        expect(step.actions[0].key).toEqual('sensoryZPPCheckSacralLevelAddNAAction');
      });
    });

    describe('DAP = No with sacral fully absent', () => {
      it('does not add NA and continues to getTopAndBottomLevelsForCheck', () => {
        side.lightTouch.S4_5 = '0';
        side.pinPrick.S4_5 = '0';
        const state = getInitialState(side, 'No');
        state.zpp = [];
        state.variable = false;

        const step = checkSacralLevel(state);

        expect(step.state.zpp).toEqual([]);
        expect(step.next).toBe(getTopAndBottomLevelsForCheck);
        expect(step.actions[0].key).toEqual('sensoryZPPCheckSacralLevelNoNAAction');
      });
    });
  });

  /* *************************************** */
  /*  getTopAndBottomLevelsForCheck tests    */
  /* *************************************** */

  describe('getTopAndBottomLevelsForCheck', () => {
    beforeEach(() => {
      side = newNormalSide();
    });

    it('sets topLevel=S3, bottomLevel=C1, currentLevel=S3 and chains to checkLevel', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      const state = getInitialState(side, 'No');
      state.zpp = [];
      state.variable = false;

      const step = getTopAndBottomLevelsForCheck(state);

      expect(step.state.topLevel?.name).toBe('S3');
      expect(step.state.bottomLevel?.name).toBe('C1');
      expect(step.state.currentLevel?.name).toBe('S3');
      expect(step.next).toBe(checkLevel);
      expect(step.description.key).toBe('sensoryZPPGetTopAndBottomLevelsForCheckDescription');
      expect(step.actions[0]).toEqual({
        key: 'sensoryZPPGetTopAndBottomLevelsForCheckRangeAction',
        params: { top: 'S3', bottom: 'C1' },
      });
    });
  });

  /* *************************************** */
  /*  checkLevel tests                       */
  /* *************************************** */

  describe('checkLevel', () => {
    beforeEach(() => {
      side = newNormalSide();
    });

    it('throws SensoryZPPError when currentLevel is null', () => {
      const state = getInitialState(side, 'No');
      state.currentLevel = null;

      expect(() => checkLevel(state)).toThrow(SensoryZPPError);
      expect(() => checkLevel(state)).toThrow(
        'checkLevel :: state.currentLevel is required.',
      );
    });

    it('adds C1 and chains to sortSensoryZPP when currentLevel is C1', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      const state = getInitialState(side, 'No');
      const { topLevel, bottomLevel } = getTopAndBottomLevelsForCheck(state).state;
      state.topLevel = topLevel;
      state.bottomLevel = bottomLevel;
      state.currentLevel = bottomLevel;
      state.zpp = [];
      state.variable = false;

      const step = checkLevel(state);

      expect(step.state.zpp).toEqual(['C1']);
      expect(step.state.currentLevel).toBeNull();
      expect(step.next).toBe(sortSensoryZPP);
      expect(step.actions[0].key).toBe('sensoryZPPCheckLevelReachedC1Action');
    });

    it('adds level and continues when result.continue and result.level', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      side.lightTouch.S3 = 'NT';
      side.pinPrick.S3 = '0';
      const state = getInitialState(side, 'No');
      const stepResult = getTopAndBottomLevelsForCheck(state);
      state.topLevel = stepResult.state.topLevel;
      state.bottomLevel = stepResult.state.bottomLevel;
      state.currentLevel = stepResult.state.currentLevel;
      state.zpp = [];
      state.variable = false;

      const step = checkLevel(state);

      expect(step.state.zpp).toEqual(['S3']);
      expect(step.state.currentLevel?.name).toBe('S2');
      expect(step.next).toBe(checkLevel);
      expect(step.actions[0].key).toBe('sensoryZPPCheckLevelAddLevelAction');
      expect(step.actions[1].key).toBe('sensoryZPPCheckLevelContinueAction');
    });

    it('adds level and stops when !result.continue', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      side.lightTouch.S3 = '1';
      side.pinPrick.S3 = '0';
      const state = getInitialState(side, 'No');
      const stepResult = getTopAndBottomLevelsForCheck(state);
      state.topLevel = stepResult.state.topLevel;
      state.bottomLevel = stepResult.state.bottomLevel;
      state.currentLevel = stepResult.state.currentLevel;
      state.zpp = [];
      state.variable = false;

      const step = checkLevel(state);

      expect(step.state.zpp).toEqual(['S3']);
      expect(step.state.currentLevel).toBeNull();
      expect(step.next).toBe(sortSensoryZPP);
      expect(step.actions[0].key).toBe('sensoryZPPCheckLevelAddLevelAction');
      expect(step.actions[1].key).toBe('sensoryZPPCheckLevelStopAction');
    });

    it('continues without adding level when both LT and PP absent', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      side.lightTouch.S3 = '0';
      side.pinPrick.S3 = '0';
      const state = getInitialState(side, 'No');
      const stepResult = getTopAndBottomLevelsForCheck(state);
      state.topLevel = stepResult.state.topLevel;
      state.bottomLevel = stepResult.state.bottomLevel;
      state.currentLevel = stepResult.state.currentLevel;
      state.zpp = [];
      state.variable = false;

      const step = checkLevel(state);

      expect(step.state.zpp).toEqual([]);
      expect(step.state.currentLevel?.name).toBe('S2');
      expect(step.next).toBe(checkLevel);
      expect(step.actions).toHaveLength(1);
      expect(step.actions[0].key).toBe('sensoryZPPCheckLevelContinueAction');
    });
  });

  /* *************************************** */
  /*  sortSensoryZPP tests                   */
  /* *************************************** */

  describe('sortSensoryZPP', () => {
    it('sorts zpp with NA first and stops (next is null)', () => {
      const state = getInitialState(side, 'No');
      state.zpp = ['S3', 'NA', 'S2'];

      const step = sortSensoryZPP(state);

      expect(step.state.zpp).toEqual(['NA', 'S2', 'S3']);
      expect(step.next).toBeNull();
      expect(step.description.key).toBe('sensoryZPPSortSensoryZPPDescription');
      expect(step.actions[0].key).toBe('sensoryZPPSortSensoryZPPEnsureNAIsPlacedFirstAction');
    });

    it('sorts zpp by level index when no NA', () => {
      const state = getInitialState(side, 'No');
      state.zpp = ['S1', 'S3', 'S2'];

      const step = sortSensoryZPP(state);

      expect(step.state.zpp).toEqual(['S1', 'S2', 'S3']);
      expect(step.next).toBeNull();
    });
  });

  describe('sensoryZPPSteps', () => {
    beforeEach(() => {
      side = newNormalSide();
    });

    it('yields at least one step', () => {
      const steps = Array.from(sensoryZPPSteps(side, 'Yes'));
      expect(steps.length).toBeGreaterThanOrEqual(1);
    });

    it('final step result matches determineSensoryZPP for same inputs', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';

      const expected = determineSensoryZPP(side, 'No');
      const steps = Array.from(sensoryZPPSteps(side, 'No'));
      const lastStep = steps[steps.length - 1];
      const actual = lastStep.state.zpp.join(',');

      expect(actual).toBe(expected);
    });

    it('DAP = Yes yields 1 step and stops (next is null)', () => {
      const steps = Array.from(sensoryZPPSteps(side, 'Yes'));
      expect(steps).toHaveLength(1);
      expect(steps[0].next).toBeNull();
      expect(steps[0].state.zpp).toEqual(['NA']);
    });

    it('DAP = No yields multiple steps for full calculation', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';

      const steps = Array.from(sensoryZPPSteps(side, 'No'));
      expect(steps.length).toBeGreaterThan(1);
      expect(steps[steps.length - 1].next).toBeNull();
    });

    it('each step has description, actions, state, and next', () => {
      const steps = Array.from(sensoryZPPSteps(side, 'Yes'));
      for (const step of steps) {
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('actions');
        expect(step).toHaveProperty('state');
        expect(step).toHaveProperty('next');
        expect(step.description).toHaveProperty('key');
        expect(Array.isArray(step.actions)).toBe(true);
        expect(step.state).toHaveProperty('zpp');
      }
    });
  });
})