import {
  BinaryObservation,
  ExamSide,
  MotorLevel,
  MotorLevels,
  SensoryLevel,
  SensoryLevels,
} from '../../interfaces';
import { SideLevel, Translation } from '../common';

/* *************************************** */
/*  Types                                  */
/* *************************************** */

export type State = {
  ais: string;
  motorLevel: string;
  voluntaryAnalContraction: BinaryObservation;
  zpp: string[];
  topLevel: SideLevel;
  bottomLevel: SideLevel;
  currentLevel: SideLevel | null;
  side: ExamSide;
  nonKeyMuscle: SideLevel | null;
  nonKeyMuscleHasBeenAdded: boolean;
  testNonKeyMuscle: boolean;
  addNonKeyMuscle: boolean;
  firstLevelWithStar: SideLevel | null;
  lastLevelWithConsecutiveNormalValues: SideLevel;
};

export type Step = {
  description: { key: Translation; params?: { [key: string]: string } };
  actions: { key: Translation; params?: { [key: string]: string } }[];
  next: ((state: State) => Step) | null;
  state: State;
};

/* *************************************** */
/*  Support methods                        */
/* *************************************** */

/*
 * Iterates down the side and builds a chain of `SideLevel` objects with only the levels that need to be checked.
 * It also maps the top, bottom, nonKeyMuscle, firstLevelWithStar, and lastLevelWithConsecutiveNormalValues.
 * Can throw the following exception:
 *   'Unable to determine the topLevel, bottomLevel, or lastLevelWithConsecutiveNormalValues'
 *   This happens when the side has invalid or missing values or the provided top or bottom level are calculated incorrectly.
 */
function getLevelsRange(
  side: ExamSide,
  top: SensoryLevel,
  bottom: SensoryLevel,
  nonKeyMuscleName: MotorLevel | null,
): {
  topLevel: SideLevel;
  bottomLevel: SideLevel;
  nonKeyMuscle: SideLevel | null;
  firstLevelWithStar: SideLevel | null;
  lastLevelWithConsecutiveNormalValues: SideLevel;
} {
  let currentLevel: SideLevel | null = null;
  let topLevel: SideLevel | null = null;
  let bottomLevel: SideLevel | null = null;
  let nonKeyMuscle: SideLevel | null = null;
  let firstLevelWithStar: SideLevel | null = null;
  let lastLevelWithConsecutiveNormalValues: SideLevel | null = null;

  for (let i = 0; i < SensoryLevels.length && !bottomLevel; i++) {
    const sensoryLevelName = SensoryLevels[i];
    const motorLevelName: MotorLevel | null = MotorLevels.includes(
      sensoryLevelName as MotorLevel,
    )
      ? (sensoryLevelName as MotorLevel)
      : null;

    const level: SideLevel = {
      name: sensoryLevelName,
      lightTouch:
        sensoryLevelName === 'C1' ? '2' : side.lightTouch[sensoryLevelName],
      pinPrick:
        sensoryLevelName === 'C1' ? '2' : side.pinPrick[sensoryLevelName],
      motor: motorLevelName ? side.motor[motorLevelName] : null,
      index: i,
      next: null,
      previous: null,
    };

    if (
      !firstLevelWithStar &&
      (/\*/.test(level.lightTouch) ||
        /\*/.test(level.pinPrick) ||
        /\*/.test(level.motor ?? ''))
    ) {
      firstLevelWithStar = level;
    }

    if (
      !lastLevelWithConsecutiveNormalValues &&
      (!/(^2$)|(\*\*$)/.test(level.lightTouch) ||
        !/(^2$)|(\*\*$)/.test(level.pinPrick) ||
        !/(^5$)|(\*\*$)/.test(level.motor ?? ''))
    ) {
      lastLevelWithConsecutiveNormalValues = currentLevel;
    }

    if (motorLevelName && motorLevelName === nonKeyMuscleName) {
      nonKeyMuscle = level;
    }

    if (top === sensoryLevelName) {
      currentLevel = level;
      topLevel = level;
    } else if (currentLevel) {
      currentLevel.next = level;
      level.previous = currentLevel;
      currentLevel = level;
    }

    if (bottom === sensoryLevelName) {
      bottomLevel = currentLevel;

      if (!lastLevelWithConsecutiveNormalValues) {
        lastLevelWithConsecutiveNormalValues = currentLevel;
      }
    }
  }

  if (!topLevel || !bottomLevel || !lastLevelWithConsecutiveNormalValues) {
    throw new Error(
      'getLevelsRange :: Unable to determine the topLevel, bottomLevel, or lastLevelWithConsecutiveNormalValues',
    );
  }

  return {
    topLevel,
    bottomLevel,
    nonKeyMuscle,
    firstLevelWithStar,
    lastLevelWithConsecutiveNormalValues,
  };
}

/*
 * Returns `true` if there is a level flagged with `*` above the `currentLevel` or if `currentLevel` has it.
 */
function hasStarOnCurrentOrAboveLevel(
  currentLevel: SideLevel,
  lastLevelWithConsecutiveNormalValues: SideLevel,
  firstLevelWithStar: SideLevel | null,
): boolean {
  // An example of a case where firstLevelWithStar is null is case #93 in `specs/2019.json`.
  if (!firstLevelWithStar) {
    return false;
  }

  if (currentLevel.motor !== null) {
    return /0\*/.test(currentLevel.motor);
  }

  const hasStarOnCurrentLevel =
    /\d\*/.test(currentLevel.lightTouch) || /\d\*/.test(currentLevel.pinPrick);
  if (hasStarOnCurrentLevel) {
    return true;
  }

  const isInStarRange =
    currentLevel.index >= firstLevelWithStar.index &&
    currentLevel.index <= lastLevelWithConsecutiveNormalValues.index;
  return isInStarRange;
}

/* *************************************** */
/*  Motor ZPP calculation command methods  */
/* *************************************** */

/*
 * This is the sixth and final step when calculating the motor ZPP.
 * Sorts the ZPP results ensuring the `NA` value, if available, is at the beginning of the list.
 */
export function sortMotorZPP(state: State): Step {
  const zpp = [...state.zpp].sort((a, b) => {
    const aIndex =
      a === 'NA'
        ? -1
        : SensoryLevels.indexOf(a.replace(/\*/, '') as SensoryLevel);
    const bIndex =
      b === 'NA'
        ? -1
        : SensoryLevels.indexOf(b.replace(/\*/, '') as SensoryLevel);
    return aIndex - bIndex;
  });

  return {
    description: { key: 'motorZPPSortMotorZPPDescription' },
    actions: [{ key: 'motorZPPSortMotorZPPEnsureNAIsPlacedFirstAction' }],
    state: {
      ...state,
      zpp,
    },
    next: null,
  };
}

/*
 * This is the fifth step when calculating the Motor ZPP.
 * It adds the non-key muscle to ZPP, it has not been added already and if one is available.
 * It sets `sortMotorZPP` as the next and final step.
 */
export function addLowerNonKeyMuscleToMotorZPPIfNeeded(state: State): Step {
  const description: { key: Translation } = {
    key: 'motorZPPAddLowerNonKeyMuscleToMotorZPPIfNeededDescription',
  };

  return state.addNonKeyMuscle &&
    !state.nonKeyMuscleHasBeenAdded &&
    state.nonKeyMuscle
    ? {
        description,
        actions: [
          {
            key: 'motorZPPAddLowerNonKeyMuscleToMotorZPPIfNeededAddNonKeyMuscleAction',
          },
        ],
        state: {
          ...state,
          zpp: [...state.zpp, state.nonKeyMuscle.name],
        },
        next: sortMotorZPP,
      }
    : {
        description,
        actions: [
          {
            key: 'motorZPPAddLowerNonKeyMuscleToMotorZPPIfNeededIgnoreNonKeyMuscleAction',
          },
        ],
        state: {
          ...state,
          zpp: [...state.zpp],
        },
        next: sortMotorZPP,
      };
}

/*
 * Branch in the fourth step of the calculation.
 * It produces iteration, by calling `checkLevel`, as with `checkForMotorFunction` and `checkForSensoryFunction` it looks for normal motor function.
 * Looks for normal sensory function in the current level.
 *   - If the level is included in the Motor levels,
 *     It checks if the non-key muscle overrides it or adds it to the zpp values if not overridden
 *     It checks if `*` needs to be added to ZPP value
 *   - If we have reached the top level in the range, it sets `addLowerNonKeyMuscleToMotorZPPIfNeeded` as next step, `checkLevel` to continue iterating otherwise.
 * Could throw the following error:
 *   - state.currentLevel is null. A SideLevel value is required.
 */
export function checkForSensoryFunction(state: State): Step {
  if (!state.currentLevel) {
    throw new Error(
      'checkForSensoryFunction :: state.currentLevel is null. A SideLevel value is required.',
    );
  }

  const currentLevel = state.currentLevel;
  const description: { key: Translation; params: { [key: string]: string } } = {
    key: 'motorZPPCheckForSensoryFunctionDescription',
    params: {
      levelName: currentLevel.name,
      lightTouch: currentLevel.lightTouch,
      pinPrick: currentLevel.pinPrick,
    },
  };
  const isTopRange = currentLevel.name === state.topLevel.name;

  if (state.motorLevel.includes(currentLevel.name)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(
      currentLevel,
      state.lastLevelWithConsecutiveNormalValues,
      state.firstLevelWithStar,
    );
    const motorZPPName = `${currentLevel.name}${hasStar ? '*' : ''}`;
    const overrideWithNonKeyMuscle =
      state.testNonKeyMuscle &&
      state.nonKeyMuscle !== null &&
      state.nonKeyMuscle.index - currentLevel.index > 3;
    const actions: {
      key: Translation;
      params?: { [index: string]: string };
    }[] = [
      {
        key: 'motorZPPCheckForSensoryFunctionLevelIncludedInMotorValuesAction',
        params: { levelName: currentLevel.name },
      },
      {
        key: overrideWithNonKeyMuscle
          ? 'motorZPPCheckForSensoryFunctionLevelIncludedButOverriddenByNonKeyMuscleAction'
          : 'motorZPPCheckForSensoryFunctionAddLevelAndContinueAction',
      },
    ];

    if (isTopRange) {
      actions.push({
        key: 'motorZPPCheckForSensoryFunctionTopOfRangeReachedStopAction',
      });
    }

    return {
      description,
      actions,
      state: {
        ...state,
        zpp: overrideWithNonKeyMuscle
          ? [...state.zpp]
          : [motorZPPName, ...state.zpp],
        currentLevel: currentLevel.previous,
        addNonKeyMuscle: state.addNonKeyMuscle || overrideWithNonKeyMuscle,
      },
      next: isTopRange ? addLowerNonKeyMuscleToMotorZPPIfNeeded : checkLevel,
    };
  }

  return isTopRange
    ? {
        description,
        actions: [
          { key: 'motorZPPCheckForSensoryFunctionTopOfRangeReachedStopAction' },
        ],
        state: { ...state, zpp: [...state.zpp] },
        next: addLowerNonKeyMuscleToMotorZPPIfNeeded,
      }
    : {
        description,
        actions: [
          {
            key: 'motorZPPCheckForSensoryFunctionNoSensoryFunctionFoundContinueAction',
          },
        ],
        state: {
          ...state,
          zpp: [...state.zpp],
          currentLevel: currentLevel.previous,
        },
        next: checkLevel,
      };
}

/*
 * Branch in the fourth step of the calculation.
 * It produces iteration, by calling `checkLevel`, as with `checkForMotorFunction` and `checkForSensoryFunction` it looks for normal motor function.
 * Looks for motor function in the current level.
 *   - If the level has any normal motor function, it checks if the  non-key muscle overrides it or adds it to ZPP.
 *     When adding, it checks if a star needs to be added.
 *     It then sets `addLowerNonKeyMuscleToMotorZPPIfNeeded` as next step.
 *   - If the motor value is `NT` or contains a `*`, it checks if the  non-key muscle overrides it or adds it to ZPP.
 *     When adding, it checks if a star needs to be added.
 *     It sets `checkLevel` as the next step to continue iterating through the range, or `addLowerNonKeyMuscleToMotorZPPIfNeeded` if we have reached the top level in the range.
 *   - If no normal or `NT | *` value is found, and the `currentLevel` is the `topLevel`, it sets `addLowerNonKeyMuscleToMotorZPPIfNeeded` as next step breaking the iteration.
 *   - If non of the previous cases happen, it sets `checkLevel` as the next step to continue iterating through the range.
 * Could throw one of the following errors:
 *   - state.currentLevel is null. A SideLevel value is required.
 *   - state.currentLevel.motor is null.
 */
export function checkForMotorFunction(state: State): Step {
  if (!state.currentLevel) {
    throw new Error(
      'checkForMotorFunction :: state.currentLevel is null. A SideLevel value is required.',
    );
  }

  const currentLevel = state.currentLevel;

  if (!currentLevel.motor) {
    throw new Error(
      'checkForMotorFunction :: state.currentLevel.motor is null.',
    );
  }

  const isNonKeyMuscle = state.nonKeyMuscle
    ? currentLevel.name === state.nonKeyMuscle.name
    : false;
  const overrideWithNonKeyMuscle =
    state.testNonKeyMuscle &&
    state.nonKeyMuscle &&
    state.nonKeyMuscle.index - currentLevel.index > 3;
  const description: { key: Translation; params: { [key: string]: string } } = {
    key: 'motorZPPCheckForMotorFunctionDescription',
    params: { levelName: currentLevel.name, motor: currentLevel.motor },
  };
  const isTopRangeLevel = currentLevel.name === state.topLevel.name;

  // This will skip 0*, which needs to be handled individually
  if (
    /^[1-5]/.test(currentLevel.motor) ||
    /^(NT|[0-4])\*\*$/.test(currentLevel.motor)
  ) {
    const hasStar = hasStarOnCurrentOrAboveLevel(
      currentLevel,
      state.lastLevelWithConsecutiveNormalValues,
      state.firstLevelWithStar,
    );

    return overrideWithNonKeyMuscle
      ? {
          description,
          actions: [
            {
              key: 'motorZPPCheckForMotorFunctionNonKeyMuscleOverrideAndStopAction',
            },
          ],
          state: {
            ...state,
            zpp: [...state.zpp],
            currentLevel: currentLevel.previous,
            addNonKeyMuscle: true,
          },
          next: addLowerNonKeyMuscleToMotorZPPIfNeeded,
        }
      : {
          description,
          actions: [
            { key: 'motorZPPCheckForMotorFunctionAddLevelAndStopAction' },
          ],
          state: {
            ...state,
            zpp: [`${currentLevel.name}${hasStar ? '*' : ''}`, ...state.zpp],
            currentLevel: currentLevel.previous,
            nonKeyMuscleHasBeenAdded:
              state.nonKeyMuscleHasBeenAdded || isNonKeyMuscle,
          },
          next: addLowerNonKeyMuscleToMotorZPPIfNeeded,
        };
  }

  if (/^(NT\*?$)|(0\*$)/.test(currentLevel.motor)) {
    const actions: { key: Translation }[] = [
      {
        key: isTopRangeLevel
          ? 'motorZPPCheckForMotorFunctionStopAtTopAction'
          : 'motorZPPCheckForMotorFunctionContinueUntilTopAction',
      },
    ];

    const hasStar = hasStarOnCurrentOrAboveLevel(
      currentLevel,
      state.lastLevelWithConsecutiveNormalValues,
      state.firstLevelWithStar,
    );

    if (hasStar) {
      actions.push({ key: 'motorZPPCheckForMotorFunctionAddStarAction' });
    }

    return overrideWithNonKeyMuscle
      ? {
          description,
          actions: [
            {
              key: 'motorZPPCheckForMotorFunctionFunctionFoundButKeyMuscleOverrideAction',
            },
            ...actions,
          ],
          state: {
            ...state,
            zpp: [...state.zpp],
            currentLevel: currentLevel.previous,
            addNonKeyMuscle: true,
          },
          next: isTopRangeLevel
            ? addLowerNonKeyMuscleToMotorZPPIfNeeded
            : checkLevel,
        }
      : {
          description,
          actions: [
            {
              key: 'motorZPPCheckForMotorFunctionAddLevelWithNormalFunctionAndContinue',
            },
            ...actions,
          ],
          state: {
            ...state,
            zpp: [`${currentLevel.name}${hasStar ? '*' : ''}`, ...state.zpp],
            currentLevel: currentLevel.previous,
            nonKeyMuscleHasBeenAdded:
              state.nonKeyMuscleHasBeenAdded || isNonKeyMuscle,
          },
          next: isTopRangeLevel
            ? addLowerNonKeyMuscleToMotorZPPIfNeeded
            : checkLevel,
        };
  }

  if (currentLevel.name === state.topLevel.name) {
    return {
      description,
      actions: [
        { key: 'motorZPPCheckForMotorFunctionTopOfRangeReachedStopAction' },
      ],
      state: { ...state, currentLevel: currentLevel.previous },
      next: addLowerNonKeyMuscleToMotorZPPIfNeeded,
    };
  }

  return {
    description,
    actions: [
      { key: 'motorZPPCheckForMotorFunctionNoFunctionFoundContinueAction' },
    ],
    state: { ...state, currentLevel: currentLevel.previous },
    next: checkLevel,
  };
}

/*
 * This is the fourth step when calculating the Motor ZPP.
 * Checks if it is a sensory or motor level. It then calls either `checkForMotorFunction` or `checkForSensoryFunction`.
 */
export function checkLevel(state: State): Step {
  return state.currentLevel?.motor
    ? checkForMotorFunction(state)
    : checkForSensoryFunction(state);
}

/*
 * This is the third step when calculating the Motor ZPP.
 * Using the pre-calculated Motor levels, this method determines the top and bottom levels for our test range.
 * By iterating down the `side`, the method determines the `firstLevelWithStar` and the `lastLevelWithConsecutiveNormalValues`.
 * It also builds a chain of `SideLevels` with only the levels that need testing.
 * It sets `currentLevel = bottom` and a reference to `nonKeyMuscle` if one was specified.
 */
export function getTopAndBottomLevelsForCheck(state: State): Step {
  const motorLevels = state.motorLevel.replace(/\*/g, '').split(',');
  const top = motorLevels[0] as SensoryLevel;
  const lowestMotorLevel = motorLevels[motorLevels.length - 1];

  // We exclude not normal S1 values as there would be no propagation for that case
  const hasMotorBelowS1 = /(S2|S3|INT)\*?(,|$)/.test(state.motorLevel);
  const bottom = hasMotorBelowS1
    ? lowestMotorLevel === 'INT'
      ? 'S3'
      : (lowestMotorLevel as SensoryLevel)
    : 'S1';
  const includeS10OrLowerAction: { key: Translation } = {
    key: hasMotorBelowS1
      ? 'motorZPPGetTopAndBottomLevelsForCheckIncludeBelowS1Action'
      : 'motorZPPGetTopAndBottomLevelsForCheckDoNotIncludeBelowS1Action',
  };

  const {
    topLevel,
    bottomLevel,
    nonKeyMuscle,
    firstLevelWithStar,
    lastLevelWithConsecutiveNormalValues,
  } = getLevelsRange(
    state.side,
    top,
    bottom,
    state.side.lowestNonKeyMuscleWithMotorFunction
      ? (state.side.lowestNonKeyMuscleWithMotorFunction as MotorLevel)
      : null,
  );

  return {
    description: { key: 'motorZPPGetTopAndBottomLevelsForCheckDescription' },
    actions: [
      {
        key: 'motorZPPGetTopAndBottomLevelsForCheckRangeAction',
        params: { bottom: bottomLevel.name, top: topLevel.name },
      },
      includeS10OrLowerAction,
    ],
    state: {
      ...state,
      topLevel,
      bottomLevel,
      currentLevel: bottomLevel,
      nonKeyMuscle,
      firstLevelWithStar,
      lastLevelWithConsecutiveNormalValues,
      zpp: [...state.zpp],
    },
    next: checkLevel,
  };
}

/*
 * This is the second step when calculating the Motor ZPP.
 * Updates the `testNonKeyMuscle` flag of the new state object.
 * If the AIS is C or C* and there is a non-key muscle with motor function, it sets the `testNonKeyMuscle` flag to true.
 * The flag will be used in the next steps to let the algorithm know if the Motor ZPP levels detected need to be tested against the non-key muscle.
 * An AIS C or C* implies that there is sensory function at S4-5 and that the lowest non-key muscle could have influenced the AIS calculation.
 */
export function checkLowerNonKeyMuscle(state: State): Step {
  // AIS C or C* implies that there is sensory function at S4-5 and that the lowest non-key muscle could have influenced the AIS calculation.
  const testNonKeyMuscle =
    state.side.lowestNonKeyMuscleWithMotorFunction !== null &&
    /C/i.test(state.ais);

  return {
    description: { key: 'motorZPPCheckLowerNonKeyMuscleDescription' },
    actions: [
      {
        key: testNonKeyMuscle
          ? 'motorZPPCheckLowerNonKeyMuscleConsiderAction'
          : 'motorZPPCheckLowerNonKeyMuscleDoNotConsiderAction',
      },
    ],
    state: {
      ...state,
      zpp: [...state.zpp],
      testNonKeyMuscle,
    },
    next: getTopAndBottomLevelsForCheck,
  };
}

/*
 * This is the first step when calculating the Motor ZPP.
 * Updates the `zpp` property of the new state object.
 * If the VAC is 'Yes', we add 'NA' to the Motor ZPP and stop.
 * If the VAC is 'NT', we add 'NA' to the Motor ZPP and continue to check for the presence of a non-key muscle.
 * If the VAC is 'No', we leave the Motor ZPP empty and continue to check for the presence of a non-key muscle.
 */
export function checkIfMotorZPPIsApplicable(state: State): Step {
  const description: { key: Translation } = {
    key: 'motorZPPCheckIfMotorZPPIsApplicableDescription',
  };
  const next = checkLowerNonKeyMuscle;

  if (state.voluntaryAnalContraction === 'Yes') {
    return {
      description,
      actions: [{ key: 'motorZPPCheckIfMotorZPPIsApplicableYesAction' }],
      state: { ...state, zpp: ['NA'] },
      next: null,
    };
  }

  if (state.voluntaryAnalContraction === 'NT') {
    return {
      description,
      actions: [{ key: 'motorZPPCheckIfMotorZPPIsApplicableNTAction' }],
      state: { ...state, zpp: ['NA'] },
      next,
    };
  }

  return {
    description,
    actions: [{ key: 'motorZPPCheckIfMotorZPPIsApplicableNoAction' }],
    state: { ...state, zpp: [...state.zpp] },
    next,
  };
}

/*
 * Creates a State object ready to be used in the calculation methods.
 * It sets the top, bottom, and lastLevelWithConsecutiveNormalValues levels to C1,
 * the current level to null, and the zpp to empty array.
 */
export function getInitialState(
  side: ExamSide,
  voluntaryAnalContraction: BinaryObservation,
  ais: string,
  motorLevel: string,
): State {
  const c1: SideLevel = {
    name: 'C1',
    lightTouch: '2',
    pinPrick: '2',
    motor: null,
    index: 0,
    next: null,
    previous: null,
  };

  return {
    ais,
    motorLevel: motorLevel.replace(/\*/g, ''),
    voluntaryAnalContraction,
    zpp: [],
    topLevel: c1,
    bottomLevel: c1,
    currentLevel: null,
    side,
    nonKeyMuscle: null,
    nonKeyMuscleHasBeenAdded: false,
    testNonKeyMuscle: false,
    addNonKeyMuscle: false,
    firstLevelWithStar: null,
    lastLevelWithConsecutiveNormalValues: c1,
  };
}

export function determineMotorZPP(
  side: ExamSide,
  voluntaryAnalContraction: BinaryObservation,
  ais: string,
  motorLevel: string,
): string {
  let step: Step = {
    description: { key: 'motorZPPCheckIfMotorZPPIsApplicableDescription' },
    actions: [],
    state: getInitialState(side, voluntaryAnalContraction, ais, motorLevel),
    next: checkIfMotorZPPIsApplicable,
  };

  while (step.next) {
    step = step.next(step.state);

    // ToDo: Add logger
    // console.log(step.description);
    // console.log(step.action);
  }

  return step.state.zpp.join(',');
}
