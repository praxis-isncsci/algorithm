import { Exam, InjuryComplete, Motor, MotorLevels, NeurologicalLevels, SensoryLevel, SensoryLevels, MotorLevel } from "../../interfaces";
import { startingMotorIndex, CheckAISResult, isSensoryPreserved } from "./common";
import { checkASIAImpairmentScaleA } from "./scale/A";
import { checkASIAImpairmentScaleB } from "./scale/B";
import { checkASIAImpairmentScaleC } from "./scale/C";
import { checkASIAImpairmentScaleD } from "./scale/D";
import { checkASIAImpairmentScaleE } from "./scale/E";

/**
 * exam.voluntaryAnalContraction !== 'No'
 */
const motorFunctionCanBePreserved = (exam: Exam): boolean => exam.voluntaryAnalContraction !== 'No';

const canHaveMotorFunctionMoreThanThreeLevelsBelow = (motor: Motor, motorLevel: string, lowestNonKeyMuscleWithMotorFunction?: MotorLevel): CheckAISResult => {
  let variable = false;
  for (const m of motorLevel.split(',')) {
    const index = m === 'INT' || m === 'INT*' ? SensoryLevels.indexOf('S4_5') : SensoryLevels.indexOf(m.replace('*', '') as SensoryLevel) + 4;

    const startingIndex = startingMotorIndex(index);

    for (let i = startingIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      if (motor[level] === '0**') {
        variable = true;
      }
      if (motor[level] !== '0' || level === lowestNonKeyMuscleWithMotorFunction) {
        return {
          result: true,
          variable,
        };
      }
    }
  }
  return {
    result: variable,
    variable,
  };
}

export const canBeMotorIncomplete = (exam: Exam, neurologicalLevels: NeurologicalLevels): CheckAISResult => {
  const result: CheckAISResult = {
    result: false,
    variable: false,
  };

  if (motorFunctionCanBePreserved(exam)) {
    result.result = true;
    return result;
  }

  const isSensoryPreservedResult = isSensoryPreserved(exam);
  if (isSensoryPreservedResult.result) {
    const rightMotorFunctionResult = canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight, exam.right.lowestNonKeyMuscleWithMotorFunction);
    const leftMotorFunctionResult = canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft, exam.left.lowestNonKeyMuscleWithMotorFunction);
    if (rightMotorFunctionResult.result || leftMotorFunctionResult.result) {
      result.result = true;
      if (rightMotorFunctionResult.variable || leftMotorFunctionResult.variable) {
        result.variable = true;
      }
    }
  }
  return result;
}

export const determineASIAImpairmentScale = (exam: Exam, injuryComplete: InjuryComplete, neurologicalLevels: NeurologicalLevels, neurologicalLevelOfInjury: string): string => {
  // check isNormal because description of canBeMotorIncompleteD overlaps on canBeNormal
  if (neurologicalLevelOfInjury === 'INT' && exam.voluntaryAnalContraction !== 'No') {
    return 'E';
  } else if (neurologicalLevelOfInjury === 'INT*' && exam.voluntaryAnalContraction !== 'No') {
    return 'E*';
  } else {
    const possibleASIAImpairmentScales: string[] = [];

    const resultA = checkASIAImpairmentScaleA(injuryComplete);
    if (resultA) {
      possibleASIAImpairmentScales.push(resultA);
    }

    const resultB = checkASIAImpairmentScaleB(exam, neurologicalLevels);
    if (resultB) {
      possibleASIAImpairmentScales.push(resultB);
    }

    const canBeMotorIncompleteResult = canBeMotorIncomplete(exam, neurologicalLevels);
    if (canBeMotorIncompleteResult.result) {
      const resultC = checkASIAImpairmentScaleC(exam, neurologicalLevelOfInjury, canBeMotorIncompleteResult);
      if (resultC) {
        possibleASIAImpairmentScales.push(resultC);
      }

      const resultD = checkASIAImpairmentScaleD(exam, neurologicalLevelOfInjury, canBeMotorIncompleteResult);
      if (resultD) {
        possibleASIAImpairmentScales.push(resultD);
      }
    }

    const resultE = checkASIAImpairmentScaleE(neurologicalLevelOfInjury, exam.voluntaryAnalContraction);
    if (resultE) {
      possibleASIAImpairmentScales.push(resultE);
    }

    return possibleASIAImpairmentScales.join(',');
  }
}