import { BinaryObservation, ExamSide, MotorMuscleValue, MotorLevel, MotorLevels, SensoryPointValue, SensoryLevel, SensoryLevels } from '../interfaces';

type SideLevel = {
  name: SensoryLevel;
  lightTouch: SensoryPointValue;
  pinPrick: SensoryPointValue;
  motor: MotorMuscleValue | null;
  ordinal: number;
  next: SideLevel | null;
  previous: SideLevel | null;
}

function getLevelsRange(side: ExamSide, top: SensoryLevel, bottom: SensoryLevel, includeSensoryLevels: boolean): {topLevel: SideLevel, bottomLevel: SideLevel} {
  const sensoryLevelsLength = SensoryLevels.length;
  let currentLevel: SideLevel | null = null;
  let topLevel: SideLevel | null = null;
  let bottomLevel: SideLevel | null = null;

  // Skip C1, we already have it
  for (let i = 1; i < sensoryLevelsLength && !bottomLevel; i++) {
    const sensoryLevelName = SensoryLevels[i];
    const motorLevelName: MotorLevel | null = MotorLevels.includes(sensoryLevelName as MotorLevel) ? sensoryLevelName as MotorLevel : null;

    if (sensoryLevelName === 'C1') {
      continue;
    }

    const level: SideLevel = {
      name: sensoryLevelName,
      lightTouch: side.lightTouch[sensoryLevelName],
      pinPrick: side.pinPrick[sensoryLevelName],
      motor: motorLevelName ? side.motor[motorLevelName] : null,
      ordinal: i,
      next: null,
      previous: null,
    };

    if (top === sensoryLevelName) {
      currentLevel = level;
      topLevel = level;
    } else if (currentLevel && (motorLevelName || i > 3 && includeSensoryLevels)) {
      currentLevel.next = level;
      level.previous = currentLevel;
      currentLevel = level;
    }

    if (bottom === sensoryLevelName) {
      bottomLevel = currentLevel;
    }
  }

  if (!topLevel || !bottomLevel) {
    throw new Error('getLevelsRange :: Missing top or bottom range level');
  }

  return {topLevel, bottomLevel};
}

/* *********************************************************** */
type State = {
  motorLevel: string,
  voluntaryAnalContraction: BinaryObservation,
  zpp: string[],
  topLevel: SideLevel,
  bottomLevel: SideLevel,
  currentLevel: SideLevel | null,
  side: ExamSide,
}

type Step = {
  description: string;
  action: string;
  next: ((state: State) => Step) | null;
  state: State;
}

function checkForSensoryFunction(state: State): Step {
  if (!state.currentLevel) {
    throw new Error('checkForMotorFunction :: state.currentLevel is null. A SideLevel value is required.');
  }

  const currentLevel = state.currentLevel;
  const description = `Check for sensory function on ${currentLevel.name}`;

  if (state.motorLevel.includes(currentLevel.name)) {
    return (currentLevel.lightTouch === '2' && currentLevel.pinPrick === '2')
      ? {
        description,
        action: `${currentLevel.name} is included in motor values and both pin prick and light touch equal 2. We add it to Motor ZPP and stop.`,
        state: {...state, zpp: [...state.zpp, currentLevel.name]},
        next:  null,
      }
      : {
        description,
        action: `${currentLevel.name} is included in motor values. We add it to Motor ZPP and continue checking.`,
        state: {...state, currentLevel: currentLevel.previous, zpp: [...state.zpp, currentLevel.name]},
        next:  checkLevel,
      };
  }

  if (currentLevel.name === state.topLevel.name) {
    return {
      description,
      action: 'We reached the top of the searchable range. We stop.',
      state: {...state},
      next:  null,
    };
  }

  return {
    description,
    action: 'No sensory function was found. We continue.',
    state: {...state, currentLevel: currentLevel.previous},
    next:  checkLevel,
  };
}

function checkForMotorFunction(state: State): Step {
  if (!state.currentLevel) {
    throw new Error('checkForMotorFunction :: state.currentLevel is null. A SideLevel value is required.');
  }

  const currentLevel = state.currentLevel;

  if (!currentLevel.motor) {
    throw new Error('checkForMotorFunction :: state.currentLevel.motor is null.');
  }

  const description = `Check for motor function on ${currentLevel.name}.`;

  if (['1', '2', '3', '4', '5'].includes(currentLevel.motor)) {
    return {
      description,
      action: `Motor function was found (${currentLevel.motor}). We can stop.`,
      state: {...state, zpp: [...state.zpp, currentLevel.name]},
      next:  null,
    };
  }

  if (currentLevel.name === state.topLevel.name) {
    return {
      description,
      action: 'We reached the top of the searchable range. We stop.',
      state: {...state},
      next:  null,
    };
  }

  return {
    description,
    action: 'No motor function was found. We continue.',
    state: {...state, currentLevel: currentLevel.previous},
    next:  checkLevel,
  };
}

function checkLevel(state: State): Step {
  return state.currentLevel?.motor
    ? checkForMotorFunction(state)
    : checkForSensoryFunction(state);
}

function getTopAndBottomLevelsForCheck(state: State): Step {
  const motorLevels = state.motorLevel.split(',');
  const top = motorLevels[0] as SensoryLevel;
  const includeSensoryLevels = state.motorLevel.includes('T1');
  const bottom = state.motorLevel.includes('S1')
    ? motorLevels[motorLevels.length - 1] as SensoryLevel
    : 'S1';

  // const {topLevel, bottomLevel} = initializeSideLevels(state.side, top, bottom);
  const {topLevel, bottomLevel} = getLevelsRange(state.side, top, bottom, includeSensoryLevels);

  return {
    description: 'Using the Motor Levels, look for the top and bottom levels to examine. We will move from bottom to top using that range. When motor level includes ',
    action: `Our search range will be between ${bottomLevel.name} (bottom) and ${topLevel.name} (top)`,
    state: {...state, topLevel, bottomLevel, currentLevel: bottomLevel},
    next: checkLevel,
  };
}

function startCheckIfMotorZPPIsApplicable(state: State): Step {
  const description = 'Check if there is voluntary anal contraction (VAC)';

  if (state.voluntaryAnalContraction === 'Yes') {
    return {
      description,
      action: 'VAC is set to "Yes". We set the Motor ZPP to "NA" and stop',
      state: {...state, zpp: [...state.zpp, 'NA']},
      next: null,
    };
  }

  return {
    description,
    action: `VAC is not set to "Yes", it is ${state.voluntaryAnalContraction}. We proceed to determine the Top and Bottom levels.`,
    state: {...state},
    next: getTopAndBottomLevelsForCheck,
  };
}

export function determineMotorZPP(side: ExamSide, voluntaryAnalContraction: BinaryObservation, ais: string, motorLevel: string): string {
  const c1: SideLevel = {
    name: 'C1',
    lightTouch: '2',
    pinPrick: '2',
    motor: null,
    ordinal: 0,
    next: null,
    previous: null,
  };

  let step: Step = {
    description: 'Start',
    action: '',
    state: {
      motorLevel,
      voluntaryAnalContraction,
      zpp: [],
      topLevel: c1,
      bottomLevel: c1,
      currentLevel: null,
      side,
    },
    next: startCheckIfMotorZPPIsApplicable,
  };

  while (step.next) {
    step = step.next(step.state);
    console.log(step.description);
    console.log(step.action);
  }

  return step.state.zpp.join(',');
}
