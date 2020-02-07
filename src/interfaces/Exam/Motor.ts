export type MotorMuscleValue =
  '0' | '1' | '2' | '3' | '4' | '5' |
  '0*' | '1*' | '2*' | '3*' | '4*' |
  '0**' | '1**' | '2**' | '3**' | '4**' |
  'NT' | 'NT*' | 'NT**';

export type MotorLevel = 'C5' | 'C6' | 'C7' | 'C8' | 'T1' | 'L2' | 'L3' | 'L4' | 'L5' | 'S1';

export const MotorLevels: MotorLevel[]  = [
  'C5', 'C6', 'C7', 'C8', 'T1',
  'L2', 'L3', 'L4', 'L5', 'S1',
];

export interface Motor {
  C5: MotorMuscleValue;
  C6: MotorMuscleValue;
  C7: MotorMuscleValue;
  C8: MotorMuscleValue;
  T1: MotorMuscleValue;

  L2: MotorMuscleValue;
  L3: MotorMuscleValue;
  L4: MotorMuscleValue;
  L5: MotorMuscleValue;
  S1: MotorMuscleValue;
}