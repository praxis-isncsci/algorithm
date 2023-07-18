import { Exam, MotorLevels, SensoryLevel, SensoryLevels } from "../../interfaces";
import { levelIsBetween, CheckLevelResult } from "../common";
import { checkSensoryLevel } from "../neurologicalLevels/sensoryLevel";
import { checkMotorLevel, checkMotorLevelBeforeStartOfKeyMuscles } from "../neurologicalLevels/motorLevel";

export const checkLevelWithoutMotor = (level: SensoryLevel, leftSensoryResult: CheckLevelResult, rightSensoryResult: CheckLevelResult, variable: boolean): CheckLevelResult => {
  let resultLevel;
  if (leftSensoryResult.level || rightSensoryResult.level) {
    if (
      leftSensoryResult.level && rightSensoryResult.level &&
      leftSensoryResult.level.includes('*') && rightSensoryResult.level.includes('*')
    ) {
      resultLevel = level + '*';
    } else {
      resultLevel = level + (variable ? '*' : '');
    }
  }
  return {
    continue: leftSensoryResult.continue && rightSensoryResult.continue,
    level: resultLevel,
    variable: variable || leftSensoryResult.variable || rightSensoryResult.variable,
  }
}

export const checkLevelWithMotor = (exam: Exam, level: SensoryLevel, sensoryResult: CheckLevelResult, variable: boolean): CheckLevelResult => {
  const i = SensoryLevels.indexOf(level);
  const index = i - (levelIsBetween(i,'C4','T1') ? 4 : 16);
  const motorLevel = MotorLevels[index];
  const nextMotorLevel = MotorLevels[index + 1];

  const leftMotorResult = level === 'C4' || level === 'L1' ?
    checkMotorLevelBeforeStartOfKeyMuscles(exam.left, level, nextMotorLevel, variable) :
    level === 'T1' || level === 'S1' ?
      checkMotorLevel(exam.left, motorLevel, motorLevel, variable) :
      checkMotorLevel(exam.left, motorLevel, nextMotorLevel, variable);
  const rightMotorResult = level === 'C4' || level === 'L1' ?
    checkMotorLevelBeforeStartOfKeyMuscles(exam.right, level, nextMotorLevel, variable) :
    level === 'T1' || level === 'S1' ?
      checkMotorLevel(exam.right, motorLevel, motorLevel, variable) : // TODO: hot fix
      checkMotorLevel(exam.right, motorLevel, nextMotorLevel, variable);

  let resultLevel;

  if (leftMotorResult.level || rightMotorResult.level || sensoryResult.level) {
    if (
      leftMotorResult.level && rightMotorResult.level &&
      (leftMotorResult.level.includes('*') || rightMotorResult.level.includes('*'))
    ) {
      resultLevel = level + '*';
    } else {
      resultLevel = level + (variable ? '*' : '');
    }
  }

  return  !sensoryResult.continue
    ? {...sensoryResult, level: resultLevel}
    : {
      continue: leftMotorResult.continue && rightMotorResult.continue,
      level: resultLevel,
      variable: variable || sensoryResult.variable || leftMotorResult.variable || rightMotorResult.variable,
    }
}

export const determineNeurologicalLevelOfInjury = (exam: Exam): string => {
  const listOfNLI = [];
  let variable = false;
  for (let i = 0; i < SensoryLevels.length; i++) {
    const level = SensoryLevels[i];
    const nextLevel = SensoryLevels[i + 1];
    let result: CheckLevelResult = {
      continue: true,
      variable: false,
    };

    if (!nextLevel) {
      listOfNLI.push('INT' + (variable ? '*' : ''));
    } else {
      const leftSensoryResult = checkSensoryLevel(exam.left, level, nextLevel, variable);
      const rightSensoryResult = checkSensoryLevel(exam.right, level, nextLevel, variable);

      if (levelIsBetween(i,'C4','T1') || levelIsBetween(i,'L1','S1')) {
        const sensoryResult = checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, variable);
        result = checkLevelWithMotor(exam, level, sensoryResult, variable);
      } else {
        result = checkLevelWithoutMotor(level, leftSensoryResult, rightSensoryResult, variable);
      }
      variable = variable || result.variable;
      if (result.level) {
        listOfNLI.push(result.level);
      }
      if (!result.continue) {
        break;
      }
    }
  }
  return listOfNLI.join(',');
}
