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

function hasStarOnCurrentOrAboveLevel(level: SideLevel): boolean {
  let currentLevel: SideLevel | null = level;

  do {
    if (currentLevel.motor && /\*$/.test(currentLevel.motor)) {
      return true;
    }

    if (!currentLevel.motor && (/\*$/.test(currentLevel.lightTouch) || /\*$/.test(currentLevel.pinPrick))) {
      return true;
    }

    currentLevel = currentLevel.previous;
  } while(currentLevel)

  return false;
}

function checkForSensoryFunction(state: State): Step {
  if (!state.currentLevel) {
    throw new Error('checkForMotorFunction :: state.currentLevel is null. A SideLevel value is required.');
  }

  const currentLevel = state.currentLevel;
  const description = `Check for sensory function on ${currentLevel.name} (LT: ${currentLevel.lightTouch} - PP: ${currentLevel.pinPrick}))`;

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

  const description = `Check for motor function on ${currentLevel.name}: ${currentLevel.motor}.`;
  const isTopRangeLevel = currentLevel.name === state.topLevel.name;

  // ToDo: this is checking the current level but neds to check this and all motor levels above

  // This will skip 0*, which needs to be handled individually
  if (/^[1-5]/.test(currentLevel.motor) || /^(NT|[0-4])\*\*$/.test(currentLevel.motor)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(currentLevel);

    return {
      description,
      action: 'Motor function was found. We include the level in Motor ZPP and stop.',
      state: {...state, zpp: [...state.zpp, `${currentLevel.name}${hasStar ? '*' : ''}`]},
      next:  null,
    };
  }

  if (/^(NT\*?$)|(0\*$)/.test(currentLevel.motor)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(currentLevel);

    return {
      description,
      action: `
        Motor function marked as not normal was found. We include the level in Motor ZPP and continue.
        ${isTopRangeLevel ? 'Because we have reached the top level in our range, we stop.' : 'Since we have not reached the top level of our range, we continue'}
        ${hasStar ? 'Since motor has a star on this level or above, we add a star to the result.' : ''}
        `,
      state: {...state, zpp: [...state.zpp, `${currentLevel.name}${hasStar ? '*' : ''}`]},
      next:  isTopRangeLevel ? null : checkLevel,
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

  // We exclude not normal T1 values as there would be no propagation for that case
  const includeThoracicandLumbarSensoryLevels = /(T1(,|$))|(T1\*\*(,|$))/.test(state.motorLevel);

  // We exclude not normal S1 values as there would be no propagation for that case
  const motorIncludesS1 = /(S1(,|$))|(S1\*\*(,|$))/.test(state.motorLevel);
  const bottom = motorIncludesS1
    ? motorLevels[motorLevels.length - 1] as SensoryLevel
    : 'S1';

  // const {topLevel, bottomLevel} = initializeSideLevels(state.side, top, bottom);
  const {topLevel, bottomLevel} = getLevelsRange(state.side, top, bottom, includeThoracicandLumbarSensoryLevels);

  return {
    description: 'Using the Motor Levels, look for the top and bottom levels to examine. We will move from bottom to top using that range.',
    action: `
      Our search range will be between ${bottomLevel.name} (bottom) and ${topLevel.name} (top).
      ${includeThoracicandLumbarSensoryLevels ? 'Since T1 is a normal Motor Level, we include thoracic and lumbar dermatomes in our test.' : 'Since T1 is not a normal Motor Level, we do not include thoracic and lumbar dermatomes in our test.'}
      ${includeThoracicandLumbarSensoryLevels && motorIncludesS1 ? 'Since S1 is a normal Motor Level, the bottom of our range is determined by the lowest Motor Level.' : 'Since S1 is not a normal Motor Level, we make S1 the bottom of our range.'}
    `,
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
