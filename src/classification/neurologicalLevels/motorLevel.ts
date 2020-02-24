import { ExamSide, MotorLevel, MotorLevels, SensoryLevel, SensoryLevels } from '../../interfaces';
import { checkSensoryLevel } from './sensoryLevel';
import { levelIsBetween, CheckLevelResult } from '../common';

export const checkMotorLevel = (side: ExamSide, level: MotorLevel, nextLevel: MotorLevel, variable: boolean): CheckLevelResult => {
  if (['0','1','2'].includes(side.motor[level])) {
    throw new Error(`Invalid motor value at current level`);
  }

  const result: CheckLevelResult = { continue: false, variable };

  if (!['0','1','2'].includes(side.motor[level])) {
    if (!['0*','1*','2*','NT*','3','4','3*','4*'].includes(side.motor[level])) {
      if (!['0','1','2'].includes(side.motor[nextLevel])) {
        result.continue = true;
      }
    }
  }

  if (!(['5','0**','1**','2**','3**','4**','NT**'].includes(side.motor[level]) && !['0','1','2','0*','1*','2*','NT','NT*'].includes(side.motor[nextLevel]))) {
    if (
      ['0*','1*','2*','NT*'].includes(side.motor[level]) || (
        ['0**','1**','2**'].includes(side.motor[level]) && ['0*','1*','2*','NT','NT*'].includes(side.motor[nextLevel])
      )
    ) {
      result.level = level + '*';
    } else {
      result.level = level + (variable ? '*' : '');
    }
  }

  if (!['5','3','4','3*','4*','NT'].includes(side.motor[level])) {
    if (['0**','1**','2**','3**','4**','NT**'].includes(side.motor[level])) {
      if (!['0','1','2'].includes(side.motor[nextLevel])) {
        result.variable = true;
      }
    } else {
      result.variable = true;
    }
  } else if (side.motor[level] === '5' && ['0**','1**','2**'].includes(side.motor[nextLevel])) {
    result.variable = true;
  }

  return result;
}
export const checkMotorLevelBeforeStartOfKeyMuscles = (side: ExamSide, level: 'C4' | 'L1', nextLevel: MotorLevel, variable: boolean): CheckLevelResult => {
  return {
    continue: !['0','1','2'].includes(side.motor[nextLevel]),
    level: ['0','1','2','0*','1*','2*','NT','NT*'].includes(side.motor[nextLevel]) ? level + (variable ? '*' : ''): undefined,
    variable: variable || ['0**','1**','2**'].includes(side.motor[nextLevel]),
  };
}

const checkMotorLevelUsingSensoryValues = (side: ExamSide, firstMotorLevelOfMotorBlock: 'C5' | 'L2'): CheckLevelResult => {
  const startIndex = SensoryLevels.indexOf(firstMotorLevelOfMotorBlock) - 1;
  const result: CheckLevelResult = {continue: true, variable: false};
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
}

export const checkWithSensoryCheckLevelResult = (side: ExamSide, level: 'T1' | 'S1', variable: boolean, sensoryCheckLevelResult: CheckLevelResult): CheckLevelResult => {
  const result: CheckLevelResult = {continue:true, variable};

  if (
    (['3','4','0*','1*','2*','3*','4*','NT*'].includes(side.motor[level]) || !sensoryCheckLevelResult.continue)
  ) {
    result.continue = false;
  }

  if (side.motor[level] === 'NT' || !(['5','0**','1**','2**','3**','4**','NT**'].includes(side.motor[level]) && sensoryCheckLevelResult.continue && !sensoryCheckLevelResult.level)) {
    if (
      ['0*','1*','2*','NT*'].includes(side.motor[level]) ||
      (
        ['0**','1**','2**'].includes(side.motor[level]) &&
        (sensoryCheckLevelResult.level || !sensoryCheckLevelResult.continue)
      )
    ) {
      result.level = level + '*';
    } else {
      result.level = level + (variable ? '*' : '');
    }
  }

  if (
    ['0*','1*','2*','NT*','0**','1**','2**'].includes(side.motor[level]) || (
      ['3**','4**','NT**'].includes(side.motor[level]) && sensoryCheckLevelResult.continue
    ) || (
      ['5','NT'].includes(side.motor[level]) &&
      (sensoryCheckLevelResult.continue && sensoryCheckLevelResult.variable && !sensoryCheckLevelResult.level)
    )
  ) {
    result.variable = true;
  }

  return result;
}

export const checkMotorLevelAtEndOfKeyMuscles = (side: ExamSide, level: 'T1' | 'S1', variable: boolean): CheckLevelResult => {
  if (['0','1','2'].includes(side.motor[level])) {
    throw new Error(`Invalid motor value at current level`);
  }

  const firstMotorLevelOfMotorBlock = level === 'T1' ? 'C5' : 'L2';
  const sensoryCheckLevelResult = checkMotorLevelUsingSensoryValues(side, firstMotorLevelOfMotorBlock);

  return checkWithSensoryCheckLevelResult(side, level, variable, sensoryCheckLevelResult);
}

/** TODO
 * 1. step through each level
 *    a. ...
 * 2. return current list
 */
export const determineMotorLevel = (side: ExamSide): string => {
  const levels: string[] = [];
  let level: SensoryLevel | MotorLevel;
  let nextLevel: SensoryLevel | MotorLevel;
  let result;
  let variable = false;
  for (let i = 0; i < SensoryLevels.length; i++) {
    level = SensoryLevels[i];
    nextLevel = SensoryLevels[i + 1];
    // check sensory
    if (levelIsBetween(i,'C1','C3') || levelIsBetween(i,'T2','T12') || levelIsBetween(i,'S2','S3')) {
      result = checkSensoryLevel(side, level, nextLevel, variable);
    }
    // check before key muscles
    else if (level === 'C4' || level === 'L1') {
      nextLevel = level === 'C4' ? 'C5' : 'L2'
      result = checkMotorLevelBeforeStartOfKeyMuscles(side, level, nextLevel, variable);
    }
    // check motor
    else if (levelIsBetween(i,'C5','C8') || levelIsBetween(i,'L2','L5')) {
      // level = C5 to C8
      const index = i - (levelIsBetween(i,'C5','C8') ? 4 : 16);
      level = MotorLevels[index];
      nextLevel = MotorLevels[index + 1];
      result = checkMotorLevel(side, level, nextLevel, variable);
    }
    // check at end of key muscles
    else if (level === 'T1' || level === 'S1') {
      result = checkMotorLevelAtEndOfKeyMuscles(side, level, variable);
    } else {
      result = {continue: false, level: 'INT' + (variable ? '*' : ''), variable};
    }
    variable = variable || result.variable;
    if (result.level) {
      levels.push(result.level);
    }
    if (result.continue) {
      continue;
    } else {
      return levels.join(',');
    }
  }

  return levels.join(',');
}