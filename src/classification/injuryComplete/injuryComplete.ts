import { Exam, InjuryComplete } from "../../interfaces";
import { canBeAbsentSensory } from "../common";

export const determineInjuryComplete = (exam: Exam): InjuryComplete => {
  const rightLightTouchCanBeAbsent = canBeAbsentSensory(exam.right.lightTouch.S4_5);
  const rightPinPrickCanBeAbsent = canBeAbsentSensory(exam.right.pinPrick.S4_5);
  const leftLightTouchCanBeAbsent = canBeAbsentSensory(exam.left.lightTouch.S4_5);
  const leftPinPrickCanBeAbsent = canBeAbsentSensory(exam.left.pinPrick.S4_5);

  if (
    exam.voluntaryAnalContraction !== 'Yes' && exam.deepAnalPressure !== 'Yes' &&
    rightLightTouchCanBeAbsent && rightPinPrickCanBeAbsent &&
    leftLightTouchCanBeAbsent && leftPinPrickCanBeAbsent
  ) {
    if (
      exam.voluntaryAnalContraction === 'No' && exam.deepAnalPressure === 'No'
    ) {
      if ([
        exam.right.lightTouch.S4_5,
        exam.right.pinPrick.S4_5,
        exam.left.lightTouch.S4_5,
        exam.left.pinPrick.S4_5
      ].every(v => v === '0')) {
        return 'C';
      } else if ([
        exam.right.lightTouch.S4_5,
        exam.right.pinPrick.S4_5,
        exam.left.lightTouch.S4_5,
        exam.left.pinPrick.S4_5
      ].every(v => ['0','0*'].includes(v))){
        return 'C*,I*';
      }
    }
    return 'C,I';
  } else {
    // return 'I';
    if (exam.voluntaryAnalContraction === 'No' && exam.deepAnalPressure === 'No' && [
      exam.right.lightTouch.S4_5,
      exam.right.pinPrick.S4_5,
      exam.left.lightTouch.S4_5,
      exam.left.pinPrick.S4_5
    ].every(v => ['0','0**'].includes(v))) {
      return 'I*';
    } else {
      return 'I';
    }
  }
}