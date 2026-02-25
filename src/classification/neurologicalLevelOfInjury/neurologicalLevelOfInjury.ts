import {
  Exam,
  MotorLevels,
  SensoryLevel,
  SensoryLevels,
} from '../../interfaces';
import { levelIsBetween, CheckLevelResult } from '../common';
import { checkSensoryLevel } from '../neurologicalLevels/sensoryLevel';
import {
  checkMotorLevel,
  checkMotorLevelBeforeStartOfKeyMuscles,
} from '../neurologicalLevels/motorLevel';
import { createStep, Step, StepHandler } from '../common/step';

/* *************************************** */
/*  Types                                  */
/* *************************************** */

export type NeurologicalLevelOfInjuryState = {
  exam: Exam;
  listOfNLI: string[];
  variable: boolean;
  currentIndex: number;
};

export type NeurologicalLevelOfInjuryStepHandler =
  StepHandler<NeurologicalLevelOfInjuryState>;
export type NeurologicalLevelOfInjuryStep =
  Step<NeurologicalLevelOfInjuryState>;

/* *************************************** */
/*  Check Functions (Preserved)            */
/* *************************************** */

export const checkLevelWithoutMotor = (
  level: SensoryLevel,
  leftSensoryResult: CheckLevelResult,
  rightSensoryResult: CheckLevelResult,
  variable: boolean,
): CheckLevelResult => {
  let resultLevel;
  if (leftSensoryResult.level || rightSensoryResult.level) {
    if (
      leftSensoryResult.level &&
      rightSensoryResult.level &&
      leftSensoryResult.level.includes('*') &&
      rightSensoryResult.level.includes('*')
    ) {
      resultLevel = level + '*';
    } else {
      resultLevel = level + (variable ? '*' : '');
    }
  }
  return {
    continue: leftSensoryResult.continue && rightSensoryResult.continue,
    level: resultLevel,
    variable:
      variable || leftSensoryResult.variable || rightSensoryResult.variable,
  };
};

export const checkLevelWithMotor = (
  exam: Exam,
  level: SensoryLevel,
  sensoryResult: CheckLevelResult,
  variable: boolean,
): CheckLevelResult => {
  const i = SensoryLevels.indexOf(level);
  const index = i - (levelIsBetween(i, 'C4', 'T1') ? 4 : 16);
  const motorLevel = MotorLevels[index];
  const nextMotorLevel = MotorLevels[index + 1];

  const leftMotorResult =
    level === 'C4' || level === 'L1'
      ? checkMotorLevelBeforeStartOfKeyMuscles(
          exam.left,
          level,
          nextMotorLevel,
          variable,
        )
      : level === 'T1' || level === 'S1'
        ? checkMotorLevel(exam.left, motorLevel, motorLevel, variable)
        : checkMotorLevel(exam.left, motorLevel, nextMotorLevel, variable);
  const rightMotorResult =
    level === 'C4' || level === 'L1'
      ? checkMotorLevelBeforeStartOfKeyMuscles(
          exam.right,
          level,
          nextMotorLevel,
          variable,
        )
      : level === 'T1' || level === 'S1'
        ? checkMotorLevel(exam.right, motorLevel, motorLevel, variable)
        : checkMotorLevel(exam.right, motorLevel, nextMotorLevel, variable);

  let resultLevel;

  if (leftMotorResult.level || rightMotorResult.level || sensoryResult.level) {
    if (
      leftMotorResult.level &&
      rightMotorResult.level &&
      (leftMotorResult.level.includes('*') ||
        rightMotorResult.level.includes('*'))
    ) {
      resultLevel = level + '*';
    } else {
      resultLevel = level + (variable ? '*' : '');
    }
  }

  return !sensoryResult.continue
    ? { ...sensoryResult, level: resultLevel }
    : {
        continue: leftMotorResult.continue && rightMotorResult.continue,
        level: resultLevel,
        variable:
          variable ||
          sensoryResult.variable ||
          leftMotorResult.variable ||
          rightMotorResult.variable,
      };
};

/* *************************************** */
/*  Step Handler Functions                 */
/* *************************************** */

/**
 * Step 1: Initialize Neurological Level of Injury calculation
 * Initialize state: empty levels list, variable=false, currentIndex=0
 */
export function initializeNLIIteration(
  state: NeurologicalLevelOfInjuryState,
): NeurologicalLevelOfInjuryStep {
  return createStep(
    {
      key: 'neurologicalLevelOfInjuryInitializeNLIIterationDescription',
    },
    [
      {
        key: 'neurologicalLevelOfInjuryInitializeNLIIterationAction',
      },
    ],
    state,
    {
      listOfNLI: [],
      variable: false,
      currentIndex: 0,
    },
    checkLevel,
  );
}

/**
 * Step 2: Check neurological level at current level
 * Evaluate bilateral sensory and motor function (when applicable)
 */
export function checkLevel(
  state: NeurologicalLevelOfInjuryState,
): NeurologicalLevelOfInjuryStep {
  const level = SensoryLevels[state.currentIndex];
  const nextLevel = SensoryLevels[state.currentIndex + 1];
  const i = state.currentIndex;

  // Handle S4_5 (end of iteration)
  if (!nextLevel) {
    return createStep(
      {
        key: 'neurologicalLevelOfInjuryCheckLevelDescription',
        params: { levelName: level },
      },
      [
        {
          key: 'neurologicalLevelOfInjuryCheckLevelReachedS4_5Action',
        },
      ],
      state,
      {
        listOfNLI: [...state.listOfNLI, 'INT' + (state.variable ? '*' : '')],
      },
      null,
    );
  }

  // Bilateral sensory checks
  const leftSensoryResult = checkSensoryLevel(
    state.exam.left,
    level,
    nextLevel,
    state.variable,
  );
  const rightSensoryResult = checkSensoryLevel(
    state.exam.right,
    level,
    nextLevel,
    state.variable,
  );

  let result: CheckLevelResult;
  let checkType: 'sensory' | 'motor';

  // Determine if this is a motor region
  if (levelIsBetween(i, 'C4', 'T1') || levelIsBetween(i, 'L1', 'S1')) {
    checkType = 'motor';
    const sensoryResult = checkLevelWithoutMotor(
      level,
      leftSensoryResult,
      rightSensoryResult,
      state.variable,
    );
    result = checkLevelWithMotor(
      state.exam,
      level,
      sensoryResult,
      state.variable,
    );
  } else {
    checkType = 'sensory';
    result = checkLevelWithoutMotor(
      level,
      leftSensoryResult,
      rightSensoryResult,
      state.variable,
    );
  }

  // Update variable and levels
  const variable = state.variable || result.variable;
  const newLevels = result.level
    ? [...state.listOfNLI, result.level]
    : [...state.listOfNLI];

  // Determine next step
  const next: NeurologicalLevelOfInjuryStepHandler | null = result.continue
    ? checkLevel
    : null;

  // Build description and actions
  const description = {
    key: 'neurologicalLevelOfInjuryCheckLevelDescription' as const,
    params: { levelName: level },
  };

  const actions = [];

  if (checkType === 'sensory') {
    actions.push({
      key: 'neurologicalLevelOfInjuryCheckLevelSensoryOnlyAction' as const,
    });
  } else {
    actions.push({
      key: 'neurologicalLevelOfInjuryCheckLevelMotorRegionAction' as const,
    });
  }

  if (result.level) {
    actions.push({
      key: 'neurologicalLevelOfInjuryCheckLevelAddLevelAction' as const,
      params: { levelName: result.level },
    });
  }

  if (result.continue) {
    actions.push({
      key: 'neurologicalLevelOfInjuryCheckLevelContinueAction' as const,
    });
  } else {
    actions.push({
      key: 'neurologicalLevelOfInjuryCheckLevelStopAction' as const,
    });
  }

  return createStep(
    description,
    actions,
    state,
    {
      listOfNLI: newLevels,
      variable,
      currentIndex: result.continue
        ? state.currentIndex + 1
        : state.currentIndex,
    },
    next,
  );
}

/* *************************************** */
/*  Main Entry and Generator               */
/* *************************************** */

/**
 * Creates initial state for neurological level of injury calculation
 */
export function getInitialState(exam: Exam): NeurologicalLevelOfInjuryState {
  return {
    exam,
    listOfNLI: [],
    variable: false,
    currentIndex: 0,
  };
}

/**
 * Determine neurological level of injury
 * Returns comma-separated string of levels (e.g., "C5", "T3*", "S3,INT", "INT*")
 */
export const determineNeurologicalLevelOfInjury = (exam: Exam): string => {
  const initialState = getInitialState(exam);
  let step = initializeNLIIteration(initialState);

  while (step.next) {
    step = step.next(step.state);
  }

  return step.state.listOfNLI.join(',');
};

/**
 * Generator that yields each step of the neurological level of injury calculation
 * Enables step-by-step execution for UI display
 */
export function* neurologicalLevelOfInjurySteps(
  exam: Exam,
): Generator<NeurologicalLevelOfInjuryStep> {
  const initialState = getInitialState(exam);
  let step = initializeNLIIteration(initialState);
  yield step;

  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
