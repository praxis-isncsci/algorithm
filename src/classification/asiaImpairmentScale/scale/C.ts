import { MotorMuscleValue, SensoryLevel, SensoryLevels, MotorLevels, Exam } from "../../../interfaces";
import { startingMotorIndex, CheckAISResult } from "../common";
import { removeStars } from '../../helper';
import { determineNeurologicalLevelOfInjury } from "../../neurologicalLevelOfInjury/neurologicalLevelOfInjury";

const canHaveMuscleGradeLessThan3 = (value: MotorMuscleValue): boolean  => ['0', '1', '2', 'NT', 'NT*'].includes(value);
const canHaveVariableMuscleGradeLessThan3 = (value: MotorMuscleValue): boolean  => ['0*', '1*', '2*'].includes(value);

/**
 * Means in other words more than half of key muscles below NLI can have MuscleGradeLessThan3
 */
const canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3 = (exam: Exam, neurologicalLevelOfInjury: string): CheckAISResult => {
  for (const nli of neurologicalLevelOfInjury.replace(/\*/g, '').split(',')) {
    const indexOfNLI = nli === 'INT' || nli === 'INT*' ? SensoryLevels.indexOf('S4_5') : SensoryLevels.indexOf(nli as SensoryLevel);
    const startIndex = startingMotorIndex(indexOfNLI + 1);

    const half = MotorLevels.length - startIndex;
    let count = 0;
    let variableCount = 0;
    for (let i = startIndex; i < MotorLevels.length; i++) {
      const level = MotorLevels[i];

      if (canHaveMuscleGradeLessThan3(exam.left.motor[level])) {
        count++;
      } else if (canHaveVariableMuscleGradeLessThan3(exam.left.motor[level])) {
        count++;
        variableCount++;
      }
      if (canHaveMuscleGradeLessThan3(exam.right.motor[level])) {
        count++;
      } else if (canHaveVariableMuscleGradeLessThan3(exam.right.motor[level])) {
        count++;
        variableCount++;
      }
      if (count - variableCount > half) {
        return {
          result: true,
          variable: false,
        };
      }
    }
    if (count > half && count - variableCount <= half) {
      return {
        result: true,
        variable: true,
      };
    }
  }
  return {
    result: false,
    variable: false,
  };
}

export const checkASIAImpairmentScaleC = (exam: Exam, neurologicalLevelOfInjury: string, canBeMotorIncompleteResult: CheckAISResult): 'C' | 'C*' | undefined  => {
  const examWithStarsRemoved = removeStars(exam);
  const nliWithStarsRemoved  = determineNeurologicalLevelOfInjury(examWithStarsRemoved);
  const motorFunctionCWithStarsRemoved = canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(examWithStarsRemoved, nliWithStarsRemoved);
  const motorFunctionC = canHaveLessThanHalfOfKeyMuscleFunctionsBelowNLIHaveMuscleGradeAtLeast3(exam, neurologicalLevelOfInjury);
  if (motorFunctionC.result) {
    if (motorFunctionC.variable || canBeMotorIncompleteResult.variable || !motorFunctionCWithStarsRemoved.result) {
      return 'C*';
    } else {
      return 'C';
    }
  }
}