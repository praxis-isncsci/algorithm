import ISNCSCI from "../ISNCSCI";
import {Exam, MotorLevel, SensoryLevels} from "../interfaces";
import testCases from './data/2019';

import '../ui/zpp-tester';
import {mapExam, Test} from "./data/helper";
import { ExamSide } from "../../cjs/interfaces";
import type {Step, SideLevel, State} from "../isncsci-for-training/motorZPP";
import {startCheckIfMotorZPPIsApplicable} from "../isncsci-for-training/motorZPP";

function getExam(id: number, testCases: Test[]) {
  const test = testCases.find(test => test.id === id);

  if (!test) {
    throw new Error(`Test ${id} was not found`);
  }

  return mapExam(test);
}

export class App {
  private currentStep: Step | null = null;
  private steps: HTMLOListElement | null = null;
  private zppTesterRight: HTMLElement | null | undefined = null;

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

  public run(examId = 1): void {
    const exam: Exam = getExam(examId, testCases);
    const isncsci = new ISNCSCI(exam);

    const c1: SideLevel = {
      name: 'C1',
      lightTouch: '2',
      pinPrick: '2',
      motor: null,
      ordinal: 0,
      next: null,
      previous: null,
    };

    this.currentStep = {
      description: 'Start',
      action: '',
      state: {
        motorLevel: isncsci.classification.neurologicalLevels.motorRight,
        voluntaryAnalContraction: exam.voluntaryAnalContraction,
        zpp: [],
        topLevel: c1,
        bottomLevel: c1,
        currentLevel: null,
        side: exam.right,
      },
      next: startCheckIfMotorZPPIsApplicable,
    };

    console.log(isncsci.classification.neurologicalLevels);

    /* *** UI ******************************************************* */
    this.zppTesterRight = document.querySelector('zpp-tester[right]') as HTMLElement;
    const zppTesterLeft = document.querySelector('zpp-tester[left]');
    const vac = document.querySelector('[vac]');
    const dap = document.querySelector('[dap]');
    const rightNonKeyMuscle = document.querySelector('[right-non-key-muscle]');
    const leftNonKeyMuscle = document.querySelector('[left-non-key-muscle]');
    const stepsContainer = document.querySelector('[steps]');

    if (!zppTesterLeft || !this.zppTesterRight || !vac || !dap || !rightNonKeyMuscle || !leftNonKeyMuscle || !stepsContainer) {
      throw new Error('Missing UI components');
    }

    this.steps = document.createElement('OL') as HTMLOListElement;
    stepsContainer.appendChild(this.steps);

    this.updateValues(exam.right, isncsci.classification.neurologicalLevels.motorRight, this.zppTesterRight);
    this.updateValues(exam.left, isncsci.classification.neurologicalLevels.motorLeft, zppTesterLeft as HTMLElement);
    vac.textContent = exam.voluntaryAnalContraction;
    dap.textContent = exam.voluntaryAnalContraction;
    rightNonKeyMuscle.textContent = exam.right.lowestNonKeyMuscleWithMotorFunction ?? '';
    leftNonKeyMuscle.textContent = exam.left.lowestNonKeyMuscleWithMotorFunction ?? '';
  }

  public executeNextStep(): State {
    if (!this.currentStep) {
      throw new Error('No current step available');
    }

    if (this.currentStep.next) {
      this.currentStep = this.currentStep.next(this.currentStep.state);

      if (!this.steps) {
        throw new Error('Steps element is not available.');
      }

      const stepText = document.createElement('DIV');
      stepText.classList.add('description');
      stepText.textContent = this.currentStep.description;

      const actionText = document.createElement('DIV');
      actionText.classList.add('action');
      actionText.textContent = this.currentStep.action;

      const stepElement = document.createElement('LI');
      stepElement.appendChild(stepText);
      stepElement.appendChild(actionText);

      this.steps.appendChild(stepElement);

      const currentLevel = this.currentStep.state.currentLevel;
      this.zppTesterRight?.setAttribute('current-level',  currentLevel?.next ? currentLevel.next.name : '');

      if (this.currentStep.next) {
        return this.currentStep.state;
      }

      const zppElement = document.createElement('DIV');
      zppElement.classList.add('motor-zpp');
      zppElement.textContent = `Motor ZPP: [${this.currentStep.state.zpp.join()}]`;
      stepElement.appendChild(zppElement);
    }

    return this.currentStep.state;
  }
}
