import { MotorMuscleValue, Exam, Motor, SensoryLevel, SensoryLevels, MotorLevels, NeurologicalLevels, MotorLevel } from "../../../interfaces";
import { CheckAISResult, isSensoryPreserved, startingMotorIndex } from "../common";

/**
 * ```!['0', 'NT', 'NT*', '0*'].includes(value)```
 */
const canBeNoPreservedMotor = (value: MotorMuscleValue): boolean => !['0', 'NT', 'NT*', '0*'].includes(value);

const canHaveNoMotorFunctionMoreThanThreeLevelsBelow = (motor: Motor, motorLevel: string, lowestNonKeyMuscleWithMotorFunction?: MotorLevel): CheckAISResult => {
  let variable = false;
  for (const m of motorLevel.split(',')) {
    const index = SensoryLevels.indexOf(m.replace('*', '') as SensoryLevel) + 4;

    const startingIndex = startingMotorIndex(index);

    let thereCanBeNoMotorFunction = true;
    for (let i = startingIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      if (motor[level] === '0*' || motor[level] === '0**') {
        variable = true;
      }
      if (canBeNoPreservedMotor(motor[level]) || level === lowestNonKeyMuscleWithMotorFunction) {
        thereCanBeNoMotorFunction = false;
        if (motor[level] === '0*') {
          variable = true;
        }
        break;
      }
    }
    if (thereCanBeNoMotorFunction) {
      return {
        result: true,
        variable,
      };
    }
  }
  return {
    result: false,
    variable: false,
  };
}

const motorCanBeNotPreserved = (exam: Exam, neurologicalLevels: NeurologicalLevels): CheckAISResult => {
  const leftMotorFunctionResult = canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.left.motor, neurologicalLevels.motorLeft, exam.left.lowestNonKeyMuscleWithMotorFunction );
  const rightMotorFunctionResult = canHaveNoMotorFunctionMoreThanThreeLevelsBelow(exam.right.motor, neurologicalLevels.motorRight, exam.right.lowestNonKeyMuscleWithMotorFunction);
  return {
    result: exam.voluntaryAnalContraction !== 'Yes' &&
      rightMotorFunctionResult.result &&
      leftMotorFunctionResult.result,
    variable: exam.voluntaryAnalContraction === 'No' &&
      (leftMotorFunctionResult.variable || rightMotorFunctionResult.variable),
  };
}

/**
 * Check AIS can be B i.e. Is injury Motor Complete?
 */
export const canBeSensoryIncomplete = (exam: Exam, neurologicalLevels: NeurologicalLevels): CheckAISResult => {
  const isSensoryPreservedResult = isSensoryPreserved(exam);
  const motorCanBeNotPreservedResult = motorCanBeNotPreserved(exam, neurologicalLevels);
  return {
    result: isSensoryPreservedResult.result && motorCanBeNotPreservedResult.result,
    variable: isSensoryPreservedResult.variable || motorCanBeNotPreservedResult.variable,
  };
}

export const checkASIAImpairmentScaleB = (exam: Exam, neurologicalLevels: NeurologicalLevels): 'B' | 'B*' | undefined => {
  const canBeSensoryIncompleteResult = canBeSensoryIncomplete(exam, neurologicalLevels);
  if (canBeSensoryIncompleteResult.result) {
    if (canBeSensoryIncompleteResult.variable) {
      return 'B*';
    } else {
      return 'B';
    }
  }
}