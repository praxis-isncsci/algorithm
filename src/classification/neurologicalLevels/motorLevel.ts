import {
  ExamSide,
  MotorLevel,
  MotorLevels,
  SensoryLevels,
  BinaryObservation,
} from '../../interfaces';
import { checkSensoryLevel } from './sensoryLevel';
import { levelIsBetween, CheckLevelResult } from '../common';
import { createStep, Step, StepHandler } from '../common/step';

/* *************************************** */
/*  Types                                  */
/* *************************************** */

export type MotorLevelState = {
  side: ExamSide;
  vac: BinaryObservation;
  levels: string[];
  variable: boolean;
  currentIndex: number;
};

export type MotorLevelStepHandler = StepHandler<MotorLevelState>;
export type MotorLevelStep = Step<MotorLevelState>;

/* *************************************** */
/*  Check Functions (Preserved)            */
/* *************************************** */

export const checkMotorLevel = (
  side: ExamSide,
  level: MotorLevel,
  nextLevel: MotorLevel,
  variable: boolean,
): CheckLevelResult => {
  if (['0', '1', '2'].includes(side.motor[level])) {
    throw new Error(`Invalid motor value at current level`);
  }

  const result: CheckLevelResult = { continue: false, variable };

  if (!['0', '1', '2'].includes(side.motor[level])) {
    if (
      !['0*', '1*', '2*', 'NT*', '3', '4', '3*', '4*'].includes(
        side.motor[level],
      )
    ) {
      if (!['0', '1', '2'].includes(side.motor[nextLevel])) {
        result.continue = true;
      }
    }
  }

  if (
    !(
      ['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(
        side.motor[level],
      ) &&
      !['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(
        side.motor[nextLevel],
      )
    )
  ) {
    if (
      ['0*', '1*', '2*', 'NT*'].includes(side.motor[level]) ||
      (['0**', '1**', '2**'].includes(side.motor[level]) &&
        ['0*', '1*', '2*', 'NT', 'NT*'].includes(side.motor[nextLevel]))
    ) {
      result.level = level + '*';
    } else {
      result.level = level + (variable ? '*' : '');
    }
  }

  if (!['5', '3', '4', '3*', '4*', 'NT'].includes(side.motor[level])) {
    if (
      ['0**', '1**', '2**', '3**', '4**', 'NT**'].includes(side.motor[level])
    ) {
      if (!['0', '1', '2'].includes(side.motor[nextLevel])) {
        result.variable = true;
      }
    } else {
      result.variable = true;
    }
  } else if (
    side.motor[level] === '5' &&
    ['0**', '1**', '2**'].includes(side.motor[nextLevel])
  ) {
    result.variable = true;
  }

  return result;
};

export const checkMotorLevelBeforeStartOfKeyMuscles = (
  side: ExamSide,
  level: 'C4' | 'L1',
  nextLevel: MotorLevel,
  variable: boolean,
): CheckLevelResult => {
  return {
    continue: !['0', '1', '2'].includes(side.motor[nextLevel]),
    level: ['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(
      side.motor[nextLevel],
    )
      ? level + (variable ? '*' : '')
      : undefined,
    variable: variable || ['0**', '1**', '2**'].includes(side.motor[nextLevel]),
  };
};

const checkMotorLevelUsingSensoryValues = (
  side: ExamSide,
  firstMotorLevelOfMotorBlock: 'C5' | 'L2',
): CheckLevelResult => {
  const startIndex = SensoryLevels.indexOf(firstMotorLevelOfMotorBlock) - 1;
  const result: CheckLevelResult = { continue: true, variable: false };
  for (let i = startIndex; i <= startIndex + 5; i++) {
    const level = SensoryLevels[i];
    const nextLevel = SensoryLevels[i + 1];
    const currentLevelResult = checkSensoryLevel(side, level, nextLevel, false);

    if (currentLevelResult.continue === false) {
      result.continue = false;
    }
    if (currentLevelResult.level) {
      result.level = currentLevelResult.level;
    }
    if (currentLevelResult.variable) {
      result.variable = true;
    }
  }
  return result;
};

export const checkWithSensoryCheckLevelResult = (
  side: ExamSide,
  level: 'T1' | 'S1',
  variable: boolean,
  sensoryCheckLevelResult: CheckLevelResult,
): CheckLevelResult => {
  const result: CheckLevelResult = { continue: true, variable };

  if (
    ['3', '4', '0*', '1*', '2*', '3*', '4*', 'NT*'].includes(
      side.motor[level],
    ) ||
    !sensoryCheckLevelResult.continue
  ) {
    result.continue = false;
  }

  if (
    side.motor[level] === 'NT' ||
    !(
      ['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(
        side.motor[level],
      ) &&
      sensoryCheckLevelResult.continue &&
      !sensoryCheckLevelResult.level
    )
  ) {
    if (
      ['0*', '1*', '2*', 'NT*'].includes(side.motor[level]) ||
      (['0**', '1**', '2**'].includes(side.motor[level]) &&
        (sensoryCheckLevelResult.level || !sensoryCheckLevelResult.continue))
    ) {
      result.level = level + '*';
    } else {
      result.level = level + (variable ? '*' : '');
    }
  }

  if (
    ['0*', '1*', '2*', 'NT*', '0**', '1**', '2**'].includes(
      side.motor[level],
    ) ||
    (['3**', '4**', 'NT**'].includes(side.motor[level]) &&
      sensoryCheckLevelResult.continue) ||
    (['5', 'NT'].includes(side.motor[level]) &&
      sensoryCheckLevelResult.continue &&
      sensoryCheckLevelResult.variable &&
      !sensoryCheckLevelResult.level)
  ) {
    result.variable = true;
  }

  return result;
};

export const checkMotorLevelAtEndOfKeyMuscles = (
  side: ExamSide,
  level: 'T1' | 'S1',
  variable: boolean,
): CheckLevelResult => {
  if (['0', '1', '2'].includes(side.motor[level])) {
    throw new Error(`Invalid motor value at current level`);
  }

  const firstMotorLevelOfMotorBlock = level === 'T1' ? 'C5' : 'L2';
  const sensoryCheckLevelResult = checkMotorLevelUsingSensoryValues(
    side,
    firstMotorLevelOfMotorBlock,
  );

  return checkWithSensoryCheckLevelResult(
    side,
    level,
    variable,
    sensoryCheckLevelResult,
  );
};

/* *************************************** */
/*  Step Handler Functions                 */
/* *************************************** */

/**
 * Step 1: Initialize motor level calculation
 * Initialize state: empty levels, variable=false, index=0
 */
export function initializeMotorLevelIteration(
  state: MotorLevelState,
): MotorLevelStep {
  return createStep(
    {
      key: 'motorLevelInitializeMotorLevelIterationDescription',
    },
    [
      {
        key: 'motorLevelInitializeMotorLevelIterationAction',
      },
    ],
    state,
    {
      levels: [],
      variable: false,
      currentIndex: 0,
    },
    checkLevel,
  );
}

/**
 * Step 2: Check motor/sensory function at current level
 * Dispatch to appropriate check function based on level category
 */
export function checkLevel(state: MotorLevelState): MotorLevelStep {
  const level = SensoryLevels[state.currentIndex];
  const nextLevel = SensoryLevels[state.currentIndex + 1];
  const i = state.currentIndex;

  let result: CheckLevelResult;
  let checkType:
    | 'sensory'
    | 'beforeKeyMuscles'
    | 'keyMotor'
    | 'endOfKeyMuscles'
    | 'vac';

  // Dispatch by level category
  if (
    levelIsBetween(i, 'C1', 'C3') ||
    levelIsBetween(i, 'T2', 'T12') ||
    levelIsBetween(i, 'S2', 'S3')
  ) {
    // Sensory regions
    checkType = 'sensory';
    result = checkSensoryLevel(state.side, level, nextLevel, state.variable);
  } else if (level === 'C4') {
    // Before cervical key muscles
    checkType = 'beforeKeyMuscles';
    result = checkMotorLevelBeforeStartOfKeyMuscles(
      state.side,
      'C4',
      'C5',
      state.variable,
    );
  } else if (level === 'L1') {
    // Before lumbar key muscles
    checkType = 'beforeKeyMuscles';
    result = checkMotorLevelBeforeStartOfKeyMuscles(
      state.side,
      'L1',
      'L2',
      state.variable,
    );
  } else if (levelIsBetween(i, 'C5', 'C8')) {
    // Cervical key motor region
    checkType = 'keyMotor';
    const index = i - 4;
    const motorLevel = MotorLevels[index];
    const motorNextLevel = MotorLevels[index + 1];
    result = checkMotorLevel(
      state.side,
      motorLevel,
      motorNextLevel,
      state.variable,
    );
  } else if (levelIsBetween(i, 'L2', 'L5')) {
    // Lumbar key motor region
    checkType = 'keyMotor';
    const index = i - 16;
    const motorLevel = MotorLevels[index];
    const motorNextLevel = MotorLevels[index + 1];
    result = checkMotorLevel(
      state.side,
      motorLevel,
      motorNextLevel,
      state.variable,
    );
  } else if (level === 'T1') {
    // End of cervical key muscles
    checkType = 'endOfKeyMuscles';
    result = checkMotorLevelAtEndOfKeyMuscles(state.side, 'T1', state.variable);
  } else if (level === 'S1') {
    // End of lumbar key muscles
    checkType = 'endOfKeyMuscles';
    result = checkMotorLevelAtEndOfKeyMuscles(state.side, 'S1', state.variable);
  } else {
    // S4_5 - VAC handling
    checkType = 'vac';

    if (state.vac === 'No') {
      if (state.levels.includes('S3') || state.levels.includes('S3*')) {
        // S3 already in levels, stop without adding
        result = { continue: false, variable: state.variable };
      } else {
        // Add S3 and stop
        result = {
          continue: false,
          level: 'S3' + (state.variable ? '*' : ''),
          variable: state.variable,
        };
      }
    } else if (state.vac === 'NT') {
      if (state.levels.includes('S3') || state.levels.includes('S3*')) {
        // S3 already in levels, just add INT
        result = {
          continue: false,
          level: 'INT' + (state.variable ? '*' : ''),
          variable: state.variable,
        };
      } else {
        // Add S3 first, then INT in the result
        const newLevels = [...state.levels, 'S3' + (state.variable ? '*' : '')];
        result = {
          continue: false,
          level: 'INT' + (state.variable ? '*' : ''),
          variable: state.variable,
        };
        // Special handling: need to update levels in state before adding INT
        const variable = state.variable || result.variable;

        return createStep(
          {
            key: 'motorLevelCheckLevelDescription',
            params: { levelName: level },
          },
          [
            { key: 'motorLevelCheckLevelVACNTAction' },
            {
              key: 'motorLevelCheckLevelStopAction',
              params: { levelName: variable ? 'S3*,INT*' : 'S3,INT' },
            },
          ],
          state,
          {
            levels: newLevels.concat(['INT' + (variable ? '*' : '')]),
            variable,
          },
          null,
        );
      }
    } else {
      // VAC is 'Yes'
      result = {
        continue: false,
        level: 'INT' + (state.variable ? '*' : ''),
        variable: state.variable,
      };
    }
  }

  // Update variable flag
  const variable = state.variable || result.variable;

  // Build new levels array
  const newLevels = result.level
    ? [...state.levels, result.level]
    : [...state.levels];

  // Determine next step
  const next: MotorLevelStepHandler | null = result.continue
    ? checkLevel
    : null;

  // Build description and actions
  const description = {
    key: 'motorLevelCheckLevelDescription' as const,
    params: { levelName: level },
  };

  const actions = [];

  if (checkType === 'sensory') {
    actions.push({ key: 'motorLevelCheckLevelSensoryRegionAction' as const });
  } else if (checkType === 'beforeKeyMuscles') {
    actions.push({
      key: 'motorLevelCheckLevelBeforeKeyMusclesAction' as const,
      params: { nextLevel: level === 'C4' ? 'C5' : 'L2' },
    });
  } else if (checkType === 'keyMotor') {
    const motorNextLevel = levelIsBetween(i, 'C5', 'C8')
      ? MotorLevels[i - 3]
      : MotorLevels[i - 15];
    actions.push({
      key: 'motorLevelCheckLevelKeyMotorAction' as const,
      params: {
        levelName: level,
        nextLevel: motorNextLevel,
      },
    });
  } else if (checkType === 'endOfKeyMuscles') {
    actions.push({
      key: 'motorLevelCheckLevelEndOfKeyMusclesAction' as const,
      params: { levelName: level },
    });
  } else if (checkType === 'vac') {
    if (state.vac === 'No') {
      actions.push({ key: 'motorLevelCheckLevelVACNoAction' as const });
    } else if (state.vac === 'NT') {
      actions.push({ key: 'motorLevelCheckLevelVACNTAction' as const });
    } else {
      actions.push({ key: 'motorLevelCheckLevelVACYesAction' as const });
    }
  }

  if (result.continue) {
    actions.push({ key: 'motorLevelCheckLevelContinueAction' as const });
  } else if (result.level) {
    actions.push({
      key: 'motorLevelCheckLevelStopAction' as const,
      params: { levelName: result.level },
    });
  } else {
    // Fallback: result.continue is false but no explicit level was provided.
    // Use the last determined level (if any) to ensure a Stop action is added.
    const fallbackLevel = newLevels[newLevels.length - 1];
    if (fallbackLevel) {
      actions.push({
        key: 'motorLevelCheckLevelStopAction' as const,
        params: { levelName: fallbackLevel },
      });
    }
  }

  return createStep(
    description,
    actions,
    state,
    {
      levels: newLevels,
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
 * Creates initial state for motor level calculation
 */
export function getInitialState(
  side: ExamSide,
  vac: BinaryObservation,
): MotorLevelState {
  return {
    side,
    vac,
    levels: [],
    variable: false,
    currentIndex: 0,
  };
}

/**
 * Determine motor level for one side
 * Returns comma-separated string of levels (e.g., "C5", "T3*", "S3,INT")
 */
export function determineMotorLevel(
  side: ExamSide,
  vac: BinaryObservation,
): string {
  const initialState = getInitialState(side, vac);
  let step = initializeMotorLevelIteration(initialState);

  while (step.next) {
    step = step.next(step.state);
  }

  return step.state.levels.join(',');
}

/**
 * Generator that yields each step of the motor level calculation
 * Enables step-by-step execution for UI display
 */
export function* motorLevelSteps(
  side: ExamSide,
  vac: BinaryObservation,
): Generator<MotorLevelStep> {
  const initialState = getInitialState(side, vac);
  let step = initializeMotorLevelIteration(initialState);
  yield step;

  while (step.next) {
    step = step.next(step.state);
    yield step;
  }
}
