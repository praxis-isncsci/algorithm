import { BinaryObservation, ExamSide, MotorMuscleValue, MotorLevel, MotorLevels, SensoryPointValue, SensoryLevel, SensoryLevels } from '../interfaces';

export type SideLevel = {
  name: SensoryLevel;
  lightTouch: SensoryPointValue;
  pinPrick: SensoryPointValue;
  motor: MotorMuscleValue | null;
  index: number;
  next: SideLevel | null;
  previous: SideLevel | null;
}

export type State = {
  ais: string,
  motorLevel: string,
  voluntaryAnalContraction: BinaryObservation,
  zpp: string[],
  topLevel: SideLevel,
  bottomLevel: SideLevel,
  currentLevel: SideLevel | null,
  side: ExamSide,
  nonKeyMuscle: SideLevel | null,
  nonKeyMuscleHasBeenAdded: boolean,
  testNonKeyMuscle: boolean,
  addNonKeyMuscle: boolean,
  firstLevelWithStar: SideLevel | null,
  lastLevelWithConsecutiveNormalValues: SideLevel,
}

export type Step = {
  description: string;
  action: string;
  next: ((state: State) => Step) | null;
  state: State;
}

function getLevelsRange(side: ExamSide, top: SensoryLevel, bottom: SensoryLevel, includeSensoryLevels: boolean, nonKeyMuscleName: MotorLevel | null): {
  topLevel: SideLevel,
  bottomLevel: SideLevel,
  nonKeyMuscle: SideLevel | null,
  firstLevelWithStar: SideLevel | null,
  lastLevelWithConsecutiveNormalValues: SideLevel,
} {
  let currentLevel: SideLevel | null = null;
  let topLevel: SideLevel | null = null;
  let bottomLevel: SideLevel | null = null;
  let nonKeyMuscle: SideLevel | null = null;
  let firstLevelWithStar: SideLevel | null = null;
  let lastLevelWithConsecutiveNormalValues: SideLevel | null = null;

  for (let i = 0; i < SensoryLevels.length && !bottomLevel; i++) {
    const sensoryLevelName = SensoryLevels[i];
    const motorLevelName: MotorLevel | null = MotorLevels.includes(sensoryLevelName as MotorLevel) ? sensoryLevelName as MotorLevel : null;

    const level: SideLevel = {
      name: sensoryLevelName,
      lightTouch: sensoryLevelName === 'C1' ? '2' : side.lightTouch[sensoryLevelName],
      pinPrick: sensoryLevelName === 'C1' ? '2' : side.lightTouch[sensoryLevelName],
      motor: motorLevelName ? side.motor[motorLevelName] : null,
      index: i,
      next: null,
      previous: null,
    };

    if (!firstLevelWithStar
      && (
        /\*/.test(level.lightTouch)
        || /\*/.test(level.pinPrick)
        || /\*/.test(level.motor ?? '')
      )
    ) {
      firstLevelWithStar = level;
    }

    if (!lastLevelWithConsecutiveNormalValues
      && (
        !/(^2$)|(\*\*$)/.test(level.lightTouch)
        || !/(^2$)|(\*\*$)/.test(level.pinPrick)
        || !/(^5$)|(\*\*$)/.test(level.motor ?? '')
      )
    ) {
      lastLevelWithConsecutiveNormalValues = currentLevel;
    }

    if (motorLevelName && motorLevelName === nonKeyMuscleName) {
      nonKeyMuscle = level;
    }

    if (top === sensoryLevelName) {
      currentLevel = level;
      topLevel = level;
    } else if (currentLevel && (motorLevelName || includeSensoryLevels)) {
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
    throw new Error('getLevelsRange :: Missing top or bottom range level or ');
  }

  return {topLevel, bottomLevel, nonKeyMuscle, firstLevelWithStar, lastLevelWithConsecutiveNormalValues};
}

/* *********************************************************** */

function hasStarOnCurrentOrAboveLevel(currentLevel: SideLevel, lastLevelWithConsecutiveNormalValues: SideLevel, firstLevelWithStar: SideLevel | null): boolean {
  // Good example, case #93
  if (!firstLevelWithStar) {
    return false;
  }

  if (currentLevel.motor !== null) {
    return /0\*/.test(currentLevel.motor);
  }

  if (/\d\*/.test(currentLevel.lightTouch) || /\d\*/.test(currentLevel.pinPrick)) {
    return true;
  }

  // return currentLevel.index <= lastLevelWithConsecutiveNormalValues.index && currentLevel.index >= firstLevelWithStar.index;
  return /\d\*/.test(currentLevel.lightTouch)
    || /\d\*/.test(currentLevel.pinPrick)
    || (currentLevel.index <= lastLevelWithConsecutiveNormalValues.index && currentLevel.index >= firstLevelWithStar.index);
}

function sortMotorZPP(state: State): Step {
  const zpp = state.zpp.sort((a, b) => {
    const aIndex = a === 'NA' ? -1 : SensoryLevels.indexOf(a.replace(/\*/, '') as SensoryLevel);
    const bIndex = b === 'NA' ? -1 : SensoryLevels.indexOf(b.replace(/\*/, '') as SensoryLevel);
    return aIndex - bIndex;
  });

  return {
    description: 'Sort Motor ZPP',
    action: 'Ensure "NA" is placed first',
    state: {
      ...state,
      zpp,
    },
    next: null,
  }
}

function addLowerNonKeyMuscleToMotorZPPIfNeeded(state: State): Step {
  const description = 'If the non-key muscle affects the AIS calculations, we add it to Motor ZPP.';

  return state.addNonKeyMuscle && !state.nonKeyMuscleHasBeenAdded && state.nonKeyMuscle
    ? {
      description,
      action: 'We add the lowest non-key muscle with motor function to the Motor ZPP',
      state: {
        ...state,
        zpp: [...state.zpp, state.nonKeyMuscle.name],
      },
      next: sortMotorZPP,
    }
    : {
      description,
      action: 'The lowest non-key muscle either does not have an effect on the AIS or has already been added to Motor ZPP.',
      state: {
        ...state,
        zpp: [...state.zpp],
      },
      next: sortMotorZPP,
    };
}

function checkForSensoryFunction(state: State): Step {
  if (!state.currentLevel) {
    throw new Error('checkForMotorFunction :: state.currentLevel is null. A SideLevel value is required.');
  }

  const currentLevel = state.currentLevel;
  const description = `Check for sensory function on ${currentLevel.name} (LT: ${currentLevel.lightTouch} - PP: ${currentLevel.pinPrick}))`;
  const isTopRange = currentLevel.name === state.topLevel.name;

  if (state.motorLevel.includes(currentLevel.name)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(currentLevel, state.lastLevelWithConsecutiveNormalValues, state.firstLevelWithStar);
    const motorZPPName = `${currentLevel.name}${hasStar ? '*' : ''}`;
    const overrideWithNonKeyMuscle = state.testNonKeyMuscle && state.nonKeyMuscle !== null && state.nonKeyMuscle.index - currentLevel.index > 3;
    const action = `
      ${currentLevel.name} is included in motor values.
      ${overrideWithNonKeyMuscle ? 'The value, however is overriden by the non-key muscle' : 'We add it to Motor ZPP and continue checking.'}
      ${isTopRange ? 'We are a the top of the range, we stop.' : ''}
    `;

    return {
      description,
      action,
      state: {
        ...state,
        zpp: overrideWithNonKeyMuscle ? [...state.zpp] : [motorZPPName, ...state.zpp],
        currentLevel: currentLevel.previous,
        addNonKeyMuscle: state.addNonKeyMuscle || overrideWithNonKeyMuscle,
      },
      next: isTopRange ? addLowerNonKeyMuscleToMotorZPPIfNeeded : checkLevel,
    };
  }

  return isTopRange
    ? {
      description,
      action: 'We reached the top of the searchable range. We stop iterating.',
      state: {...state, zpp: [...state.zpp]},
      next:  addLowerNonKeyMuscleToMotorZPPIfNeeded,
    }
    : {
      description,
      action: 'No sensory function was found. We continue.',
      state: {...state, zpp: [...state.zpp], currentLevel: currentLevel.previous},
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

  const isNonKeyMuscle = state.nonKeyMuscle ? currentLevel.name === state.nonKeyMuscle.name : false;
  const overrideWithNonKeyMuscle = state.testNonKeyMuscle && state.nonKeyMuscle && state.nonKeyMuscle.index - currentLevel.index > 3;
  const description = `Check for motor function on ${currentLevel.name}: ${currentLevel.motor}.`;
  const isTopRangeLevel = currentLevel.name === state.topLevel.name;

  // This will skip 0*, which needs to be handled individually
  if (/^[1-5]/.test(currentLevel.motor) || /^(NT|[0-4])\*\*$/.test(currentLevel.motor)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(currentLevel, state.lastLevelWithConsecutiveNormalValues, state.firstLevelWithStar);

    return overrideWithNonKeyMuscle
      ? {
        description,
        action: 'Motor function was found but the lowest non-key muscle with motor function overrides it as it affects the AIS calculation for this case. We stop iterating.',
        state: {
          ...state,
          zpp: [...state.zpp],
          currentLevel: currentLevel.previous,
          addNonKeyMuscle: true,
        },
        next:  addLowerNonKeyMuscleToMotorZPPIfNeeded,
      }
      : {
        description,
        action: 'Motor function was found. We include the level in Motor ZPP and stop iterating.',
        state: {
          ...state,
          zpp: [`${currentLevel.name}${hasStar ? '*' : ''}`, ...state.zpp],
          currentLevel: currentLevel.previous,
          nonKeyMuscleHasBeenAdded: state.nonKeyMuscleHasBeenAdded || isNonKeyMuscle,
        },
        next:  addLowerNonKeyMuscleToMotorZPPIfNeeded,
      };
  }

  if (/^(NT\*?$)|(0\*$)/.test(currentLevel.motor)) {
    const hasStar = hasStarOnCurrentOrAboveLevel(currentLevel, state.lastLevelWithConsecutiveNormalValues, state.firstLevelWithStar);

    return overrideWithNonKeyMuscle
      ? {
        description,
        action: `
          Motor function marked as not normal was found but the lowest non-key muscle with motor function overrides it as it affects the AIS calculation for this case. We continue iterating.
          ${isTopRangeLevel ? 'Because we have reached the top level in our range, we stop.' : 'Since we have not reached the top level of our range, we continue'}
          ${hasStar ? 'Since motor has a star on this level or above, we add a star to the result.' : ''}
          `,
        state: {
          ...state,
          zpp: [...state.zpp],
          currentLevel: currentLevel.previous,
          addNonKeyMuscle: true,
        },
        next:  isTopRangeLevel ? null : checkLevel,
      }
      : {
        description,
        action: `
          Motor function marked as not normal was found. We include the level in Motor ZPP and continue.
          ${isTopRangeLevel ? 'Because we have reached the top level in our range, we stop.' : 'Since we have not reached the top level of our range, we continue'}
          ${hasStar ? 'Since motor has a star on this level or above, we add a star to the result.' : ''}
          `,
        state: {
          ...state,
          zpp: [`${currentLevel.name}${hasStar ? '*' : ''}`, ...state.zpp],
          currentLevel: currentLevel.previous,
          nonKeyMuscleHasBeenAdded: state.nonKeyMuscleHasBeenAdded || isNonKeyMuscle,
        },
        next:  isTopRangeLevel ? null : checkLevel,
      };
  }

  if (currentLevel.name === state.topLevel.name) {
    return {
      description,
      action: 'We reached the top of the searchable range. We stop iterating. Next we will check the lowest non-key muscle with motor function.',
      state: {...state, currentLevel: currentLevel.previous},
      next:  addLowerNonKeyMuscleToMotorZPPIfNeeded,
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

/*
 * 3.
 */
function getTopAndBottomLevelsForCheck(state: State): Step {
  const motorLevels = state.motorLevel.replace(/\*/g, '').split(',');
  const top = motorLevels[0] as SensoryLevel;

  // We exclude not normal T1 values as there would be no propagation for that case
  const includeThoracicandLumbarSensoryLevels = /T1\*?(,|$)/.test(state.motorLevel) && /^(5|NT|(NT|[0-4])\*\*)$/.test(state.side.motor['T1']);

  // We exclude not normal S1 values as there would be no propagation for that case
  const motorIncludesS1OrLower = (/S1\*?(,|$)/.test(state.motorLevel) && /^(5|NT|(NT|[0-4])\*\*)$/.test(state.side.motor['S1']))
    || /(S2|S3|INT)\*?(,|$)/.test(state.motorLevel);
  const lowestMotorLevel = motorLevels[motorLevels.length - 1];
  const bottom = motorIncludesS1OrLower
    ? lowestMotorLevel === 'INT' ? 'S3' : lowestMotorLevel as SensoryLevel
    : 'S1';

  const {topLevel, bottomLevel, nonKeyMuscle, firstLevelWithStar, lastLevelWithConsecutiveNormalValues} = getLevelsRange(
    state.side,
    top,
    bottom,
    includeThoracicandLumbarSensoryLevels,
    state.side.lowestNonKeyMuscleWithMotorFunction ? state.side.lowestNonKeyMuscleWithMotorFunction as MotorLevel : null,
  );

  return {
    description: 'Using the Motor Levels, look for the top and bottom levels to examine. We will move from bottom to top using that range.',
    action: `
      Our search range will be between ${bottomLevel.name} (bottom) and ${topLevel.name} (top).
      ${includeThoracicandLumbarSensoryLevels ? 'Since T1 is a normal Motor Level, we include thoracic and lumbar dermatomes in our test.' : 'Since T1 is not a normal Motor Level, we do not include thoracic and lumbar dermatomes in our test.'}
      ${includeThoracicandLumbarSensoryLevels && motorIncludesS1OrLower ? 'Since S1 is a normal Motor Level, the bottom of our range is determined by the lowest Motor Level.' : 'Since S1 is not a normal Motor Level, we make S1 the bottom of our range.'}
    `,
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
 * 2.
 */
function checkLowerNonKeyMuscle(state: State): Step {
  const description = 'Check for motor function on the lowest non-key muscle.';
  const next = getTopAndBottomLevelsForCheck;
  // AIS C or C* implies that there is sensory function at S4-5 and that the lowest non-key muscle could have influenced the AIS calculation.
  const testNonKeyMuscle = state.side.lowestNonKeyMuscleWithMotorFunction !== null && /C/i.test(state.ais);

  return {
    description,
    action: testNonKeyMuscle
      ? 'Consider non-key muscle with motor function when calculating the Motor ZPP'
      : 'The lowest non-key muscle does not have an effect on the AIS calculation on this side.',
    state: {
      ...state,
      zpp: [...state.zpp],
      testNonKeyMuscle,
    },
    next,
  };
}

/*
 * 1.
 */
export function startCheckIfMotorZPPIsApplicable(state: State): Step {
  const description = 'Check if there is voluntary anal contraction (VAC)';
  const next = checkLowerNonKeyMuscle;

  if (state.voluntaryAnalContraction === 'Yes') {
    return {
      description,
      action: 'VAC is set to "Yes". We set the Motor ZPP to "NA" and stop',
      state: {...state, zpp: ['NA']},
      next: null,
    };
  }

  if (state.voluntaryAnalContraction === 'NT') {
    return {
      description,
      action: 'VAC is set to "NT". We set the Motor ZPP to "NA" and we proceed to determine the Top and Bottom levels.',
      state: {...state, zpp: ['NA']},
      next,
    };
  }

  return {
    description,
    action: `VAC is set to "No". We proceed to determine the Top and Bottom levels.`,
    state: {...state, zpp: [...state.zpp]},
    next,
  };
}

export function determineMotorZPP(side: ExamSide, voluntaryAnalContraction: BinaryObservation, ais: string, motorLevel: string): string {
  const c1: SideLevel = {
    name: 'C1',
    lightTouch: '2',
    pinPrick: '2',
    motor: null,
    index: 0,
    next: null,
    previous: null,
  };

  let step: Step = {
    description: 'Start',
    action: '',
    state: {
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
    },
    next: startCheckIfMotorZPPIsApplicable,
  };

  while (step.next) {
    step = step.next(step.state);

    // ToDo: Add logger
    // console.log(step.description);
    // console.log(step.action);
  }

  return step.state.zpp.join(',');
}
