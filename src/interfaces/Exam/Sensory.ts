export type SensoryPointValue =
  '0' | '1' | '2' |
  '0*' | '1*' |
  '0**' | '1**' |
  'NT' | 'NT*' | 'NT**';

export type SensoryLevel =
  'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' |
  'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' |
  'L1' | 'L2' | 'L3' | 'L4' | 'L5'|
  'S1' | 'S2' | 'S3' | 'S4_5';

export const SensoryLevels: SensoryLevel[] = [
  'C1',
  'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
  'S1', 'S2', 'S3', 'S4_5',
]
export interface Sensory {
  C2: SensoryPointValue;
  C3: SensoryPointValue;
  C4: SensoryPointValue;
  C5: SensoryPointValue;
  C6: SensoryPointValue;
  C7: SensoryPointValue;
  C8: SensoryPointValue;
  T1: SensoryPointValue;
  T2: SensoryPointValue;
  T3: SensoryPointValue;
  T4: SensoryPointValue;
  T5: SensoryPointValue;
  T6: SensoryPointValue;
  T7: SensoryPointValue;
  T8: SensoryPointValue;
  T9: SensoryPointValue;
  T10: SensoryPointValue;
  T11: SensoryPointValue;
  T12: SensoryPointValue;
  L1: SensoryPointValue;
  L2: SensoryPointValue;
  L3: SensoryPointValue;
  L4: SensoryPointValue;
  L5: SensoryPointValue;
  S1: SensoryPointValue;
  S2: SensoryPointValue;
  S3: SensoryPointValue;
  S4_5: SensoryPointValue;
}