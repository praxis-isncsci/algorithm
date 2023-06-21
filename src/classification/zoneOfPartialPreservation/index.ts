import { Exam, ZoneOfPartialPreservations } from '../../interfaces';
import { determineSensoryZPP } from "./sensoryZPP";
import { determineMotorZPP } from './motorZPP';
import {determineMotorZPP as determineMotorZPP2} from '../../isncsci-for-training/motorZPP';
import { NeurologicalLevels } from '../../../cjs/interfaces';

export const determineZoneOfPartialPreservations = (exam: Exam, ASIAImpairmentScale: string, neurologicalLevels: NeurologicalLevels): ZoneOfPartialPreservations => {
  const sensoryRight = determineSensoryZPP(exam.right, exam.deepAnalPressure);
  const sensoryLeft = determineSensoryZPP(exam.left, exam.deepAnalPressure);
  const motorRight = determineMotorZPP2(exam.right, exam.voluntaryAnalContraction, ASIAImpairmentScale, neurologicalLevels.motorRight);
  const motorLeft = determineMotorZPP(exam.left, exam.voluntaryAnalContraction, ASIAImpairmentScale);
  return {sensoryRight, sensoryLeft, motorRight, motorLeft};
}