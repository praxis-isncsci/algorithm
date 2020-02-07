import { levelIsBetween } from "../common";
import { Exam, InjuryComplete, Motor, MotorMuscleValue, MotorLevels, NeurologicalLevels, SensoryLevel, SensoryLevels } from "../../interfaces";

const startingMotorIndex = (sensoryIndex: number): number => {
  return levelIsBetween(sensoryIndex, 'C2', 'C4') ? 0 :
    levelIsBetween(sensoryIndex, 'C5', 'T1') ? sensoryIndex - 4 :
      levelIsBetween(sensoryIndex, 'T2', 'L1') ? 5 :
        levelIsBetween(sensoryIndex, 'L2', 'S1') ? sensoryIndex - 16 : MotorLevels.length;
}
const canBeNoPreservedMotor = (value: MotorMuscleValue): boolean => !['0', 'NT', 'NT*', '0*'].includes(value);
const canBePreservedMotor = (value: MotorMuscleValue): boolean => value !== '0';

const isSensoryPreserved = (exam: Exam): boolean => {
  return exam.deepAnalPressure !== 'No' ||
  exam.right.lightTouch.S4_5 !== '0' || exam.right.pinPrick.S4_5 !== '0' ||
  exam.left.lightTouch.S4_5 !== '0' || exam.left.pinPrick.S4_5 !== '0'
}

const canHaveNoMotorFunctionMoreThanThreeLevelsBelow = (motor: Motor, motorLevel: string): boolean => {
  for (const m of motorLevel.split(',')) {
    const index = SensoryLevels.indexOf(m.replace('*', '') as SensoryLevel) + 4;

    const startingIndex = startingMotorIndex(index);

    let thereCanBeNoMotorFunction = true;
    for (let i = startingIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      if (canBeNoPreservedMotor(motor[level])) {
        thereCanBeNoMotorFunction = false;
        break;
      }
    }
    if (thereCanBeNoMotorFunction) {
      return true;
    }
  }
  return false;
}

const motorCanBeNotPreserved = (exam: Exam, neurologicalLevels: NeurologicalLevels): boolean => {
  return exam.voluntaryAnalContraction !== 'Yes' &&
    canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight) &&
    canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft)
}

export const canBeInjuryComplete = (injuryComplete: InjuryComplete): boolean => injuryComplete === 'C' || injuryComplete === 'C,I';

/**
 * Check AIS can be B i.e. Is injury Motor Complete?
 */
export const canBeSensoryIncomplete = (exam: Exam, neurologicalLevels: NeurologicalLevels): boolean => {
  return isSensoryPreserved(exam) && motorCanBeNotPreserved(exam, neurologicalLevels);
}

/**
 * exam.voluntaryAnalContraction !== 'No'
 */
const motorFunctionCanBePreserved = (exam: Exam): boolean => exam.voluntaryAnalContraction !== 'No';

const canHaveMuscleGradeLessThan3 = (value: MotorMuscleValue): boolean  => ['0', '1', '2', '0*', '1*', '2*', 'NT', 'NT*'].includes(value);

/**
 * Means in other words more than half of key muscles below NLI can have MuscleGradeLessThan3
 */
const canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = (exam: Exam, neurologicalLevelOfInjury: string): boolean => {
  for (const nli of neurologicalLevelOfInjury.replace(/\*/g, '').split(',')) {
    const indexOfNLI = SensoryLevels.indexOf(nli as SensoryLevel);
    const startIndex = startingMotorIndex(indexOfNLI + 1);

    const half = MotorLevels.length - startIndex;
    let count = 0;
    for (let i = startIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      count += canHaveMuscleGradeLessThan3(exam.left.motor[level]) ? 1 : 0;
      count += canHaveMuscleGradeLessThan3(exam.right.motor[level]) ? 1 : 0;
      if (count > half) {
        return true;
      }
    }
  }
  return false;
}

const canHaveMotorFunctionMoreThanThreeLevelsBelow = (motor: Motor, motorLevel: string): boolean => {
  for (const m of motorLevel.split(',')) {
    const index = SensoryLevels.indexOf(m.replace('*', '') as SensoryLevel) + 4;

    const startingIndex = startingMotorIndex(index);

    for (let i = startingIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      if (canBePreservedMotor(motor[level])) {
        return true;
      }
    }
  }
  return false;
}

export const canBeMotorIncomplete = (exam: Exam, neurologicalLevels: NeurologicalLevels): boolean => {
  return (
    motorFunctionCanBePreserved(exam) || (
      isSensoryPreserved(exam) && (
        canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight) ||
        canHaveMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft)
      )
    ))
}

const canHaveMuscleGradeAtLeast3 = (value: MotorMuscleValue): boolean  => !['0', '1', '2'].includes(value);

const canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = (exam: Exam, neurologicalLevelOfInjury: string): boolean => {
  for (const nli of neurologicalLevelOfInjury.replace(/\*/g, '').split(',')) {
    const indexOfNLI = SensoryLevels.indexOf(nli as SensoryLevel);
    const startIndex = startingMotorIndex(indexOfNLI + 1);

    const half = MotorLevels.length - startIndex;
    if (half === 0) {
      return true;
    }
    let count = 0;
    for (let i = startIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      count += canHaveMuscleGradeAtLeast3(exam.left.motor[level]) ? 1 : 0;
      count += canHaveMuscleGradeAtLeast3(exam.right.motor[level]) ? 1 : 0;
      if (count >= half) {
        return true;
      }
    }
  }
  return false;
}

export const canBeNormal = (neurologicalLevels: NeurologicalLevels): boolean => {
  return neurologicalLevels.motorLeft.includes('INT') &&
    neurologicalLevels.motorRight.includes('INT') &&
    neurologicalLevels.sensoryLeft.includes('INT') &&
    neurologicalLevels.sensoryRight.includes('INT');
}

export const determineASIAImpairmentScale = (exam: Exam, injuryComplete: InjuryComplete, neurologicalLevels: NeurologicalLevels, neurologicalLevelOfInjury: string): string => {
  // check isNormal because description of canBeMotorIncompleteD overlaps on canBeNormal
  if (neurologicalLevelOfInjury === 'INT') {
    return 'E';
  } else if (neurologicalLevelOfInjury === 'INT*') {
    return 'E*';
  } else {
    const possibleASIAImpairmentScales: string[] = [];
    if (canBeInjuryComplete(injuryComplete)) {
      possibleASIAImpairmentScales.push('A');
    }
    if (canBeSensoryIncomplete(exam, neurologicalLevels)) {
      possibleASIAImpairmentScales.push('B');
    }
    if (canBeMotorIncomplete(exam, neurologicalLevels)) {
      if (canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury)) {
        possibleASIAImpairmentScales.push('C');
      }
      if (canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury)) {
        possibleASIAImpairmentScales.push('D');
      }
    }
    if (neurologicalLevelOfInjury.includes('INT')) {
      possibleASIAImpairmentScales.push('E');
    } else if (neurologicalLevelOfInjury.includes('INT*')) {
      possibleASIAImpairmentScales.push('E*');
    }
    return possibleASIAImpairmentScales.join(',');
  }
}