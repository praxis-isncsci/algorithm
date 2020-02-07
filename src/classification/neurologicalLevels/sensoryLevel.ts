import { ExamSide, SensoryPointValue, SensoryLevel, SensoryLevels } from '../../interfaces';
import { isNormalSensory, CheckLevelResult } from '../common';

const isAbnormalSensory = (value: SensoryPointValue): boolean => ['0','1','0*','1*','NT*'].includes(value);
const NTVariableSensory = (value: SensoryPointValue): boolean => ['0**','1**'].includes(value);
const NTNotVariableSensory = (value: SensoryPointValue): boolean => ['2','NT','NT**'].includes(value);

export const checkSensoryLevel = (side: ExamSide, level: SensoryLevel, nextLevel: SensoryLevel, variable: boolean): CheckLevelResult => {
  if (nextLevel === 'C1') {
    throw `invalid arguments level: ${level} nextLevel: ${nextLevel}`;
  }

  if (side.lightTouch[nextLevel] === '2' && side.pinPrick[nextLevel] === '2') {
    return {continue: true, variable};
  } else if (isAbnormalSensory(side.lightTouch[nextLevel]) || isAbnormalSensory(side.pinPrick[nextLevel])) {
    return {continue: false, level: level + (variable ? '*' : ''), variable};
  } else if (side.lightTouch[nextLevel] === 'NT' || side.pinPrick[nextLevel] === 'NT') {
    if (NTVariableSensory(side.lightTouch[nextLevel]) || NTVariableSensory(side.pinPrick[nextLevel])) {
      return {continue: true, level: level + (variable ? '*' : ''), variable: true};
    } else if (NTNotVariableSensory(side.lightTouch[nextLevel]) || NTNotVariableSensory(side.pinPrick[nextLevel])) {
      return {continue: true, level: level + (variable ? '*' : ''), variable};
    } else {
      throw '';
    }
  } else {
    return {continue: true, variable: true};
  }

  // const nextLevelContainsNT = side.pinPrick[nextLevel] === 'NT' || side.lightTouch[nextLevel] === 'NT';
  // const nextLevelContainsAbnormal = isAbnormalSensory(side.pinPrick[nextLevel]) || isAbnormalSensory(side.lightTouch[nextLevel]);
  // if (nextLevelContainsNT && !nextLevelContainsAbnormal) {
  //   return {continue: true, level: level + (variable ? '*' : '')};
  // } else {
  //   const nextLevelPinPrickConsideredAbnormal = variableSensory(side.pinPrick[nextLevel]);
  //   const nextLevelLightTouchConsideredAbnormal = variableSensory(side.lightTouch[nextLevel]);

  //   const bothConsideredAbnormal = nextLevelPinPrickConsideredAbnormal && nextLevelLightTouchConsideredAbnormal;
  //   const oneNormalAndOneConsideredAbnormal = (nextLevelPinPrickConsideredAbnormal || nextLevelLightTouchConsideredAbnormal) &&
  //     (nextLevelPinPrickIsNormal || nextLevelLightTouchIsNormal);
  //   const oneNotTestableAndOneConsideredAbnormal = (nextLevelPinPrickConsideredAbnormal || nextLevelLightTouchConsideredAbnormal) &&
  //     nextLevelContainsNT;
  //   if (bothConsideredAbnormal || oneNormalAndOneConsideredAbnormal || oneNotTestableAndOneConsideredAbnormal) {
  //     return {continue: false, level: level + '*'};
  //   } else {
  //     return {continue: false, level: level + (variable ? '*' : '')};
  //   }
  // }
}

/**
 * 1. step through each level
 *    a. If next PP and LT are both considered normal then continue to next level
 *    b. If next PP and LT contains NT and does not contain abnormal then add current level to list then continue to next level
 *    c. Else one of next PP and LT is altered then add current level to list then stop
 *       i. if next PP and LT both
 *    d. If reached last level (S4_5) then add current level to list
 * 2. return current list
 */
export const determineSensoryLevel = (side: ExamSide): string => {
  const levels: string[] = [];
  let variable = false;
  for (let i = 0; i < SensoryLevels.length; i++) {
    const level = SensoryLevels[i];
    const nextLevel = SensoryLevels[i + 1];

    if (nextLevel) {
      const result = checkSensoryLevel(side, level, nextLevel, variable);
      variable = variable || !!result.variable;
      if (result.level) {
        levels.push(result.level);
      }
      if (result.continue) {
        continue;
      } else {
        break;
      }
    } else {
      // reached end of SensoryLevels
      levels.push('INT' + (variable ? '*' : ''));
    }
  }
  return levels.join(',');
}
