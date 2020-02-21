import { MotorMuscleValue, SensoryLevel, SensoryLevels, MotorLevels, Exam } from "../../../interfaces";
import { startingMotorIndex, CheckAISResult } from "../common";

/**
 * ```!['0', '1', '2'].includes(value)```
 */
const canHaveMuscleGradeAtLeast3 = (value: MotorMuscleValue): boolean  => !['0', '1', '2'].includes(value);

/**
 * ```['0*', '1*', '2*', '0**', '1**', '2**'].includes(value)```
 */
const canHaveVariableMuscleGradeAtLeast3 = (value: MotorMuscleValue): boolean  => ['0*', '1*', '2*', '0**', '1**', '2**'].includes(value);

const canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = (exam: Exam, neurologicalLevelOfInjury: string): CheckAISResult => {
  const result = {
    result: false,
    variable: false,
  };
  for (const nli of neurologicalLevelOfInjury.replace(/\*/g, '').split(',')) {
    const indexOfNLI = SensoryLevels.indexOf(nli as SensoryLevel);
    const startIndex = startingMotorIndex(indexOfNLI + 1);

    const half = MotorLevels.length - startIndex;
    if (half === 0) {
      return {
        result: true,
        variable: false,
      };
    }
    let count = 0;
    let variableCount = 0;
    for (let i = startIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];
      count += canHaveMuscleGradeAtLeast3(exam.left.motor[level]) ? 1 : 0;
      count += canHaveMuscleGradeAtLeast3(exam.right.motor[level]) ? 1 : 0;
      variableCount += canHaveVariableMuscleGradeAtLeast3(exam.left.motor[level]) ? 1 : 0;
      variableCount += canHaveVariableMuscleGradeAtLeast3(exam.right.motor[level]) ? 1 : 0;
      if (count - variableCount >= half) {
        return {
          result: true,
          variable: false,
        };
      }
    }
    if (count >= half) {
      result.result = true;
      result.variable = result.variable || count - variableCount < half;
    }
  }
  return result;
}

export const checkASIAImpairmentScaleD = (exam: Exam, neurologicalLevelOfInjury: string, canBeMotorIncompleteResult: CheckAISResult): 'D' | 'D*' | undefined => {
  const motorFunctionD = canHaveAtLeastHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury);
  if (motorFunctionD.result) {
    if (motorFunctionD.variable || canBeMotorIncompleteResult.variable) {
      return 'D*';
    } else {
      return 'D';
    }
  }
}