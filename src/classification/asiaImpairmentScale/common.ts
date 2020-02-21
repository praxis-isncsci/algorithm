import { levelIsBetween } from "../common";
import { MotorLevels, Exam } from "../../interfaces";

export type CheckAISResult = {result: boolean; variable: boolean};

export const startingMotorIndex = (sensoryIndex: number): number => {
  return levelIsBetween(sensoryIndex, 'C2', 'C4') ? 0 :
    levelIsBetween(sensoryIndex, 'C5', 'T1') ? sensoryIndex - 4 :
      levelIsBetween(sensoryIndex, 'T2', 'L1') ? 5 :
        levelIsBetween(sensoryIndex, 'L2', 'S1') ? sensoryIndex - 16 : MotorLevels.length;
}

export const isSensoryPreserved = (exam: Exam): CheckAISResult => {
  const sensoryAtS45 = [
    exam.right.lightTouch.S4_5,
    exam.right.pinPrick.S4_5,
    exam.left.lightTouch.S4_5,
    exam.left.pinPrick.S4_5,
  ];
  return {
    result: exam.deepAnalPressure !== 'No' ||
      exam.right.lightTouch.S4_5 !== '0' || exam.right.pinPrick.S4_5 !== '0' ||
      exam.left.lightTouch.S4_5 !== '0' || exam.left.pinPrick.S4_5 !== '0',
    variable: exam.deepAnalPressure === 'No' && !sensoryAtS45.every(v => v === '0') && sensoryAtS45.every(v => ['0', '0*', '0**'].includes(v)),
  };
}