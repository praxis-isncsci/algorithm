import testCases from './2019_dj_fix.json';
import { Test, mapExam } from './helper';

const badNT = [47];
const badZPP = [34, 54]; // Bad NT cases; wrong left motor ZPP
const badNLI = [89, 91, 95]; // Bad star cases; wrong NLI
const badTests = [...badNT, ...badZPP, ...badNLI];

describe('Isncsci Algorithm rev2019 ::', () => {
  for (const id of badTests) {
    xit(`skip bad test ${id}`, () => {/**/})
  }
  testCases
    // .filter(t => !badTests.includes(t.id))
    // .filter(t => t.id === 61)
    .forEach((testCase) => {
      describe(`Test case ${testCase.id}`, () => {
        const exam = mapExam(testCase as Test);
        const expected = testCase.totals;
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
        it(`Injury Complete`, () => {
          expect(exam.classification.injuryComplete).toBe(expected.injuryComplete);
        })
        it(`Neurological Level Of Injury`, () => {
          expect(exam.classification.neurologicalLevelOfInjury).toBe(expected.neurologicalLevelOfInjury);
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
        xit(`totals`, () => {
          expect(exam.totals.left.motor).toBe(expected.leftMotorTotal);
          expect(exam.totals.left.pinPrick).toBe(expected.leftPrickTotal);
          expect(exam.totals.left.lightTouch).toBe(expected.leftTouchTotal);
          expect(exam.totals.left.lowerExtremity).toBe(expected.leftLowerMotorTotal);
          expect(exam.totals.left.upperExtremity).toBe(expected.leftUpperMotorTotal);
          expect(exam.totals.right.motor).toBe(expected.rightMotorTotal);
          expect(exam.totals.right.pinPrick).toBe(expected.rightPrickTotal);
          expect(exam.totals.right.lightTouch).toBe(expected.rightTouchTotal);
          expect(exam.totals.right.lowerExtremity).toBe(expected.rightLowerMotorTotal);
          expect(exam.totals.right.upperExtremity).toBe(expected.rightUpperMotorTotal);

          expect(exam.totals.pinPrick).toBe(expected.prickTotal);
          expect(exam.totals.upperExtremity).toBe(expected.upperMotorTotal);
          expect(exam.totals.lowerExtremity).toBe(expected.lowerMotorTotal);
          expect(exam.totals.lightTouch).toBe(expected.touchTotal);
        })
      })
    })
})
