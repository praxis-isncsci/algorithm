import { BinaryObservation, ExamSide, MotorMuscleValue, MotorLevel, MotorLevels, SensoryPointValue, SensoryLevel, SensoryLevels } from "../../interfaces";
import { levelIsBetween, CheckLevelResult, isNormalSensory } from "../common";

/**
 * `['NT', '0*', 'NT*'].includes(value)`
 */
const canBeTotalParalysisMotor = (value: MotorMuscleValue): boolean => ['NT', '0*', 'NT*'].includes(value);
/**
 * `['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value)`
 */
const isNormalMotor = (value: MotorMuscleValue): boolean => ['5', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value);
/**
 * `['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value)`
 */
const canBeNormalMotor = (value: MotorMuscleValue): boolean => ['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value);
/**
 * `['0', '0*', 'NT', 'NT*'].includes(value)`
 */
const canBeParalyzedMotor = (value: MotorMuscleValue): boolean => ['0', '0*', 'NT', 'NT*'].includes(value);
/**
 * `['2', 'NT', '0**', '1**', 'NT**'].includes(value)`
 */
const canBeNormalSensory = (value: SensoryPointValue): boolean => ['2', 'NT', '0**', '1**', 'NT**'].includes(value);

export const checkLevelForMotorZPP = (side: ExamSide, level: MotorLevel): CheckLevelResult => {
  if (side.motor[level] === '0') {
    // TODO: remove hard coded variable
    return {continue: true, variable: false};
  }
  if (canBeTotalParalysisMotor(side.motor[level])) {
    // TODO: remove hard coded variable
    return {continue: true, level, variable: false};
  }
  // TODO: remove hard coded variable
  return {continue: false, level, variable: false};
}

export const checkLevelForMotorZPPOnSensory = (side: ExamSide, level: SensoryLevel, extremityIsAllNormal: boolean, extremityCanBeAllNormal: boolean, extremityCanBeAllParalyzed: boolean): CheckLevelResult => {
  if (level === 'C1') {
    throw `invalid argument level: ${level}`;
  }
  const result: CheckLevelResult = {
    continue: true,
    variable: false,
  }
  const canBeNormalLightTouch = canBeNormalSensory(side.lightTouch[level]);
  const canBeNormalPinPrick = canBeNormalSensory(side.pinPrick[level]);

  if (canBeNormalLightTouch && canBeNormalPinPrick) {
    if (extremityCanBeAllNormal) {
      if (extremityIsAllNormal || extremityCanBeAllParalyzed || side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
        result.level = level;
        if (extremityIsAllNormal && side.lightTouch[level] !== 'NT' && side.pinPrick[level] !== 'NT') {
          result.continue = false;
        }
      }
      return result;
    } else if (side.lightTouch[level] !== 'NT' || side.pinPrick[level] !== 'NT') {
      return {continue: true, variable: false};
    }

    if (side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
      // TODO: remove hard coded variable
      return {continue: true, level, variable: false};
    // } else if (
    //   [side.lightTouch[level],side.pinPrick[level]].includes('0**') ||
    //   [side.lightTouch[level],side.pinPrick[level]].includes('1**') ||
    //   [side.lightTouch[level],side.pinPrick[level]].includes('NT**')
    // ) {
    //   return {continue: true, level: level + '*', variable: true};
    } else {
      // TODO: remove hard coded variable
      return {continue: false/*noZeroYet*/, level, variable: false};
    }
  } else {
    // TODO: remove hard coded variable
    return {continue: true, variable: false};
  }
}

const checkLowestNonKeyMuscleWithMotorFunction = (levels: string[], lowestNonKeyMuscleWithMotorFunction: MotorLevel): boolean => {
  if (lowestNonKeyMuscleWithMotorFunction) {
    const indexes = levels.map(s => SensoryLevels.indexOf(s.replace(/\*/, '') as SensoryLevel));
    const lowestNonKeyMuscleWithMotorFunctionIndex = SensoryLevels.indexOf(lowestNonKeyMuscleWithMotorFunction);
    return indexes.every(i => i <= lowestNonKeyMuscleWithMotorFunctionIndex);
  } else {
    return false;
  }
}

const getCanBeConsecutivelyBeNormalDownTo = (side: ExamSide): SensoryLevel => {
  for (let i = SensoryLevels.indexOf('C2'); i < SensoryLevels.length; i++) {
    if (levelIsBetween(i,'C5','T1') || levelIsBetween(i,'L2','S1')) {
      const index = i - (levelIsBetween(i,'C5','T1') ? 4 : 16);
      const level = MotorLevels[index];
      if (!canBeNormalMotor(side.motor[level])) {
        return SensoryLevels[i - 1];
      }
      if (!canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
        return SensoryLevels[i - 1];
      }
    } else {
      const level = SensoryLevels[i];
      if (level === 'C1') {
        throw `invalid argument level: ${level}`;
      }
      if (!canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
        return SensoryLevels[i - 1];
      }
    }
  }
  return 'S4_5';
}

const isAllNormalExtremity = (side: ExamSide, option: 'lower' | 'upper'): boolean => {
  let startingMotorIndex, startingSensoryIndex;
  switch (option) {
    case 'upper':
      startingMotorIndex = MotorLevels.indexOf('C5');
      startingSensoryIndex = SensoryLevels.indexOf('C5');
      break;
    case 'lower':
      startingMotorIndex = MotorLevels.indexOf('L2');
      startingSensoryIndex = SensoryLevels.indexOf('L2');
      break;
    default:
      throw 'invalid option';
  }

  for (let i = startingMotorIndex; i < startingMotorIndex + 5; i++) {
    const level = MotorLevels[i];
    if (!isNormalMotor(side.motor[level])) {
      return false;
    }
  }
  for (let i = startingSensoryIndex; i < startingSensoryIndex + 5; i++) {
    const level = SensoryLevels[i];
    if (level === 'C1' || !isNormalSensory(side.pinPrick[level]) || !isNormalSensory(side.lightTouch[level])) {
      return false;
    }
  }
  return true;
}

const canBeAllNormalExtremity = (side: ExamSide, option: 'lower' | 'upper'): boolean => {
  let startingIndex, startingSensoryIndex;
  switch (option) {
    case 'upper':
      startingIndex = MotorLevels.indexOf('C5');
      startingSensoryIndex = SensoryLevels.indexOf('C5');
      break;
    case 'lower':
      startingIndex = MotorLevels.indexOf('L2');
      startingSensoryIndex = SensoryLevels.indexOf('L2');
      break;
    default:
      throw 'invalid option';
  }

  for (let i = startingIndex; i < startingIndex + 5; i++) {
    const level = MotorLevels[i];
    if (!canBeNormalMotor(side.motor[level])) {
      return false;
    }
  }
  for (let i = startingSensoryIndex; i < startingSensoryIndex + 5; i++) {
    const level = SensoryLevels[i];
    if (level === 'C1' || !canBeNormalSensory(side.pinPrick[level]) || !canBeNormalSensory(side.lightTouch[level])) {
      return false;
    }
  }
  return true;
}

const canBeAllParalyzedExtremity = (side: ExamSide, option: 'lower' | 'upper'): boolean => {
  let startingIndex;
  switch (option) {
    case 'upper':
      startingIndex = MotorLevels.indexOf('C5');
      break;
    case 'lower':
      startingIndex = MotorLevels.indexOf('L2');
      break;
    default:
      throw 'invalid option';
  }

  for (let i = startingIndex; i < startingIndex + 5; i++) {
    const level = MotorLevels[i];
    if (!canBeParalyzedMotor(side.motor[level])) {
      return false;
    }
  }
  return true;
}

const hasImpairedExtremity = (side: ExamSide, option: 'lower' | 'upper'): boolean => {
  let startingIndex;
  switch (option) {
    case 'upper':
      startingIndex = MotorLevels.indexOf('C5');
      break;
    case 'lower':
      startingIndex = MotorLevels.indexOf('L2');
      break;
    default:
      throw 'invalid option';
  }

  for (let i = startingIndex; i < startingIndex + 5; i++) {
    const level = MotorLevels[i];
    if (['0','1','2','3','4','0*','1*','2*','3*','4*'].includes(side.motor[level])) {
      return true;
    }
  }

  return false;
}

const findStartingIndex = (side: ExamSide): number => {
  for (let i = MotorLevels.length - 1; i >= 0; i--) {
    const level = MotorLevels[i];
    if (side.motor[level] !== '0') {
      if (level === 'S1') {
        return SensoryLevels.indexOf('S3');
      } else if (level === 'T1') {
        return SensoryLevels.indexOf('L1');
      } else {
        return SensoryLevels.indexOf(level);
      }
    }
  }
  return SensoryLevels.indexOf('S3');
}
/**
 * TODO
 * 1. Check VAC value and S4_5 values
 * 2. Check Lower motor values
 *   a. if can be normal check
 *
 * @param side
 * @param voluntaryAnalContraction
 */
export const determineMotorZPP = (side: ExamSide, voluntaryAnalContraction: BinaryObservation): string => {
  if (voluntaryAnalContraction === 'Yes') {
    return 'NA';
  } else {
    let zpp = [];

    const canBeConsecutivelyBeNormalDownTo = getCanBeConsecutivelyBeNormalDownTo(side);
    const upperExtremityIsAllNormal = isAllNormalExtremity(side, 'upper');
    const lowerExtremityIsAllNormal = isAllNormalExtremity(side, 'lower');
    const upperExtremityCanBeAllNormal = canBeAllNormalExtremity(side, 'upper');
    const lowerExtremityCanBeAllNormal = canBeAllNormalExtremity(side, 'lower');
    let upperExtremityCanBeAllParalyzed = canBeAllParalyzedExtremity(side, 'upper');
    let lowerExtremityCanBeAllParalyzed = canBeAllParalyzedExtremity(side, 'lower');

    const levels: string[] = [];
    let level: SensoryLevel | MotorLevel;
    // TODO: remove hard coded variable
    let result: CheckLevelResult = {continue: true, variable: false};
    if (
      voluntaryAnalContraction === 'NT' ||
      (voluntaryAnalContraction === 'No' && canBeConsecutivelyBeNormalDownTo === 'S4_5')
    ) {
      zpp.push('NA');
      result = checkLevelForMotorZPPOnSensory(
        side,
        'S4_5',
        lowerExtremityIsAllNormal,
        upperExtremityCanBeAllNormal && lowerExtremityCanBeAllNormal,
        false
      );
    }

    if (
      side.lowestNonKeyMuscleWithMotorFunction &&
      checkLowestNonKeyMuscleWithMotorFunction(levels, side.lowestNonKeyMuscleWithMotorFunction)
    ) {
      return side.lowestNonKeyMuscleWithMotorFunction;
    }

    let startingIndex = findStartingIndex(side);
    if (hasImpairedExtremity(side, 'lower') || hasImpairedExtremity(side, 'upper')) {
      // only check motor levels
      for (let i = MotorLevels.length - 1; i >= MotorLevels.indexOf('L2'); i--) {
        const level = MotorLevels[i];
        result = checkLevelForMotorZPP(side, level);

        if (result.level) {
          levels.unshift(result.level);
        }
        if (!result.continue) {
          return [...zpp, ...levels].join(',');
        } else {
          startingIndex = SensoryLevels.indexOf(level);
        }
      }
    }
    if (hasImpairedExtremity(side, 'upper')) {
      // only check motor levels
      for (let i = MotorLevels.indexOf('T1'); i >= 0; i--) {
        const level = MotorLevels[i];
        result = checkLevelForMotorZPP(side, level);

        if (result.level) {
          levels.unshift(result.level);
        }
        if (!result.continue) {
          return [...zpp, ...levels].join(',');
        } else {
          startingIndex = SensoryLevels.indexOf(level);
        }
      }
    }

    // start iteration from bottom
    for (let i = startingIndex; i >= 0; i--) {
      if (!result.continue) {
        break;
      }
      level = SensoryLevels[i];
      // check sensory
      if (levelIsBetween(i,'C2','C4')) {
        result = checkLevelForMotorZPPOnSensory(
          side,
          level,
          true,
          true,
          upperExtremityCanBeAllParalyzed
        );
        if (result.level) {
          upperExtremityCanBeAllParalyzed = false;
        }
      } else if (levelIsBetween(i,'T2','L1')) {
        result = checkLevelForMotorZPPOnSensory(
          side,
          level,
          upperExtremityIsAllNormal,
          upperExtremityCanBeAllNormal,
          lowerExtremityCanBeAllParalyzed
        );
        if (result.level) {
          lowerExtremityCanBeAllParalyzed = false;
        }
      } else if (levelIsBetween(i,'S2','S3')) {
        result = checkLevelForMotorZPPOnSensory(
          side,
          level,
          lowerExtremityIsAllNormal,
          upperExtremityCanBeAllNormal && lowerExtremityCanBeAllNormal,
          false
        );
      }
      // check motor
      else if (levelIsBetween(i,'C5','T1') || levelIsBetween(i,'L2','S1')) {
        // level = C5 to C8
        const index = i - (levelIsBetween(i,'C5','T1') ? 4 : 16);
        level = MotorLevels[index];
        result = checkLevelForMotorZPP(side, level);
      }
      // level = C1
      else {
        // TODO: remove hard coded variable
        result = {continue: false, level: 'C1', variable: false};
      }

      if (result.level) {
        levels.unshift(result.level);
      }
    }

    zpp = [...zpp, ...levels.sort((a, b) => SensoryLevels.indexOf(a.replace(/\*/, '') as SensoryLevel) - SensoryLevels.indexOf(b.replace(/\*/, '') as SensoryLevel))];
    return zpp.join(',');
  }
}