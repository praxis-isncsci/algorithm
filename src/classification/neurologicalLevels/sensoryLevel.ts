import {
  ExamSide,
  SensoryPointValue,
  SensoryLevel,
  SensoryLevels,
} from '../../interfaces';
import { CheckLevelResult, Translation } from '../common';
import { createStep, Step, StepHandler } from '../common/step';
import {
  SensoryLevelError,
  SENSORY_LEVEL_ERROR_MESSAGES,
} from './sensoryLevelErrors';

export { SensoryLevelError, SENSORY_LEVEL_ERROR_MESSAGES };

/* *************************************** */
/*  Helpers (preserved from original)      */
/* *************************************** */

const isAbnormalSensory = (value: SensoryPointValue): boolean =>
  ['0', '1', '0*', '1*'].includes(value);
const NTVariableSensory = (value: SensoryPointValue): boolean =>
  ['0**', '1**'].includes(value);
const NTNotVariableSensory = (value: SensoryPointValue): boolean =>
  ['2', 'NT', 'NT**'].includes(value);

/* *************************************** */
/*  checkSensoryLevel (preserved exactly)  */
/* *************************************** */

export const checkSensoryLevel = (
  side: ExamSide,
  level: SensoryLevel,
  nextLevel: SensoryLevel,
  variable: boolean,
): CheckLevelResult => {
  if (nextLevel === 'C1') {
    throw new SensoryLevelError(
      'INVALID_NEXT_LEVEL',
      SENSORY_LEVEL_ERROR_MESSAGES.INVALID_NEXT_LEVEL.replace(
        '{{level}}',
        level,
      ).replace('{{nextLevel}}', nextLevel),
    );
  }

  if (side.lightTouch[nextLevel] === '2' && side.pinPrick[nextLevel] === '2') {
    return { continue: true, variable };
  } else if (
    isAbnormalSensory(side.lightTouch[nextLevel]) ||
    isAbnormalSensory(side.pinPrick[nextLevel])
  ) {
    return { continue: false, level: level + (variable ? '*' : ''), variable };
  } else if (
    [side.lightTouch[nextLevel], side.pinPrick[nextLevel]].includes('NT*')
  ) {
    return { continue: false, level: level + '*', variable: true };
  } else if (
    side.lightTouch[nextLevel] === 'NT' ||
    side.pinPrick[nextLevel] === 'NT'
  ) {
    if (
      NTVariableSensory(side.lightTouch[nextLevel]) ||
      NTVariableSensory(side.pinPrick[nextLevel])
    ) {
      return {
        continue: true,
        level: level + (variable ? '*' : ''),
        variable: true,
      };
    } else if (
      NTNotVariableSensory(side.lightTouch[nextLevel]) ||
      NTNotVariableSensory(side.pinPrick[nextLevel])
    ) {
      return { continue: true, level: level + (variable ? '*' : ''), variable };
    } else {
      throw new SensoryLevelError('NT_BRANCH_UNMATCHED');
    }
  } else {
    return { continue: true, variable: true };
  }
};

/* *************************************** */
/*  Types                                  */
/* *************************************** */

export type SensoryLevelState = {
  side: ExamSide;
  levels: string[];
  variable: boolean;
  currentIndex: number;
};

export type SensoryLevelStepHandler = StepHandler<SensoryLevelState>;
export type SensoryLevelStep = Step<SensoryLevelState>;

/* *************************************** */
/*  Action branch detection                */
/* *************************************** */

type CheckLevelActionBranch =
  | 'bothNormal'
  | 'abnormal'
  | 'ntStar'
  | 'ntVariable'
  | 'ntNotVariable'
  | 'otherVariable';

function getCheckLevelActionBranch(
  lt: SensoryPointValue,
  pp: SensoryPointValue,
): CheckLevelActionBranch {
  if (lt === '2' && pp === '2') {
    return 'bothNormal';
  }
  if (isAbnormalSensory(lt) || isAbnormalSensory(pp)) {
    return 'abnormal';
  }
  if ([lt, pp].includes('NT*')) {
    return 'ntStar';
  }
  if (lt === 'NT' || pp === 'NT') {
    if (NTVariableSensory(lt) || NTVariableSensory(pp)) {
      return 'ntVariable';
    }
    if (NTNotVariableSensory(lt) || NTNotVariableSensory(pp)) {
      return 'ntNotVariable';
    }
  }
  return 'otherVariable';
}

/* *************************************** */
/*  Step handlers                          */
/* *************************************** */

function initializeSensoryLevelIteration(
  state: SensoryLevelState,
): SensoryLevelStep {
  return createStep(
    { key: 'sensoryLevelInitializeSensoryLevelIterationDescription' },
    [{ key: 'sensoryLevelInitializeSensoryLevelIterationAction' }],
    state,
    {
      levels: [],
      variable: false,
      currentIndex: 0,
    },
    checkLevel,
  );
}

function checkLevel(state: SensoryLevelState): SensoryLevelStep {
  const level = SensoryLevels[state.currentIndex];
  const nextLevel = SensoryLevels[state.currentIndex + 1] as
    | SensoryLevel
    | undefined;

  // Reached S4_5 (no next level) - level is S4_5, which exists in Sensory
  if (nextLevel === undefined) {
    const lt = state.side.lightTouch[level as Exclude<SensoryLevel, 'C1'>];
    const pp = state.side.pinPrick[level as Exclude<SensoryLevel, 'C1'>];
    const description = {
      key: 'sensoryLevelCheckLevelDescription' as const,
      params: {
        levelName: level,
        lightTouch: lt,
        pinPrick: pp,
      },
    };
    const intLevel = 'INT' + (state.variable ? '*' : '');
    return createStep(
      description,
      [{ key: 'sensoryLevelCheckLevelReachedEndAction', params: { intLevel } }],
      state,
      {
        levels: [...state.levels, intLevel],
      },
      null,
    );
  }

  const lt = state.side.lightTouch[nextLevel as Exclude<SensoryLevel, 'C1'>];
  const pp = state.side.pinPrick[nextLevel as Exclude<SensoryLevel, 'C1'>];
  const branch = getCheckLevelActionBranch(lt, pp);

  const description = {
    key: 'sensoryLevelCheckLevelDescription' as const,
    params: {
      levelName: nextLevel,
      lightTouch: lt,
      pinPrick: pp,
    },
  };

  const result = checkSensoryLevel(
    state.side,
    level,
    nextLevel,
    state.variable,
  );
  const variable = state.variable || !!result.variable;

  const actionKeyMap: Record<
  CheckLevelActionBranch,
  { key: Translation; params?: { levelName?: string; variable?: string } }
  > = {
    bothNormal: { key: 'sensoryLevelCheckLevelBothNormalAction' },
    abnormal: {
      key: 'sensoryLevelCheckLevelAbnormalAction',
      params: { levelName: level + (variable ? '*' : '') },
    },
    ntStar: {
      key: 'sensoryLevelCheckLevelNTStarAction',
      params: { levelName: level },
    },
    ntVariable: {
      key: 'sensoryLevelCheckLevelNTVariableAction',
      params: { levelName: level + (variable ? '*' : '') },
    },
    ntNotVariable: {
      key: 'sensoryLevelCheckLevelNTNotVariableAction',
      params: { levelName: level + (variable ? '*' : '') },
    },
    otherVariable: { key: 'sensoryLevelCheckLevelOtherVariableAction' },
  };

  const action = actionKeyMap[branch];
  const actions: { key: Translation; params?: { levelName?: string } }[] =
    action.params
      ? [{ key: action.key, params: action.params }]
      : [{ key: action.key }];

  const newLevels = result.level
    ? [...state.levels, result.level]
    : [...state.levels];

  if (result.continue) {
    return createStep(
      description,
      actions,
      state,
      {
        levels: newLevels,
        variable,
        currentIndex: state.currentIndex + 1,
      },
      checkLevel,
    );
  }

  return createStep(
    description,
    actions,
    state,
    {
      levels: newLevels,
      variable,
    },
    null,
  );
}

/* *************************************** */
/*  Initial state and entry points         */
/* *************************************** */

export function getInitialState(side: ExamSide): SensoryLevelState {
  return {
    side,
    levels: [],
    variable: false,
    currentIndex: 0,
  };
}

export function determineSensoryLevel(side: ExamSide): string {
  const initialState = getInitialState(side);
  let step = initializeSensoryLevelIteration(initialState);
  while (step.next) {
    step = step.next(step.state);
  }
  return step.state.levels.join(',');
}

export function* sensoryLevelSteps(
  side: ExamSide,
): Generator<SensoryLevelStep> {
  const initialState = getInitialState(side);
  let step = initializeSensoryLevelIteration(initialState);
  yield step;
  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
