import { BinaryObservation, ExamSide, SensoryPointValue, SensoryLevels, SensoryLevel } from "../../interfaces";
import { canBeAbsentSensory, CheckLevelResult } from "../common";

const isAbsentSensory = (value: SensoryPointValue): boolean => value === '0';

export const checkLevelForSensoryZPP = (side: ExamSide, level: SensoryLevel, variable: boolean): CheckLevelResult=> {
  if (level === 'C1') {
    throw `invalid argument level: ${level}`;
  }
  const currentLevelPinPrickIsAbsent = isAbsentSensory(side.pinPrick[level]);
  const currentLevelLightTouchIsAbsent = isAbsentSensory(side.lightTouch[level]);

  if (currentLevelPinPrickIsAbsent && currentLevelLightTouchIsAbsent) {
    // TODO: remove hard coded variable
    return {continue: true, variable};
  }

  if (!canBeAbsentSensory(side.pinPrick[level]) || !canBeAbsentSensory(side.lightTouch[level])) {
    // TODO: remove hard coded variable
    return {continue: false, level: level + (variable ? '*' : ''), variable};
  } else {
    // TODO: remove hard coded variable
    const foundSomeNT = [side.pinPrick[level],side.lightTouch[level]].some(v => ['NT', 'NT*'].includes(v));
    if (foundSomeNT) {
      return {continue: true, level: level + (variable ? '*' : ''), variable};
    } else {
      return {continue: true, level: level + '*', variable: variable || !foundSomeNT};
    }
  }
}

export const determineSensoryZPP = (side: ExamSide, deepAnalPressure: BinaryObservation): string => {
  let zpp = [];
  let variable = false;
  if ((deepAnalPressure === 'No' || deepAnalPressure === 'NT') && canBeAbsentSensory(side.lightTouch.S4_5) && canBeAbsentSensory(side.pinPrick.S4_5)) {
    const sacralResult = checkLevelForSensoryZPP(side, 'S4_5', variable);
    if (
      deepAnalPressure === 'NT' ||
      (deepAnalPressure === 'No' && (!sacralResult.continue || sacralResult.level !== undefined))
    ) {
      zpp.push('NA');
    }

    const levels: string[] = [];
    for (let i = SensoryLevels.indexOf('S3'); i >= 0; i--) {
      const level = SensoryLevels[i];

      // if not level !== C1
      if (i > 0) {
        const result = checkLevelForSensoryZPP(side, level, variable);
        variable = variable || result.variable;
        if (result.level) {
          levels.unshift(result.level);
        }
        if (result.continue) {
          continue;
        } else {
          break;
        }
      } else {
        // reached end of SensoryLevels
        levels.unshift(level);
      }
    }
    zpp = [...zpp, ...levels];
    return zpp.join(',');
  } else {
    return 'NA';
  }
}