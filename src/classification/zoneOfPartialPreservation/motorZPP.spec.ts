import {
  State,
  checkIfMotorZPPIsApplicable,
  checkLevel,
  checkLowerNonKeyMuscle,
  determineMotorZPP,
  getInitialState,
  getTopAndBottomLevelsForCheck,
} from "./motorZPP"
import {BinaryObservation, Exam, ExamSide, Motor, MotorLevel, Sensory, SensoryLevel, SensoryPointValue} from "../../interfaces";
import {newNormalSide, propagateMotorValueFrom, propagateSensoryValueFrom} from "../commonSpec";
import { SideLevel } from "../common";

let side: ExamSide = newNormalSide();

describe('motorZPP', () => {
  // 300 tests + 1 verification test
  describe('determineMotorZPP with variable VAC and PP/LT at S4_5', () => {
    const allValues: {voluntaryAnalContraction: BinaryObservation; pinPrick: SensoryPointValue; lightTouch: SensoryPointValue;}[] = [];

    beforeEach(() => {
      side = newNormalSide();
    });

    // 100 tests
    describe('VAC = NT', () => {
      const voluntaryAnalContraction = 'NT';
      afterEach(() => {
        allValues.push({voluntaryAnalContraction, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      });
      const values: SensoryPointValue[] = ['0', '0*', 'NT*', '1', '2', '1*', '0**', '1**', 'NT', 'NT**'];

      // 100 tests
      for (const x of values) {
        for (const y of values) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction, 'E', 'S3');
            expect(result).toContain('NA');
          })
        }
      }
    });

    // 100 tests
    describe('VAC = No', () => {
      const voluntaryAnalContraction = 'No';
      afterEach(() => {
        allValues.push({voluntaryAnalContraction, pinPrick: side.pinPrick.S4_5, lightTouch: side.lightTouch.S4_5});
      })
      const expectNAValues: SensoryPointValue[] = ['0', '1', '0*', '1*', 'NT*', '2', '0**', '1**', 'NT', 'NT**'];

      // 100 tests
      for (const x of expectNAValues) {
        for (const y of expectNAValues) {
          it(`pinPrick.S4_5 = ${x}; lightTouch.S4_5 = ${y};`, () => {
            side.pinPrick.S4_5 = x;
            side.lightTouch.S4_5 = y;
            const result = determineMotorZPP(side, voluntaryAnalContraction, 'E', 'S3');
            expect(result).not.toContain('NA');
          })
        }
      }
    });

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
            const result = determineMotorZPP(side, voluntaryAnalContraction, 'E', 'S3');
            expect(result).toContain('NA');
          })
        }
      }
    });

    it('check all tests are unique', () => {
      const hashSet = new Set(allValues.map(v => v.voluntaryAnalContraction + v.pinPrick + v.lightTouch));
      expect(allValues.length).toBe(300);
      expect(hashSet.size).toBe(300);
    })
  })

  /* *************************************** */
  /*  checkIfMotorZPPIsApplicable tests      */
  /* *************************************** */

  describe('checkIfMotorZPPIsApplicable', () => {
    describe('Vac = Yes', () => {
      const state = getInitialState(side, 'Yes', 'E', 'INT');

      it('adds NA to Motor ZPP and stops', () => {
        const step = checkIfMotorZPPIsApplicable(state);

        expect(step.state.zpp).toEqual(['NA']);
        expect(step.next).toBeNull();
        expect(step.description.key).toBe('motorZPPCheckIfMotorZPPIsApplicableDescription');
        expect(step.actions.length).toEqual(1);
        expect(step.actions[0].key).toEqual('motorZPPCheckIfMotorZPPIsApplicableYesAction');
      });
    });

    describe('Vac = NT', () => {
      const state = getInitialState(side, 'NT', 'E', 'INT');

      it('adds NA to Motor ZPP and continues to checkLowerNonKeyMuscle', () => {
        const step = checkIfMotorZPPIsApplicable(state);

        expect(step.state.zpp).toEqual(['NA']);
        expect(step.next).toBe(checkLowerNonKeyMuscle);
        expect(step.description.key).toBe('motorZPPCheckIfMotorZPPIsApplicableDescription');
        expect(step.actions.length).toEqual(1);
        expect(step.actions[0].key).toEqual('motorZPPCheckIfMotorZPPIsApplicableNTAction');
      });
    });
    
    describe('Vac = No', () => {
      side.lightTouch.S4_5 = '0';
      side.pinPrick.S4_5 = '0';
      const state = getInitialState(side, 'No', 'E', 'S3');
  
      it('leaves Motor ZPP empty and continues to checkLowerNonKeyMuscle', () => {
        const step = checkIfMotorZPPIsApplicable(state);
  
        expect(step.state.zpp).toEqual([]);
        expect(step.next).toBe(checkLowerNonKeyMuscle);
        expect(step.description.key).toBe('motorZPPCheckIfMotorZPPIsApplicableDescription');
        expect(step.actions.length).toEqual(1);
        expect(step.actions[0].key).toEqual('motorZPPCheckIfMotorZPPIsApplicableNoAction');
      });
    });
  });

  /* *************************************** */
  /*  checkLowerNonKeyMuscle tests           */
  /* *************************************** */

  describe('checkLowerNonKeyMuscle', () => {
    describe('AIS is C and non-key muscle is set to L2', () => {
      side.lowestNonKeyMuscleWithMotorFunction = 'L2';
      propagateSensoryValueFrom(side, 'T5', '0');
      propagateMotorValueFrom(side, 'L2', '0');
      const state = getInitialState(side, 'No', 'C', 'T4');
      const expectedDescription = {key: 'motorZPPCheckLowerNonKeyMuscleDescription'};
      const expectedActions = [{key: 'motorZPPCheckLowerNonKeyMuscleConsiderAction'}];
      const expectedState = {
        ...state,
        zpp: [...state.zpp],
        testNonKeyMuscle: true,
      };

      it('sets state.testNonKeyMuscle to true and continues to getTopAndBottomLevelsForCheck', () => {
        const step = checkLowerNonKeyMuscle(state);

        expect(step.description).toEqual(expectedDescription);
        expect(step.actions).toEqual(expectedActions);
        expect(step.state.zpp).toEqual(expectedState.zpp);
        expect(step.state.testNonKeyMuscle).toBe(expectedState.testNonKeyMuscle);
      });
    });

    describe('AIS is C* and non-key muscle is set to L2', () => {
      side.lowestNonKeyMuscleWithMotorFunction = 'L2';
      propagateSensoryValueFrom(side, 'T5', '0');
      propagateMotorValueFrom(side, 'L2', '0');
      const state = getInitialState(side, 'No', 'C*', 'T4');
      const expectedDescription = {key: 'motorZPPCheckLowerNonKeyMuscleDescription'};
      const expectedActions = [{key: 'motorZPPCheckLowerNonKeyMuscleConsiderAction'}];
      const expectedState = {
        ...state,
        zpp: [...state.zpp],
        testNonKeyMuscle: true,
      };

      it('sets state.testNonKeyMuscle to true and continues to getTopAndBottomLevelsForCheck', () => {
        const step = checkLowerNonKeyMuscle(state);

        expect(step.description).toEqual(expectedDescription);
        expect(step.actions).toEqual(expectedActions);
        expect(step.state.zpp).toEqual(expectedState.zpp);
        expect(step.state.testNonKeyMuscle).toBe(expectedState.testNonKeyMuscle);
      });
    });

    describe('AIS is A and non-key muscle is set to L2', () => {
      side.lowestNonKeyMuscleWithMotorFunction = 'L2';
      propagateSensoryValueFrom(side, 'C2', '0');
      propagateMotorValueFrom(side, 'C5', '0');
      const state = getInitialState(side, 'No', 'A', 'C2');
      const expectedDescription = {key: 'motorZPPCheckLowerNonKeyMuscleDescription'};
      const expectedActions = [{key: 'motorZPPCheckLowerNonKeyMuscleDoNotConsiderAction'}];
      const expectedState = {
        ...state,
        zpp: [...state.zpp],
        testNonKeyMuscle: false,
      };

      it('sets state.testNonKeyMuscle to true and continues to getTopAndBottomLevelsForCheck', () => {
        const step = checkLowerNonKeyMuscle(state);

        expect(step.description).toEqual(expectedDescription);
        expect(step.actions).toEqual(expectedActions);
        expect(step.state.zpp).toEqual(expectedState.zpp);
        expect(step.state.testNonKeyMuscle).toBe(expectedState.testNonKeyMuscle);
      });
    });

    describe('AIS is C but there is no non-key muscle', () => {
      side.lowestNonKeyMuscleWithMotorFunction = undefined;
      propagateSensoryValueFrom(side, 'T5', '0');
      propagateMotorValueFrom(side, 'L2', '0');
      const state = getInitialState(side, 'No', 'B', 'T4');
      const expectedDescription = {key: 'motorZPPCheckLowerNonKeyMuscleDescription'};
      const expectedActions = [{key: 'motorZPPCheckLowerNonKeyMuscleDoNotConsiderAction'}];
      const expectedState = {
        ...state,
        zpp: [...state.zpp],
        testNonKeyMuscle: false,
      };

      it('sets state.testNonKeyMuscle to true and continues to getTopAndBottomLevelsForCheck', () => {
        const step = checkLowerNonKeyMuscle(state);

        expect(step.description).toEqual(expectedDescription);
        expect(step.actions).toEqual(expectedActions);
        expect(step.state.zpp).toEqual(expectedState.zpp);
        expect(step.state.testNonKeyMuscle).toBe(expectedState.testNonKeyMuscle);
      });
    });
  });

  /* *************************************** */
  /*  getTopAndBottomLevelsForCheck tests    */
  /* *************************************** */

  describe('getTopAndBottomLevelsForCheck', () => {
    side.lowestNonKeyMuscleWithMotorFunction = 'L2';
    propagateSensoryValueFrom(side, 'T5', '0');
    propagateMotorValueFrom(side, 'L2', '0');

    describe('side with normal upper motor values and normal sensory values until T4', () => {
      const testInput: {levelName: MotorLevel, valueType: 'motor' | 'pinPrick' | 'lightTouch', value: '1*' | '1**'}[] = [
        {levelName: 'C8', valueType: 'motor', value: '1*'},
        {levelName: 'C8', valueType: 'motor', value: '1**'},
        {levelName: 'C8', valueType: 'pinPrick', value: '1*'},
        {levelName: 'C8', valueType: 'pinPrick', value: '1**'},
        {levelName: 'C8', valueType: 'lightTouch', value: '1*'},
        {levelName: 'C8', valueType: 'lightTouch', value: '1**'},
      ];

      const lastLevelWithConsecutiveNormalValues = 'T4';

      beforeEach(() => {
        propagateSensoryValueFrom(side, 'T5', '0');
        propagateMotorValueFrom(side, 'L2', '0');
      });

      testInput.forEach((input) => {
        it(`sets ${input.levelName} as \`firstLevelWithStar\` and ${lastLevelWithConsecutiveNormalValues} as \`lastLevelWithConsecutiveNormalValues\` when ${input.levelName} has value of ${input.value} on ${input.valueType}`, () => {
          side[input.valueType][input.levelName] = input.value;
          
          const state = getInitialState(side, 'No', 'C*', 'T4');
          const step = getTopAndBottomLevelsForCheck(state);

          expect(step.state.firstLevelWithStar?.name).toBe(input.levelName);
          expect(step.state.lastLevelWithConsecutiveNormalValues.name).toBe(lastLevelWithConsecutiveNormalValues);
          expect(step.description).toEqual({key: 'motorZPPGetTopAndBottomLevelsForCheckDescription'});
          expect(step.actions).toEqual([
            {key: 'motorZPPGetTopAndBottomLevelsForCheckRangeAction', params: {bottom: 'S1', top: 'T4'}},
            {key: 'motorZPPGetTopAndBottomLevelsForCheckDoNotIncludeTLAction'},
            {key: 'motorZPPGetTopAndBottomLevelsForCheckDoNotIncludeS10OrLowerAction'},
          ]);
        });
      });
    });
  });

  /* *************************************** */
  /*  checkLevel tests                       */
  /* *************************************** */

  describe('checkLevel', () => {
    describe('when a motor level is passed', () => {
      let state: State;
      let currentLevel: SideLevel;

      beforeEach(() => {
        const top: SideLevel = {
          name: 'C5',
          lightTouch: '2',
          pinPrick: '2',
          motor: '5',
          index: 4,
          previous: null,
          next: null,
        };

        currentLevel = {
          name: 'C6',
          lightTouch: '2',
          pinPrick: '2',
          motor: '5',
          index: 5,
          previous: top,
          next: null,
        };

        const bottom: SideLevel = {
          name: 'C7',
          lightTouch: '2',
          pinPrick: '2',
          motor: '5',
          index: 6,
          previous: currentLevel,
          next: null,
        };

        top.next = currentLevel;
        currentLevel.next = bottom;

        state = getInitialState(side, 'No', 'C*', 'T4');
        state.topLevel = top;
        state.bottomLevel = bottom;
        state.currentLevel = currentLevel;
      });

      it('`checkForMotorFunction` throws an exception when the `currentLevel` in the state object is null', () => {
        state.currentLevel = null;
        expect(() => checkLevel(state)).toThrowError('checkForSensoryFunction :: state.currentLevel is null. A SideLevel value is required.');
      });

      it('calls `checkForMotorFunction`', () => {
        const step = checkLevel(state);
        
        expect(step.description)
        .toEqual(
          {
            key: 'motorZPPCheckForMotorFunctionDescription',
            params: {levelName: currentLevel.name, motor: currentLevel.motor},
          },
        );
      });
    });
    
    describe('when a sensory level is passed', () => {
      let state: State;
      let currentLevel: SideLevel;

      beforeEach(() => {
        const top: SideLevel = {
          name: 'T8',
          lightTouch: '2',
          pinPrick: '2',
          motor: null,
          index: 14,
          previous: null,
          next: null,
        };

        currentLevel = {
          name: 'T9',
          lightTouch: '2',
          pinPrick: '2',
          motor: null,
          index: 15,
          previous: top,
          next: null,
        };

        const bottom: SideLevel = {
          name: 'T10',
          lightTouch: '2',
          pinPrick: '2',
          motor: null,
          index: 16,
          previous: currentLevel,
          next: null,
        };

        top.next = currentLevel;
        currentLevel.next = bottom;

        state = getInitialState(side, 'No', 'C*', 'T4');
        state.topLevel = top;
        state.bottomLevel = bottom;
        state.currentLevel = currentLevel;
      });

      it('`checkForMotorFunction` throws an exception when the `currentLevel` in the state object is null', () => {
        state.currentLevel = null;
        expect(() => checkLevel(state)).toThrowError('checkForSensoryFunction :: state.currentLevel is null. A SideLevel value is required.');
      });

      it('calls `checkForMotorFunction`', () => {
        const step = checkLevel(state);
        
        expect(step.description)
        .toEqual(
          {
            key: 'motorZPPCheckForSensoryFunctionDescription',
            params: {levelName: currentLevel.name, lightTouch: currentLevel.lightTouch, pinPrick: currentLevel.pinPrick},
          },
        );
      });
    });
  });
});
