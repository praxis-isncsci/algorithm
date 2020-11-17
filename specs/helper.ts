import { BinaryObservation, MotorLevel, MotorMuscleValue, SensoryPointValue } from '../src/interfaces';
import { ISNCSCI } from '../src/ISNCSCI';

export interface Test {
  "id": number;
  "group"?: string ;
  "analContraction": string;
  "analSensation": string;
  "rightLowestNonKeyMuscleWithMotorFunction"?: string;
  "leftLowestNonKeyMuscleWithMotorFunction"?: string;
  "comments"?: string;
  "c2RightTouch": string;
  "c2LeftTouch": string;
  "c2RightPrick": string;
  "c2LeftPrick": string;
  "c3RightTouch": string;
  "c3LeftTouch": string;
  "c3RightPrick": string;
  "c3LeftPrick": string;
  "c4RightTouch": string;
  "c4LeftTouch": string;
  "c4RightPrick": string;
  "c4LeftPrick": string;
  "c5RightTouch": string;
  "c5LeftTouch": string;
  "c5RightPrick": string;
  "c5LeftPrick": string;
  "c5RightMotor": string;
  "c5LeftMotor": string;
  "c6RightTouch": string;
  "c6LeftTouch": string;
  "c6RightPrick": string;
  "c6LeftPrick": string;
  "c6RightMotor": string;
  "c6LeftMotor": string;
  "c7RightTouch": string;
  "c7LeftTouch": string;
  "c7RightPrick": string;
  "c7LeftPrick": string;
  "c7RightMotor": string;
  "c7LeftMotor": string;
  "c8RightTouch": string;
  "c8LeftTouch": string;
  "c8RightPrick": string;
  "c8LeftPrick": string;
  "c8RightMotor": string;
  "c8LeftMotor": string;
  "t1RightTouch": string;
  "t1LeftTouch": string;
  "t1RightPrick": string;
  "t1LeftPrick": string;
  "t1RightMotor": string;
  "t1LeftMotor": string;
  "t2RightTouch": string;
  "t2LeftTouch": string;
  "t2RightPrick": string;
  "t2LeftPrick": string;
  "t3RightTouch": string;
  "t3LeftTouch": string;
  "t3RightPrick": string;
  "t3LeftPrick": string;
  "t4RightTouch": string;
  "t4LeftTouch": string;
  "t4RightPrick": string;
  "t4LeftPrick": string;
  "t5RightTouch": string;
  "t5LeftTouch": string;
  "t5RightPrick": string;
  "t5LeftPrick": string;
  "t6RightTouch": string;
  "t6LeftTouch": string;
  "t6RightPrick": string;
  "t6LeftPrick": string;
  "t7RightTouch": string;
  "t7LeftTouch": string;
  "t7RightPrick": string;
  "t7LeftPrick": string;
  "t8RightTouch": string;
  "t8LeftTouch": string;
  "t8RightPrick": string;
  "t8LeftPrick": string;
  "t9RightTouch": string;
  "t9LeftTouch": string;
  "t9RightPrick": string;
  "t9LeftPrick": string;
  "t10RightTouch": string;
  "t10LeftTouch": string;
  "t10RightPrick": string;
  "t10LeftPrick": string;
  "t11RightTouch": string;
  "t11LeftTouch": string;
  "t11RightPrick": string;
  "t11LeftPrick": string;
  "t12RightTouch": string;
  "t12LeftTouch": string;
  "t12RightPrick": string;
  "t12LeftPrick": string;
  "l1RightTouch": string;
  "l1LeftTouch": string;
  "l1RightPrick": string;
  "l1LeftPrick": string;
  "l2RightTouch": string;
  "l2LeftTouch": string;
  "l2RightPrick": string;
  "l2LeftPrick": string;
  "l2RightMotor": string;
  "l2LeftMotor": string;
  "l3RightTouch": string;
  "l3LeftTouch": string;
  "l3RightPrick": string;
  "l3LeftPrick": string;
  "l3RightMotor": string;
  "l3LeftMotor": string;
  "l4RightTouch": string;
  "l4LeftTouch": string;
  "l4RightPrick": string;
  "l4LeftPrick": string;
  "l4RightMotor": string;
  "l4LeftMotor": string;
  "l5RightTouch": string;
  "l5LeftTouch": string;
  "l5RightPrick": string;
  "l5LeftPrick": string;
  "l5RightMotor": string;
  "l5LeftMotor": string;
  "s1RightTouch": string;
  "s1LeftTouch": string;
  "s1RightPrick": string;
  "s1LeftPrick": string;
  "s1RightMotor": string;
  "s1LeftMotor": string;
  "s2RightTouch": string;
  "s2LeftTouch": string;
  "s2RightPrick": string;
  "s2LeftPrick": string;
  "s3RightTouch": string;
  "s3LeftTouch": string;
  "s3RightPrick": string;
  "s3LeftPrick": string;
  "s4_5RightTouch": string;
  "s4_5LeftTouch": string;
  "s4_5RightPrick": string;
  "s4_5LeftPrick": string;
  "totals": {
    "rightUpperMotorTotal": string;
    "leftUpperMotorTotal": string;
    "rightLowerMotorTotal": string;
    "leftLowerMotorTotal": string;
    "rightTouchTotal": string;
    "leftTouchTotal": string;
    "rightPrickTotal": string;
    "leftPrickTotal": string;
    "rightMotorTotal": string;
    "leftMotorTotal": string;
    "upperMotorTotal": string;
    "lowerMotorTotal": string;
    "touchTotal": string;
    "prickTotal": string;
    "rightSensory": string;
    "leftSensory": string;
    "rightMotor": string;
    "leftMotor": string;
    "neurologicalLevelOfInjury": string;
    "rightSensoryZpp": string;
    "leftSensoryZpp": string;
    "rightMotorZpp": string;
    "leftMotorZpp": string;
    "asiaImpairmentScale": string;
    "injuryComplete": string;
  };
}

export const mapExam = (testCase: Test): ISNCSCI => {
  return new ISNCSCI({
    right: {
      lowestNonKeyMuscleWithMotorFunction: testCase.rightLowestNonKeyMuscleWithMotorFunction as MotorLevel,
      motor: {
        C5: testCase.c5RightMotor as MotorMuscleValue,
        C6: testCase.c6RightMotor as MotorMuscleValue,
        C7: testCase.c7RightMotor as MotorMuscleValue,
        C8: testCase.c8RightMotor as MotorMuscleValue,
        T1: testCase.t1RightMotor as MotorMuscleValue,
        L2: testCase.l2RightMotor as MotorMuscleValue,
        L3: testCase.l3RightMotor as MotorMuscleValue,
        L4: testCase.l4RightMotor as MotorMuscleValue,
        L5: testCase.l5RightMotor as MotorMuscleValue,
        S1: testCase.s1RightMotor as MotorMuscleValue,
      },
      lightTouch: {
        C2: testCase.c2RightTouch as SensoryPointValue,
        C3: testCase.c3RightTouch as SensoryPointValue,
        C4: testCase.c4RightTouch as SensoryPointValue,
        C5: testCase.c5RightTouch as SensoryPointValue,
        C6: testCase.c6RightTouch as SensoryPointValue,
        C7: testCase.c7RightTouch as SensoryPointValue,
        C8: testCase.c8RightTouch as SensoryPointValue,
        T1: testCase.t1RightTouch as SensoryPointValue,
        T2: testCase.t2RightTouch as SensoryPointValue,
        T3: testCase.t3RightTouch as SensoryPointValue,
        T4: testCase.t4RightTouch as SensoryPointValue,
        T5: testCase.t5RightTouch as SensoryPointValue,
        T6: testCase.t6RightTouch as SensoryPointValue,
        T7: testCase.t7RightTouch as SensoryPointValue,
        T8: testCase.t8RightTouch as SensoryPointValue,
        T9: testCase.t9RightTouch as SensoryPointValue,
        T10: testCase.t10RightTouch as SensoryPointValue,
        T11: testCase.t11RightTouch as SensoryPointValue,
        T12: testCase.t12RightTouch as SensoryPointValue,
        L1: testCase.l1RightTouch as SensoryPointValue,
        L2: testCase.l2RightTouch as SensoryPointValue,
        L3: testCase.l3RightTouch as SensoryPointValue,
        L4: testCase.l4RightTouch as SensoryPointValue,
        L5: testCase.l5RightTouch as SensoryPointValue,
        S1: testCase.s1RightTouch as SensoryPointValue,
        S2: testCase.s2RightTouch as SensoryPointValue,
        S3: testCase.s3RightTouch as SensoryPointValue,
        S4_5: testCase.s4_5RightTouch as SensoryPointValue,
      },
      pinPrick: {
        C2: testCase.c2RightPrick as SensoryPointValue,
        C3: testCase.c3RightPrick as SensoryPointValue,
        C4: testCase.c4RightPrick as SensoryPointValue,
        C5: testCase.c5RightPrick as SensoryPointValue,
        C6: testCase.c6RightPrick as SensoryPointValue,
        C7: testCase.c7RightPrick as SensoryPointValue,
        C8: testCase.c8RightPrick as SensoryPointValue,
        T1: testCase.t1RightPrick as SensoryPointValue,
        T2: testCase.t2RightPrick as SensoryPointValue,
        T3: testCase.t3RightPrick as SensoryPointValue,
        T4: testCase.t4RightPrick as SensoryPointValue,
        T5: testCase.t5RightPrick as SensoryPointValue,
        T6: testCase.t6RightPrick as SensoryPointValue,
        T7: testCase.t7RightPrick as SensoryPointValue,
        T8: testCase.t8RightPrick as SensoryPointValue,
        T9: testCase.t9RightPrick as SensoryPointValue,
        T10: testCase.t10RightPrick as SensoryPointValue,
        T11: testCase.t11RightPrick as SensoryPointValue,
        T12: testCase.t12RightPrick as SensoryPointValue,
        L1: testCase.l1RightPrick as SensoryPointValue,
        L2: testCase.l2RightPrick as SensoryPointValue,
        L3: testCase.l3RightPrick as SensoryPointValue,
        L4: testCase.l4RightPrick as SensoryPointValue,
        L5: testCase.l5RightPrick as SensoryPointValue,
        S1: testCase.s1RightPrick as SensoryPointValue,
        S2: testCase.s2RightPrick as SensoryPointValue,
        S3: testCase.s3RightPrick as SensoryPointValue,
        S4_5: testCase.s4_5RightPrick as SensoryPointValue,
      }
    },
    left: {
      lowestNonKeyMuscleWithMotorFunction: testCase.leftLowestNonKeyMuscleWithMotorFunction as MotorLevel,
      motor: {
        C5: testCase.c5LeftMotor as MotorMuscleValue,
        C6: testCase.c6LeftMotor as MotorMuscleValue,
        C7: testCase.c7LeftMotor as MotorMuscleValue,
        C8: testCase.c8LeftMotor as MotorMuscleValue,
        T1: testCase.t1LeftMotor as MotorMuscleValue,
        L2: testCase.l2LeftMotor as MotorMuscleValue,
        L3: testCase.l3LeftMotor as MotorMuscleValue,
        L4: testCase.l4LeftMotor as MotorMuscleValue,
        L5: testCase.l5LeftMotor as MotorMuscleValue,
        S1: testCase.s1LeftMotor as MotorMuscleValue,
      },
      lightTouch: {
        C2: testCase.c2LeftTouch as SensoryPointValue,
        C3: testCase.c3LeftTouch as SensoryPointValue,
        C4: testCase.c4LeftTouch as SensoryPointValue,
        C5: testCase.c5LeftTouch as SensoryPointValue,
        C6: testCase.c6LeftTouch as SensoryPointValue,
        C7: testCase.c7LeftTouch as SensoryPointValue,
        C8: testCase.c8LeftTouch as SensoryPointValue,
        T1: testCase.t1LeftTouch as SensoryPointValue,
        T2: testCase.t2LeftTouch as SensoryPointValue,
        T3: testCase.t3LeftTouch as SensoryPointValue,
        T4: testCase.t4LeftTouch as SensoryPointValue,
        T5: testCase.t5LeftTouch as SensoryPointValue,
        T6: testCase.t6LeftTouch as SensoryPointValue,
        T7: testCase.t7LeftTouch as SensoryPointValue,
        T8: testCase.t8LeftTouch as SensoryPointValue,
        T9: testCase.t9LeftTouch as SensoryPointValue,
        T10: testCase.t10LeftTouch as SensoryPointValue,
        T11: testCase.t11LeftTouch as SensoryPointValue,
        T12: testCase.t12LeftTouch as SensoryPointValue,
        L1: testCase.l1LeftTouch as SensoryPointValue,
        L2: testCase.l2LeftTouch as SensoryPointValue,
        L3: testCase.l3LeftTouch as SensoryPointValue,
        L4: testCase.l4LeftTouch as SensoryPointValue,
        L5: testCase.l5LeftTouch as SensoryPointValue,
        S1: testCase.s1LeftTouch as SensoryPointValue,
        S2: testCase.s2LeftTouch as SensoryPointValue,
        S3: testCase.s3LeftTouch as SensoryPointValue,
        S4_5: testCase.s4_5LeftTouch as SensoryPointValue,
      },
      pinPrick: {
        C2: testCase.c2LeftPrick as SensoryPointValue,
        C3: testCase.c3LeftPrick as SensoryPointValue,
        C4: testCase.c4LeftPrick as SensoryPointValue,
        C5: testCase.c5LeftPrick as SensoryPointValue,
        C6: testCase.c6LeftPrick as SensoryPointValue,
        C7: testCase.c7LeftPrick as SensoryPointValue,
        C8: testCase.c8LeftPrick as SensoryPointValue,
        T1: testCase.t1LeftPrick as SensoryPointValue,
        T2: testCase.t2LeftPrick as SensoryPointValue,
        T3: testCase.t3LeftPrick as SensoryPointValue,
        T4: testCase.t4LeftPrick as SensoryPointValue,
        T5: testCase.t5LeftPrick as SensoryPointValue,
        T6: testCase.t6LeftPrick as SensoryPointValue,
        T7: testCase.t7LeftPrick as SensoryPointValue,
        T8: testCase.t8LeftPrick as SensoryPointValue,
        T9: testCase.t9LeftPrick as SensoryPointValue,
        T10: testCase.t10LeftPrick as SensoryPointValue,
        T11: testCase.t11LeftPrick as SensoryPointValue,
        T12: testCase.t12LeftPrick as SensoryPointValue,
        L1: testCase.l1LeftPrick as SensoryPointValue,
        L2: testCase.l2LeftPrick as SensoryPointValue,
        L3: testCase.l3LeftPrick as SensoryPointValue,
        L4: testCase.l4LeftPrick as SensoryPointValue,
        L5: testCase.l5LeftPrick as SensoryPointValue,
        S1: testCase.s1LeftPrick as SensoryPointValue,
        S2: testCase.s2LeftPrick as SensoryPointValue,
        S3: testCase.s3LeftPrick as SensoryPointValue,
        S4_5: testCase.s4_5LeftPrick as SensoryPointValue,
      }
    },
    deepAnalPressure: testCase.analSensation as BinaryObservation,
    voluntaryAnalContraction: testCase.analContraction as BinaryObservation,
  })
}