import { BinaryObservation, ExamSide, MotorMuscleValue, MotorLevel, MotorLevels, SensoryPointValue, SensoryLevel, SensoryLevels } from "../../interfaces";
import { levelIsBetween, CheckLevelResult } from "../common";

const canBeTotalParalysisMotor = (value: MotorMuscleValue): boolean => ['NT', '0*', 'NT*'].includes(value);
const canBeNormalMotor = (value: MotorMuscleValue): boolean => ['5', 'NT', '0**', '1**', '2**', '3**', '4**', 'NT**'].includes(value);
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

export const checkLevelForMotorZPPOnSensory = (side: ExamSide, level: SensoryLevel): CheckLevelResult => {
  if (level === 'C1') {
    throw `invalid argument level: ${level}`;
  }
  const canBeNormalLightTouch = canBeNormalSensory(side.lightTouch[level]);
  const canBeNormalPinPrick = canBeNormalSensory(side.pinPrick[level]);

  if (canBeNormalLightTouch && canBeNormalPinPrick) {
    if (side.lightTouch[level] === 'NT' || side.pinPrick[level] === 'NT') {
      // TODO: remove hard coded variable
      return {continue: true, level, variable: false};
    } else {
      // TODO: remove hard coded variable
      return {continue: false, level, variable: false};
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

    let canAllBeNormalDownTo: SensoryLevel = 'S4_5';
    for (let i = SensoryLevels.indexOf('C2'); i < SensoryLevels.length; i++) {
      if (levelIsBetween(i,'C5','T1') || levelIsBetween(i,'L2','S1')) {
        const index = i - (levelIsBetween(i,'C5','T1') ? 4 : 16);
        const level = MotorLevels[index];
        if (!canBeNormalMotor(side.motor[level])) {
          canAllBeNormalDownTo = SensoryLevels[i - 1];
          break;
        }
        if (!canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
          canAllBeNormalDownTo = SensoryLevels[i - 1];
          break;
        }
      } else {
        const level = SensoryLevels[i];
        if (level === 'C1') {
          throw `invalid argument level: ${level}`;
        }
        if (!canBeNormalSensory(side.lightTouch[level]) || !canBeNormalSensory(side.pinPrick[level])) {
          canAllBeNormalDownTo = SensoryLevels[i - 1];
          break;
        }
      }
    }

    const levels: string[] = [];
    let level: SensoryLevel | MotorLevel;
    // TODO: remove hard coded variable
    let result: CheckLevelResult = {continue: true, variable: false};

    if (
      voluntaryAnalContraction === 'NT' ||
      (voluntaryAnalContraction === 'No' && canAllBeNormalDownTo === 'S4_5')
    ) {
      zpp.push('NA');
      result = checkLevelForMotorZPPOnSensory(side, 'S4_5');
    }

    // start iteration from bottom
    for (let i = SensoryLevels.indexOf('S3'); i >= 0; i--) {
      if (!result.continue) {
        break;
      }
      level = SensoryLevels[i];
      // check sensory
      if (levelIsBetween(i,'C2','C4') || levelIsBetween(i,'T2','L1') || levelIsBetween(i,'S2','S3')) {
        if (levelIsBetween(i,'C2', canAllBeNormalDownTo)) {
          result = checkLevelForMotorZPPOnSensory(side, level);
        } else {
          // TODO: remove hard coded variable
          result = {continue: true, variable: false};
        }
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

    if (
      side.lowestNonKeyMuscleWithMotorFunction &&
      checkLowestNonKeyMuscleWithMotorFunction(levels, side.lowestNonKeyMuscleWithMotorFunction)
    ) {
      return side.lowestNonKeyMuscleWithMotorFunction;
    }

    zpp = [...zpp, ...levels.sort((a, b) => SensoryLevels.indexOf(a.replace(/\*/, '') as SensoryLevel) - SensoryLevels.indexOf(b.replace(/\*/, '') as SensoryLevel))];
    return zpp.join(',');
  }
}