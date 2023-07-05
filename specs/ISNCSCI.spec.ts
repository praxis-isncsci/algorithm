import testCases from './2019.json';
import { Test, mapExam } from './helper';

describe('Isncsci Algorithm rev2019 ::', () => {
  testCases
    // .filter(t => t.id >= 1 && t.id < 120) // for debugging specific test case
    // .filter(t => t.id === 121) // for debugging specific test case
    // .filter(t => [54, 34, 112, 84].includes(t.id)) // for debugging specific test case
    .forEach((testCase) => {
      describe(`Test case ${testCase.id}`, () => {
        const exam = mapExam(testCase as Test);
        const expected = testCase.totals;
        describe('Classification', () => {
          it(`right sensory level`, () => {
            expect(exam.classification.neurologicalLevels.sensoryRight).toBe(expected.rightSensory);
          })
          it(`left sensory level`, () => {
            expect(exam.classification.neurologicalLevels.sensoryLeft).toBe(expected.leftSensory);
          })
          it(`right motor level`, () => {
            expect(exam.classification.neurologicalLevels.motorRight).toBe(expected.rightMotor);
          })
          it(`left motor level`, () => {
            expect(exam.classification.neurologicalLevels.motorLeft).toBe(expected.leftMotor);
          })
          it(`Neurological Level Of Injury`, () => {
            expect(exam.classification.neurologicalLevelOfInjury).toBe(expected.neurologicalLevelOfInjury);
          })
          it(`Injury Complete`, () => {
            expect(exam.classification.injuryComplete).toBe(expected.injuryComplete);
          })
          it(`ASIA Impairment Scale`, () => {
            expect(exam.classification.ASIAImpairmentScale).toBe(expected.asiaImpairmentScale);
          })
          it(`right sensory ZPP`, () => {
            expect(exam.classification.zoneOfPartialPreservations.sensoryRight).toBe(expected.rightSensoryZpp);
          })
          it(`left sensory ZPP`, () => {
            expect(exam.classification.zoneOfPartialPreservations.sensoryLeft).toBe(expected.leftSensoryZpp);
          })
          it(`right motor ZPP`, () => {
            expect(exam.classification.zoneOfPartialPreservations.motorRight).toBe(expected.rightMotorZpp);
          })
          it(`left motor ZPP`, () => {
            expect(exam.classification.zoneOfPartialPreservations.motorLeft).toBe(expected.leftMotorZpp);
          })
        })
        describe('Totals', () => {
          it(`left.motor (leftMotorTotal)`, () => {
            expect(exam.totals.left.motor).toBe(expected.leftMotorTotal);
          })
          it(`left.pinPrick (leftPrickTotal)`, () => {
            expect(exam.totals.left.pinPrick).toBe(expected.leftPrickTotal);
          })
          it(`left.lightTouch (leftTouchTotal)`, () => {
            expect(exam.totals.left.lightTouch).toBe(expected.leftTouchTotal);
          })
          it(`left.lowerExtremity (leftLowerMotorTotal)`, () => {
            expect(exam.totals.left.lowerExtremity).toBe(expected.leftLowerMotorTotal);
          })
          it(`left.upperExtremity (leftUpperMotorTotal)`, () => {
            expect(exam.totals.left.upperExtremity).toBe(expected.leftUpperMotorTotal);
          })
          it(`right.motor (rightMotorTotal)`, () => {
            expect(exam.totals.right.motor).toBe(expected.rightMotorTotal);
          })
          it(`right.pinPrick (rightPrickTotal)`, () => {
            expect(exam.totals.right.pinPrick).toBe(expected.rightPrickTotal);
          })
          it(`right.lightTouch (rightTouchTotal)`, () => {
            expect(exam.totals.right.lightTouch).toBe(expected.rightTouchTotal);
          })
          it(`right.lowerExtremity (rightLowerMotorTotal)`, () => {
            expect(exam.totals.right.lowerExtremity).toBe(expected.rightLowerMotorTotal);
          })
          it(`right.upperExtremity (rightUpperMotorTotal)`, () => {
            expect(exam.totals.right.upperExtremity).toBe(expected.rightUpperMotorTotal);
          })
          it(`pinPrick (prickTotal)`, () => {
            expect(exam.totals.pinPrick).toBe(expected.prickTotal);
          })
          it(`upperExtremity (upperMotorTotal)`, () => {
            expect(exam.totals.upperExtremity).toBe(expected.upperMotorTotal);
          })
          it(`lowerExtremity (lowerMotorTotal)`, () => {
            expect(exam.totals.lowerExtremity).toBe(expected.lowerMotorTotal);
          })
          it(`lightTouch (touchTotal)`, () => {
            expect(exam.totals.lightTouch).toBe(expected.touchTotal);
          })
        })
      })
    })
})
