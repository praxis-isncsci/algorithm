import { Exam, InjuryComplete } from "../../interfaces";
import { canBeAbsentSensory } from "../common";

export const determineInjuryComplete = (exam: Exam): InjuryComplete => {
  const allS4_5Values = [
    exam.right.lightTouch.S4_5,
    exam.right.pinPrick.S4_5,
    exam.left.lightTouch.S4_5,
    exam.left.pinPrick.S4_5
  ];

  if (exam.voluntaryAnalContraction === 'No' && exam.deepAnalPressure === 'No') {
    if (allS4_5Values.every(v => v === '0')) {
      return 'C';
    } else if (allS4_5Values.every(v => ['0','0*'].includes(v))){
      return 'C*,I*';
    } else if (allS4_5Values.every(v => ['0','0**'].includes(v))) {
      return 'I*';
    }
  }

  if (
    exam.voluntaryAnalContraction !== 'Yes' &&
    exam.deepAnalPressure !== 'Yes' &&
    allS4_5Values.every(canBeAbsentSensory)
  ) {
    return 'C,I';
  } else {
    return 'I';
  }
}