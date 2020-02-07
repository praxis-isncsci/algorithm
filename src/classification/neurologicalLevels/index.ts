import { Exam, NeurologicalLevels } from '../../interfaces';
import { determineSensoryLevel } from "./sensoryLevel";
import { determineMotorLevel } from './motorLevel';

export const determineNeurologicalLevels = (exam: Exam): NeurologicalLevels => {
  const sensoryRight = determineSensoryLevel(exam.right);
  const sensoryLeft = determineSensoryLevel(exam.left);
  const motorRight = determineMotorLevel(exam.right);
  const motorLeft = determineMotorLevel(exam.left);
  return { sensoryRight, sensoryLeft, motorRight, motorLeft };
}