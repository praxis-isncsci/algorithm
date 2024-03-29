import {Exam, NeurologicalLevels, ZoneOfPartialPreservations} from '../../interfaces';
import {determineSensoryZPP} from "./sensoryZPP";
import {determineMotorZPP} from './motorZPP';

export const determineZoneOfPartialPreservations = (exam: Exam, ASIAImpairmentScale: string, neurologicalLevels: NeurologicalLevels): ZoneOfPartialPreservations => {
  const sensoryRight = determineSensoryZPP(exam.right, exam.deepAnalPressure);
  const sensoryLeft = determineSensoryZPP(exam.left, exam.deepAnalPressure);
  const motorRight = determineMotorZPP(exam.right, exam.voluntaryAnalContraction, ASIAImpairmentScale, neurologicalLevels.motorRight);
  const motorLeft = determineMotorZPP(exam.left, exam.voluntaryAnalContraction, ASIAImpairmentScale, neurologicalLevels.motorLeft);
  return {sensoryRight, sensoryLeft, motorRight, motorLeft};
}
