import { BinaryObservation, ExamSide, MotorMuscleValue, MotorLevel, MotorLevels, SensoryPointValue, SensoryLevel, SensoryLevels } from "../../interfaces";
import { levelIsBetween, CheckLevelResult, isNormalSensory } from "../common";

/**
 * `['NT', '0*', 'NT*'].includes(value)`
 */
// const canBeTotalParalysisMotor = (value: MotorMuscleValue): boolean => ['NT', '0*', 'NT*'].includes(value);
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

export const checkLevelForMotorZPP = (side: ExamSide, level: MotorLevel, variable: boolean): CheckLevelResult => {
  const result: CheckLevelResult = {continue: true, variable};
  if (side.motor[level] === '0') {
    return result;
  }

  if (!['0*','NT','NT*'].includes(side.motor[level])) {
    result.continue = false;
  }

  if (['0*','0**'].includes(side.motor[level])) {
    result.level = level + '*';
  } else {
    result.level = level + (variable? '*' : '');
  }

  if (['0*','0**'].includes(side.motor[level])) {
    result.variable = true;
  }
  return result;
}

export const checkLevelForMotorZPPOnSensory = (side: ExamSide, level: SensoryLevel, variable: boolean, extremityIsAllNormal: boolean, extremityCanBeAllNormal: boolean, extremityCanBeAllParalyzed: boolean): CheckLevelResult => {
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
        result.level = level + (variable ? '*' : '');
        if (extremityIsAllNormal && side.lightTouch[level] !== 'NT' && side.pinPrick[level] !== 'NT') {
          result.continue = false;
        }
      }
      return result;
    } else if (side.lightTouch[level] !== 'NT' || side.pinPrick[level] !== 'NT') {
      return {continue: true, variable};
    }

    if (side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
      return {continue: true, level: level + (variable ? '*' : ''), variable};
    } else {
      return {continue: false, level: level + (variable ? '*' : ''), variable};
    }
  } else {
    return {continue: true, variable};
  }
}

const checkLowestNonKeyMuscleWithMotorFunction = (levels: string[], lowestNonKeyMuscleWithMotorFunction: MotorLevel, startingIndex: number): boolean => {
  if (SensoryLevels.indexOf(lowestNonKeyMuscleWithMotorFunction) > startingIndex) {
    const indexes = levels.map(s => SensoryLevels.indexOf(s.replace(/\*/, '') as SensoryLevel));
    const lowestNonKeyMuscleWithMotorFunctionIndex = SensoryLevels.indexOf(lowestNonKeyMuscleWithMotorFunction);
    return indexes.every(i => i <= lowestNonKeyMuscleWithMotorFunctionIndex);
  } else {
    return false;
  }
}

const getCanBeConsecutivelyBeNormalDownTo = (side: ExamSide): CheckLevelResult => {
  const result = { continue: true, level: 'S4_5', variable: false }
  for (let i = SensoryLevels.indexOf('C2'); i < SensoryLevels.length; i++) {
    if (levelIsBetween(i,'C5','T1') || levelIsBetween(i,'L2','S1')) {
      const index = i - (levelIsBetween(i,'C5','T1') ? 4 : 16);
      const level = MotorLevels[index];
      if (side.motor[level] === '0**' || ['0**', '1**', 'NT**'].includes(side.lightTouch[level]) || ['0**', '1**', 'NT**'].includes(side.pinPrick[level])) {
        result.variable = true;
      }
      if (!canBeNormalMotor(side.motor[level]) || !canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
        result.level = SensoryLevels[i - 1];
        break;
      }
    } else {
      const level = SensoryLevels[i];
      if (level === 'C1') {
        throw `invalid argument level: ${level}`;
      }
      if (['0**', '1**', 'NT**'].includes(side.lightTouch[level]) || ['0**', '1**', 'NT**'].includes(side.pinPrick[level])) {
        result.variable = true;
      }
      if (!canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
        result.level = SensoryLevels[i - 1];
        break;
      }
    }
  }
  return result;
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

// contains side-effect code for result and levels
const checkMotorsOnly = (side: ExamSide, levels: string[], result: CheckLevelResult, option: 'upper' | 'lower'): number => {
  let startingIndex = -1;
  let variable = false;
  const startingMotorIndex = option === 'upper' ? MotorLevels.indexOf('T1') : MotorLevels.length - 1;
  const endingMotorIndex = option === 'upper' ? 0 : MotorLevels.indexOf('L2');
  for (let i = startingMotorIndex; i >= endingMotorIndex; i--) {
    const level = MotorLevels[i];
    result = checkLevelForMotorZPP(side, level, variable);
    variable = variable || result.variable;
    if (result.level) {
      levels.unshift(result.level);
    }
    if (!result.continue) {
      startingIndex = -1;
      break;
    } else {
      startingIndex = SensoryLevels.indexOf(level);
    }
  }
  return startingIndex;
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
export const determineMotorZPP = (side: ExamSide, voluntaryAnalContraction: BinaryObservation, ais: string): string => {
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
      voluntaryAnalContraction === 'NT'
    ) {
      zpp.push('NA');
      result = checkLevelForMotorZPPOnSensory(
        side,
        'S4_5',
        false,
        lowerExtremityIsAllNormal,
        upperExtremityCanBeAllNormal && lowerExtremityCanBeAllNormal,
        false
      );
    }

    let startingIndex = findStartingIndex(side);
    let variable = canBeConsecutivelyBeNormalDownTo.variable;
    if (hasImpairedExtremity(side, 'lower') || hasImpairedExtremity(side, 'upper')) {
      // only check motor levels
      startingIndex = checkMotorsOnly(side, levels, result, 'lower');
    }
    if (startingIndex >= 0 && hasImpairedExtremity(side, 'upper')) {
      // only check motor levels
      startingIndex = checkMotorsOnly(side, levels, result, 'upper');
    }

    if (
      side.lowestNonKeyMuscleWithMotorFunction && (ais === 'C' || ais === 'C*') &&
      checkLowestNonKeyMuscleWithMotorFunction(levels, side.lowestNonKeyMuscleWithMotorFunction, startingIndex)
    ) {
      return [...zpp,side.lowestNonKeyMuscleWithMotorFunction].join(',');
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
          variable,
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
          variable,
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
          variable,
          lowerExtremityIsAllNormal,
          upperExtremityCanBeAllNormal && lowerExtremityCanBeAllNormal,
          false
        );
        if (level === 'S3' && isNormalSensory(side.lightTouch.S4_5) && isNormalSensory(side.pinPrick.S4_5)) {
          result.level = 'S3';
        }
      }
      // check motor
      else if (levelIsBetween(i,'C5','T1') || levelIsBetween(i,'L2','S1')) {
        if ((ais === 'C' || ais === 'C*') && level === side.lowestNonKeyMuscleWithMotorFunction) {
          levels.unshift(level);
          break;
        }
        // level = C5 to C8
        const index = i - (levelIsBetween(i,'C5','T1') ? 4 : 16);
        level = MotorLevels[index];
        result = checkLevelForMotorZPP(side, level, variable);
      }
      // level = C1
      else {
        // TODO: remove hard coded variable
        result = {continue: false, level: 'C1', variable: false};
      }

      if (result.level) {
        levels.unshift(result.level);
      }

      variable = variable || result.variable;
    }

    zpp = [...zpp, ...levels.sort((a, b) => SensoryLevels.indexOf(a.replace(/\*/, '') as SensoryLevel) - SensoryLevels.indexOf(b.replace(/\*/, '') as SensoryLevel))];
    return zpp.join(',');
  }
}