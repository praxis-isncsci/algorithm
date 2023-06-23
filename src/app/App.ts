import ISNCSCI from "../ISNCSCI";
import {Exam, MotorLevel, SensoryLevels} from "../interfaces";

import testCases from './data/2019';

import '../ui/zpp-tester';
import {mapExam, Test} from "./data/helper";
import { ExamSide } from "../../cjs/interfaces";

function getExam(id: number, testCases: Test[]) {
  const test = testCases.find(test => test.id === id);

  if (!test) {
    throw new Error(`Test ${id} was not found`);
  }

  return mapExam(test);
}

export class App {
  private updateValues(side: ExamSide, motorLevel: string, element: HTMLElement): void {
    SensoryLevels.forEach((level) => {
      if (level === 'C1') {
        return;
      }

      const motor = ['C5', 'C6', 'C7', 'C8', 'T1', 'L2', 'L3', 'L4', 'L5', 'S1'].includes(level) ? level as MotorLevel : null;

      element.setAttribute(`${level}-light-touch`, side.lightTouch[level]);
      element.setAttribute(`${level}-pin-prick`, side.pinPrick[level]);

      if (motor) {
        element.setAttribute(`${level}-motor`, side.motor[motor]);
      }
    });

    element.setAttribute('motor-level', motorLevel);
  }

  public run(): void {
    const exam: Exam = getExam(121, testCases);
    const isncsci = new ISNCSCI(exam);

    console.log(isncsci.classification.neurologicalLevels);

    /* *** UI ******************************************************* */
    const zppTesterRight = document.querySelector('zpp-tester[right]');
    const zppTesterLeft = document.querySelector('zpp-tester[left]');

    if (!zppTesterLeft || !zppTesterRight) {
      throw new Error('Missing UI components');
    }

    this.updateValues(exam.right, isncsci.classification.neurologicalLevels.motorRight, zppTesterRight as HTMLElement);
    this.updateValues(exam.left, isncsci.classification.neurologicalLevels.motorLeft, zppTesterLeft as HTMLElement);
  }
}
