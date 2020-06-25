import { Exam, NeurologicalLevels } from '../../interfaces';
import { determineSensoryLevel } from "./sensoryLevel";
import { determineMotorLevel } from './motorLevel';

export const determineNeurologicalLevels = (exam: Exam): NeurologicalLevels => {
  const sensoryRight = determineSensoryLevel(exam.right);
  const sensoryLeft = determineSensoryLevel(exam.left);
  const motorRight = determineMotorLevel(exam.right, exam.voluntaryAnalContraction);
  const motorLeft = determineMotorLevel(exam.left, exam.voluntaryAnalContraction);
  return { sensoryRight, sensoryLeft, motorRight, motorLeft };
}