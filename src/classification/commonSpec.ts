import {Exam, ExamSide, Sensory, Motor, SensoryLevel, SensoryLevels, SensoryPointValue, MotorMuscleValue, MotorLevel, MotorLevels} from "../interfaces";

export const newEmptySensory = (): Sensory => ({
  C2: '0', C3: '0', C4: '0', C5: '0', C6: '0', C7: '0', C8: '0',
  T1: '0', T2: '0', T3: '0', T4: '0', T5: '0', T6: '0',
  T7: '0', T8: '0', T9: '0', T10: '0', T11: '0', T12: '0',
  L1: '0', L2: '0', L3: '0', L4: '0', L5: '0',
  S1: '0', S2: '0', S3: '0', S4_5: '0',
});

export const newEmptyMotor = (): Motor => ({
  C5: '0', C6: '0', C7: '0', C8: '0', T1: '0',
  L2: '0', L3: '0', L4: '0', L5: '0', S1: '0',
});

export const newNormalSensory = (): Sensory => ({
  C2: '2', C3: '2', C4: '2', C5: '2', C6: '2', C7: '2', C8: '2',
  T1: '2', T2: '2', T3: '2', T4: '2', T5: '2', T6: '2',
  T7: '2', T8: '2', T9: '2', T10: '2', T11: '2', T12: '2',
  L1: '2', L2: '2', L3: '2', L4: '2', L5: '2',
  S1: '2', S2: '2', S3: '2', S4_5: '2',
});

export const newNormalMotor = (): Motor => ({
  C5: '5', C6: '5', C7: '5', C8: '5', T1: '5',
  L2: '5', L3: '5', L4: '5', L5: '5', S1: '5',
});

export const newEmptySide = (): ExamSide => ({
  motor: newEmptyMotor(),
  lightTouch: newEmptySensory(),
  pinPrick: newEmptySensory(),
});

export const newNormalSide = (): ExamSide => ({
  motor: newNormalMotor(),
  lightTouch: newNormalSensory(),
  pinPrick: newNormalSensory(),
});

export const newEmptyExam = (): Exam => {
  const right = newEmptySide();
  const left = newEmptySide();
  return {
    deepAnalPressure: 'No',
    voluntaryAnalContraction: 'No',
    right,
    left,
  };
}

export function propagateSensoryValueFrom(side: ExamSide, level: SensoryLevel, value: SensoryPointValue): void {
  for (let i = SensoryLevels.indexOf(level); i<SensoryLevels.length; i++) {
    const currentLevel = SensoryLevels[i];

    if (currentLevel === 'C1') {
      continue;
    }

    side.lightTouch[currentLevel] = value;
    side.pinPrick[currentLevel] = value;
  }
}

export function propagateMotorValueFrom(side: ExamSide, level: MotorLevel, value: MotorMuscleValue): void {
  for (let i = MotorLevels.indexOf(level); i<MotorLevels.length; i++) {
    side.motor[MotorLevels[i]] = value;
  }
}
