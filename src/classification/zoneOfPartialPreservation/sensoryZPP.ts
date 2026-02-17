import {
  BinaryObservation,
  ExamSide,
  SensoryLevel,
  SensoryLevels,
  SensoryPointValue,
} from '../../interfaces';
import { canBeAbsentSensory, CheckLevelResult, Translation } from '../common';
import { createStep, Step, StepHandler } from '../common/step';
import { SensoryZPPError } from './sensoryZPPErrors';

export { SensoryZPPError, SENSORY_ZPP_ERROR_MESSAGES } from './sensoryZPPErrors';

/* *************************************** */
/*  Constants                               */
/* *************************************** */

const PATTERNS = {
  singleAsterisk: /\*/g,
} as const;

/* *************************************** */
/*  Types                                   */
/* *************************************** */

export type SensoryLevelNode = {
  name: SensoryLevel;
  lightTouch: SensoryPointValue;
  pinPrick: SensoryPointValue;
  index: number;
  next: SensoryLevelNode | null;
  previous: SensoryLevelNode | null;
};

export type State = {
  side: ExamSide;
  deepAnalPressure: BinaryObservation;
  zpp: string[];
  variable: boolean;
  topLevel: SensoryLevelNode | null;
  bottomLevel: SensoryLevelNode | null;
  currentLevel: SensoryLevelNode | null;
};

export type SensoryZPPStepHandler = StepHandler<State>;
export type SensoryZPPStep = Step<State>;

/* *************************************** */
/*  Support methods                        */
/* *************************************** */

const isAbsentSensory = (value: SensoryPointValue): boolean => value === '0';

export const checkLevelForSensoryZPP = (
  side: ExamSide,
  level: SensoryLevel,
  variable: boolean,
): CheckLevelResult => {
  if (level === 'C1') {
    throw new SensoryZPPError('CHECK_LEVEL_C1_INVALID');
  }
  const currentLevelPinPrickIsAbsent = isAbsentSensory(side.pinPrick[level]);
  const currentLevelLightTouchIsAbsent = isAbsentSensory(
    side.lightTouch[level],
  );

  if (currentLevelPinPrickIsAbsent && currentLevelLightTouchIsAbsent) {
    return { continue: true, variable };
  }

  if (
    !canBeAbsentSensory(side.pinPrick[level]) ||
    !canBeAbsentSensory(side.lightTouch[level])
  ) {
    return { continue: false, level: level + (variable ? '*' : ''), variable };
  }

  const foundSomeNT = [side.pinPrick[level], side.lightTouch[level]].some(
    (v) => ['NT', 'NT*'].includes(v),
  );
  if (foundSomeNT) {
    return { continue: true, level: level + (variable ? '*' : ''), variable };
  }
  return { continue: true, level: level + '*', variable: variable || !foundSomeNT };
};

function createSensoryLevelNode(
  side: ExamSide,
  level: SensoryLevel,
  index: number,
): SensoryLevelNode {
  const lightTouch =
    level === 'C1' ? '2' : side.lightTouch[level];
  const pinPrick =
    level === 'C1' ? '2' : side.pinPrick[level];
  return {
    name: level,
    lightTouch,
    pinPrick,
    index,
    next: null,
    previous: null,
  };
}

/** Builds a linked chain of SensoryLevelNode from S3 down to C1. */
function buildLevelChainFromS3ToC1(
  side: ExamSide,
): { topLevel: SensoryLevelNode; bottomLevel: SensoryLevelNode } {
  const s3Index = SensoryLevels.indexOf('S3');
  const levels: SensoryLevelNode[] = [];
  for (let i = s3Index; i >= 0; i--) {
    const levelName = SensoryLevels[i] as SensoryLevel;
    levels.push(createSensoryLevelNode(side, levelName, i));
  }
  for (let i = 0; i < levels.length - 1; i++) {
    const curr = levels[i];
    const next = levels[i + 1];
    curr.next = next;
    next.previous = curr;
  }
  return {
    topLevel: levels[0],
    bottomLevel: levels[levels.length - 1],
  };
}

/* *************************************** */
/*  Sensory ZPP calculation step methods   */
/* *************************************** */

/*
 * This is the fifth and final step when calculating the Sensory ZPP.
 * Sorts the ZPP results ensuring the NA value, if available, is at the beginning of the list.
 */
export function sortSensoryZPP(state: State): SensoryZPPStep {
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
    description: { key: 'sensoryZPPSortSensoryZPPDescription' },
    actions: [{ key: 'sensoryZPPSortSensoryZPPEnsureNAIsPlacedFirstAction' }],
    state: { ...state, zpp },
    next: null,
  };
}

/*
 * This is the fourth step when calculating the Sensory ZPP.
 * For each level from S3 down to C1, checks sensory function and adds level to ZPP when indicated.
 * Continues to the next level or stops when the sensory boundary is found or C1 is reached.
 */
export function checkLevel(state: State): SensoryZPPStep {
  if (!state.currentLevel) {
    throw new SensoryZPPError('CURRENT_LEVEL_REQUIRED');
  }

  const currentLevel = state.currentLevel;
  const description: { key: Translation; params: { [key: string]: string } } = {
    key: 'sensoryZPPCheckLevelDescription',
    params: {
      levelName: currentLevel.name,
      lightTouch: currentLevel.lightTouch,
      pinPrick: currentLevel.pinPrick,
    },
  };

  if (currentLevel.name === 'C1') {
    return createStep(
      description,
      [{ key: 'sensoryZPPCheckLevelReachedC1Action' }],
      state,
      {
        zpp: [...state.zpp, currentLevel.name],
        currentLevel: null,
      },
      sortSensoryZPP,
    );
  }

  const result = checkLevelForSensoryZPP(
    state.side,
    currentLevel.name,
    state.variable,
  );
  const variable = state.variable || result.variable;
  const zpp = result.level
    ? [...state.zpp, result.level]
    : [...state.zpp];

  if (result.continue) {
    const nextLevel = currentLevel.next;
    const actions: { key: Translation; params?: { [key: string]: string } }[] =
      result.level
        ? [
          {
            key: 'sensoryZPPCheckLevelAddLevelAction',
            params: { levelName: currentLevel.name },
          },
          { key: 'sensoryZPPCheckLevelContinueAction' },
        ]
        : [{ key: 'sensoryZPPCheckLevelContinueAction' }];
    return createStep(
      description,
      actions,
      state,
      {
        zpp,
        variable,
        currentLevel: nextLevel,
      },
      nextLevel ? checkLevel : sortSensoryZPP,
    );
  }

  return createStep(
    description,
    [
      {
        key: 'sensoryZPPCheckLevelAddLevelAction',
        params: { levelName: currentLevel.name },
      },
      { key: 'sensoryZPPCheckLevelStopAction' },
    ],
    state,
    {
      zpp,
      variable,
      currentLevel: null,
    },
    sortSensoryZPP,
  );
}

/*
 * This is the third step when calculating the Sensory ZPP.
 * Sets the iteration range from S3 (top) to C1 (bottom) and initializes currentLevel.
 */
export function getTopAndBottomLevelsForCheck(state: State): SensoryZPPStep {
  const { topLevel, bottomLevel } = buildLevelChainFromS3ToC1(state.side);

  return {
    description: { key: 'sensoryZPPGetTopAndBottomLevelsForCheckDescription' },
    actions: [
      {
        key: 'sensoryZPPGetTopAndBottomLevelsForCheckRangeAction',
        params: { top: topLevel.name, bottom: bottomLevel.name },
      },
    ],
    state: {
      ...state,
      topLevel,
      bottomLevel,
      currentLevel: topLevel,
    },
    next: checkLevel,
  };
}

/*
 * This is the second step when calculating the Sensory ZPP.
 * Evaluates S4-5 and optionally adds NA to zpp based on DAP and sacral result.
 */
export function checkSacralLevel(state: State): SensoryZPPStep {
  const sacralResult = checkLevelForSensoryZPP(
    state.side,
    'S4_5',
    state.variable,
  );

  const addNA =
    state.deepAnalPressure === 'NT' ||
    (state.deepAnalPressure === 'No' &&
      (!sacralResult.continue || sacralResult.level !== undefined));

  const zpp = addNA ? [...state.zpp, 'NA'] : [...state.zpp];

  return {
    description: { key: 'sensoryZPPCheckSacralLevelDescription' },
    actions: [
      {
        key: addNA
          ? 'sensoryZPPCheckSacralLevelAddNAAction'
          : 'sensoryZPPCheckSacralLevelNoNAAction',
      },
    ],
    state: {
      ...state,
      zpp,
      variable: sacralResult.variable,
    },
    next: getTopAndBottomLevelsForCheck,
  };
}

/*
 * This is the first step when calculating the Sensory ZPP.
 * Determines if Sensory ZPP applies or if we return NA immediately based on DAP and S4-5 values.
 */
export function checkIfSensoryZPPIsApplicable(
  state: State,
): SensoryZPPStep {
  const description: { key: Translation } = {
    key: 'sensoryZPPCheckIfSensoryZPPIsApplicableDescription',
  };
  const next: SensoryZPPStepHandler = checkSacralLevel;

  if (state.deepAnalPressure === 'Yes') {
    return {
      description,
      actions: [{ key: 'sensoryZPPCheckIfSensoryZPPIsApplicableYesAction' }],
      state: { ...state, zpp: ['NA'] },
      next: null,
    };
  }

  const s4_5CanBeAbsent =
    canBeAbsentSensory(state.side.lightTouch.S4_5) &&
    canBeAbsentSensory(state.side.pinPrick.S4_5);

  if (!s4_5CanBeAbsent) {
    return {
      description,
      actions: [
        {
          key: 'sensoryZPPCheckIfSensoryZPPIsApplicableS4_5PreservedAction',
        },
      ],
      state: { ...state, zpp: ['NA'] },
      next: null,
    };
  }

  return {
    description,
    actions: [
      {
        key: 'sensoryZPPCheckIfSensoryZPPIsApplicableProceedAction',
      },
    ],
    state: { ...state, zpp: [], variable: false },
    next,
  };
}

/* *************************************** */
/*  Initial state and orchestrator         */
/* *************************************** */

export function getInitialState(
  side: ExamSide,
  deepAnalPressure: BinaryObservation,
): State {
  return {
    side,
    deepAnalPressure,
    zpp: [],
    variable: false,
    topLevel: null,
    bottomLevel: null,
    currentLevel: null,
  };
}

export function determineSensoryZPP(
  side: ExamSide,
  deepAnalPressure: BinaryObservation,
): string {
  const initialState = getInitialState(side, deepAnalPressure);
  let step = checkIfSensoryZPPIsApplicable(initialState);

  while (step.next) {
    step = step.next(step.state);
  }

  return step.state.zpp.join(',');
}

/**
 * Generator that yields each step of the sensory ZPP calculation.
 * Enables step-by-step execution for clinicians to see where each value is generated.
 */
export function* sensoryZPPSteps(
  side: ExamSide,
  deepAnalPressure: BinaryObservation,
): Generator<SensoryZPPStep> {
  const initialState = getInitialState(side, deepAnalPressure);
  let step = checkIfSensoryZPPIsApplicable(initialState);
  yield step;
  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
