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
/*  Constants - Regex patterns              */
/* *************************************** */

const PATTERNS = {
  /** Contains asterisk (variable/non-normal indicator) */
  hasVariableIndicator: /\*/,
  /** Normal sensory: 2 or ends with ** */
  normalSensory: /(^2$)|(\*\*$)/,
  /** Normal motor: 5 or ends with ** */
  normalMotor: /(^5$)|(\*\*$)/,
  /** Motor grade 0* (impaired with variable) */
  motorZeroWithStar: /0\*/,
  /** Digit followed by * (e.g. 1*, 2* in sensory) */
  digitWithStar: /\d\*/,
  /**
   * Motor values indicating motor function (excludes 0 and 0* which mean no function).
   * Matches: grades 1-5 (and variants like 1*, 2**, etc.), NT**, or 0**.
   */
  hasMotorValueExcludingZeroStar: /^[1-5]|^(?:NT|0)\*\*$/,
  /** Not tested or 0*: NT, NT*, or 0* */
  notTestedOrZeroStar: /^(NT\*?$)|(0\*$)/,
  /** Levels below S1: S2, S3, or INT (independent of motor or sensory) */
  levelBelowS1: /(S2|S3|INT)\*?(,|$)/,
  /** AIS grade C or C* */
  aisGradeC: /C/i,
  /** Asterisk(s) to strip from level names */
  stripAsterisk: /\*/g,
  /** Single asterisk for replacement */
  singleAsterisk: /\*/,
} as const;

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

function createSideLevel(
  side: ExamSide,
  sensoryLevelName: SensoryLevel,
  index: number,
): SideLevel {
  const motorLevelName: MotorLevel | null = MotorLevels.includes(
    sensoryLevelName as MotorLevel,
  )
    ? (sensoryLevelName as MotorLevel)
    : null;
  return {
    name: sensoryLevelName,
    lightTouch:
      sensoryLevelName === 'C1' ? '2' : side.lightTouch[sensoryLevelName],
    pinPrick:
      sensoryLevelName === 'C1' ? '2' : side.pinPrick[sensoryLevelName],
    motor: motorLevelName ? side.motor[motorLevelName] : null,
    index,
    next: null,
    previous: null,
  };
}

/** Creates SideLevel objects for each SensoryLevel from C1 through bottom. */
function buildLevelsFromC1ToBottom(
  side: ExamSide,
  bottom: SensoryLevel,
): SideLevel[] {
  const levels: SideLevel[] = [];
  const bottomIndex = SensoryLevels.indexOf(bottom);
  for (let i = 0; i <= bottomIndex; i++) {
    const sensoryLevelName = SensoryLevels[i];
    levels.push(createSideLevel(side, sensoryLevelName, i));
  }
  return levels;
}

/** Links levels from top to bottom with next/previous. Returns topLevel and bottomLevel. */
function linkLevelChain(
  levels: SideLevel[],
  top: SensoryLevel,
  bottom: SensoryLevel,
): { topLevel: SideLevel; bottomLevel: SideLevel } {
  const topIndex = SensoryLevels.indexOf(top);
  const bottomIndex = SensoryLevels.indexOf(bottom);
  const topLevel = levels[topIndex];
  const bottomLevel = levels[bottomIndex];

  for (let i = topIndex; i <= bottomIndex; i++) {
    const level = levels[i];
    if (i > topIndex) {
      const prev = levels[i - 1];
      prev.next = level;
      level.previous = prev;
    }
  }
  return { topLevel, bottomLevel };
}

/** First level (in iteration order) that has * in lightTouch, pinPrick, or motor. */
function findFirstLevelWithStar(levels: SideLevel[]): SideLevel | null {
  for (const level of levels) {
    if (
      PATTERNS.hasVariableIndicator.test(level.lightTouch) ||
      PATTERNS.hasVariableIndicator.test(level.pinPrick) ||
      PATTERNS.hasVariableIndicator.test(level.motor ?? '')
    ) {
      return level;
    }
  }
  return null;
}

/**
 * Last level before the first non-normal value within the top-to-bottom range.
 * If all levels in range are normal, returns bottomLevel.
 */
function findLastLevelWithConsecutiveNormalValues(
  levels: SideLevel[],
  top: SensoryLevel,
  bottom: SensoryLevel,
  bottomLevel: SideLevel,
): SideLevel {
  const topIndex = SensoryLevels.indexOf(top);
  const bottomIndex = SensoryLevels.indexOf(bottom);
  for (let i = topIndex; i <= bottomIndex; i++) {
    const level = levels[i];
    const sensoryNormal =
      PATTERNS.normalSensory.test(level.lightTouch) &&
      PATTERNS.normalSensory.test(level.pinPrick);
    const motorNormal =
      level.motor === null || PATTERNS.normalMotor.test(level.motor);
    const isNormal = sensoryNormal && motorNormal;
    if (!isNormal) {
      return i > topIndex ? levels[i - 1] : bottomLevel;
    }
  }
  return bottomLevel;
}

function findNonKeyMuscle(
  levels: SideLevel[],
  nonKeyMuscleName: MotorLevel | null,
): SideLevel | null {
  if (!nonKeyMuscleName) return null;
  return levels.find((l) => l.name === nonKeyMuscleName) ?? null;
}

/*
 * Composes support functions to build the level chain and find top, bottom, nonKeyMuscle,
 * firstLevelWithStar, and lastLevelWithConsecutiveNormalValues.
 * Can throw: 'Unable to determine the topLevel, bottomLevel, or lastLevelWithConsecutiveNormalValues'
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
  const levels = buildLevelsFromC1ToBottom(side, bottom);
  const { topLevel, bottomLevel } = linkLevelChain(levels, top, bottom);
  const firstLevelWithStar = findFirstLevelWithStar(levels);
  const lastLevelWithConsecutiveNormalValues =
    findLastLevelWithConsecutiveNormalValues(levels, top, bottom, bottomLevel);
  const nonKeyMuscle = findNonKeyMuscle(levels, nonKeyMuscleName);

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
    return PATTERNS.motorZeroWithStar.test(currentLevel.motor);
  }

  const hasStarOnCurrentLevel =
    PATTERNS.digitWithStar.test(currentLevel.lightTouch) ||
    PATTERNS.digitWithStar.test(currentLevel.pinPrick);
  if (hasStarOnCurrentLevel) {
    return true;
  }

  const isInStarRange =
    currentLevel.index >= firstLevelWithStar.index &&
    currentLevel.index <= lastLevelWithConsecutiveNormalValues.index;
  return isInStarRange;
}

/** Non-key muscle overrides when it is >3 levels below the current level and we are testing for it. */
function shouldOverrideWithNonKeyMuscle(
  state: State,
  currentLevel: SideLevel,
): boolean {
  if (!state.testNonKeyMuscle || !state.nonKeyMuscle) {
    return false;
  }
  return state.nonKeyMuscle.index - currentLevel.index > 3;
}

function isAtTopOfRange(currentLevel: SideLevel, state: State): boolean {
  return currentLevel.name === state.topLevel.name;
}

function buildMotorZPPLevelName(levelName: string, hasStar: boolean): string {
  return `${levelName}${hasStar ? '*' : ''}`;
}

function createStep(
  description: Step['description'],
  actions: Step['actions'],
  state: State,
  updates: Partial<State>,
  next: Step['next'],
): Step {
  return {
    description,
    actions,
    state: { ...state, ...updates },
    next,
  };
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
        : SensoryLevels.indexOf(
          a.replace(PATTERNS.singleAsterisk, '') as SensoryLevel,
        );
    const bIndex =
      b === 'NA'
        ? -1
        : SensoryLevels.indexOf(
          b.replace(PATTERNS.singleAsterisk, '') as SensoryLevel,
        );
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
  const atTop = isAtTopOfRange(currentLevel, state);
  const nextStep = atTop ? addLowerNonKeyMuscleToMotorZPPIfNeeded : checkLevel;

  if (state.motorLevel.includes(currentLevel.name)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(
      currentLevel,
      state.lastLevelWithConsecutiveNormalValues,
      state.firstLevelWithStar,
    );
    const override = shouldOverrideWithNonKeyMuscle(state, currentLevel);
    const actions: {
      key: Translation;
      params?: { [index: string]: string };
    }[] = [
      {
        key: 'motorZPPCheckForSensoryFunctionLevelIncludedInMotorValuesAction',
        params: { levelName: currentLevel.name },
      },
      {
        key: override
          ? 'motorZPPCheckForSensoryFunctionLevelIncludedButOverriddenByNonKeyMuscleAction'
          : 'motorZPPCheckForSensoryFunctionAddLevelAndContinueAction',
      },
    ];
    if (atTop) {
      actions.push({
        key: 'motorZPPCheckForSensoryFunctionTopOfRangeReachedStopAction',
      });
    }

    return createStep(
      description,
      actions,
      state,
      {
        zpp: override ? [...state.zpp] : [buildMotorZPPLevelName(currentLevel.name, hasStar), ...state.zpp],
        currentLevel: currentLevel.previous,
        addNonKeyMuscle: state.addNonKeyMuscle || override,
      },
      nextStep,
    );
  }

  if (atTop) {
    return createStep(
      description,
      [{ key: 'motorZPPCheckForSensoryFunctionTopOfRangeReachedStopAction' }],
      state,
      { zpp: [...state.zpp] },
      nextStep,
    );
  }

  return createStep(
    description,
    [
      {
        key: 'motorZPPCheckForSensoryFunctionNoSensoryFunctionFoundContinueAction',
      },
    ],
    state,
    { zpp: [...state.zpp], currentLevel: currentLevel.previous },
    nextStep,
  );
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

  const description: { key: Translation; params: { [key: string]: string } } = {
    key: 'motorZPPCheckForMotorFunctionDescription',
    params: { levelName: currentLevel.name, motor: currentLevel.motor },
  };
  const atTop = isAtTopOfRange(currentLevel, state);
  const override = shouldOverrideWithNonKeyMuscle(state, currentLevel);
  const isNonKeyMuscle = state.nonKeyMuscle?.name === currentLevel.name;
  const nextWhenAtTop = addLowerNonKeyMuscleToMotorZPPIfNeeded;
  const nextWhenNotAtTop = checkLevel;
  const nextStep = atTop ? nextWhenAtTop : nextWhenNotAtTop;

  const hasStar = hasStarOnCurrentOrAboveLevel(
    currentLevel,
    state.lastLevelWithConsecutiveNormalValues,
    state.firstLevelWithStar,
  );

  const baseStateUpdates = {
    currentLevel: currentLevel.previous,
  };
  const overrideStateUpdates = {
    ...baseStateUpdates,
    addNonKeyMuscle: true,
  };
  const addLevelStateUpdates = (zppAddition: string) => ({
    ...baseStateUpdates,
    zpp: [zppAddition, ...state.zpp],
    nonKeyMuscleHasBeenAdded:
      state.nonKeyMuscleHasBeenAdded || isNonKeyMuscle,
  });

  // Case 1: Motor function (grades 1-5, NT**, 0**) – add level and stop
  if (PATTERNS.hasMotorValueExcludingZeroStar.test(currentLevel.motor)) {
    if (override) {
      return createStep(
        description,
        [
          {
            key: 'motorZPPCheckForMotorFunctionNonKeyMuscleOverrideAndStopAction',
          },
        ],
        state,
        { ...overrideStateUpdates, zpp: [...state.zpp] },
        nextWhenAtTop,
      );
    }
    return createStep(
      description,
      [{ key: 'motorZPPCheckForMotorFunctionAddLevelAndStopAction' }],
      state,
      addLevelStateUpdates(buildMotorZPPLevelName(currentLevel.name, hasStar)),
      nextWhenAtTop,
    );
  }

  // Case 2: NT or 0* – add level and continue (or override)
  if (PATTERNS.notTestedOrZeroStar.test(currentLevel.motor)) {
    const rangeActions: { key: Translation }[] = [
      {
        key: atTop
          ? 'motorZPPCheckForMotorFunctionStopAtTopAction'
          : 'motorZPPCheckForMotorFunctionContinueUntilTopAction',
      },
    ];
    if (hasStar) {
      rangeActions.push({ key: 'motorZPPCheckForMotorFunctionAddStarAction' });
    }

    if (override) {
      return createStep(
        description,
        [
          {
            key: 'motorZPPCheckForMotorFunctionFunctionFoundButKeyMuscleOverrideAction',
          },
          ...rangeActions,
        ],
        state,
        { ...overrideStateUpdates, zpp: [...state.zpp] },
        nextStep,
      );
    }
    return createStep(
      description,
      [
        {
          key: 'motorZPPCheckForMotorFunctionAddLevelWithNormalFunctionAndContinue',
        },
        ...rangeActions,
      ],
      state,
      addLevelStateUpdates(buildMotorZPPLevelName(currentLevel.name, hasStar)),
      nextStep,
    );
  }

  // Case 3: At top of range with no function – stop
  if (atTop) {
    return createStep(
      description,
      [
        {
          key: 'motorZPPCheckForMotorFunctionTopOfRangeReachedStopAction',
        },
      ],
      state,
      baseStateUpdates,
      nextWhenAtTop,
    );
  }

  // Case 4: No function found – continue
  return createStep(
    description,
    [
      {
        key: 'motorZPPCheckForMotorFunctionNoFunctionFoundContinueAction',
      },
    ],
    state,
    baseStateUpdates,
    nextWhenNotAtTop,
  );
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
  const motorLevels = state.motorLevel
    .replace(PATTERNS.stripAsterisk, '')
    .split(',');
  const top = motorLevels[0] as SensoryLevel;
  const lowestMotorLevel = motorLevels[motorLevels.length - 1];

  // We exclude not normal S1 values as there would be no propagation for that case
  const hasMotorBelowS1 = PATTERNS.levelBelowS1.test(state.motorLevel);
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
    PATTERNS.aisGradeC.test(state.ais);

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
    motorLevel: motorLevel.replace(PATTERNS.stripAsterisk, ''),
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
  const initialState = getInitialState(
    side,
    voluntaryAnalContraction,
    ais,
    motorLevel,
  );
  let step = checkIfMotorZPPIsApplicable(initialState);

  while (step.next) {
    step = step.next(step.state);
  }

  return step.state.zpp.join(',');
}

/**
 * Generator that yields each step of the motor ZPP calculation.
 * Enables step-by-step execution for clinicians to see where each value is generated.
 */
export function* motorZPPSteps(
  side: ExamSide,
  voluntaryAnalContraction: BinaryObservation,
  ais: string,
  motorLevel: string,
): Generator<Step> {
  const initialState = getInitialState(
    side,
    voluntaryAnalContraction,
    ais,
    motorLevel,
  );
  let step = checkIfMotorZPPIsApplicable(initialState);
  yield step;
  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
