import { Motor, MotorLevel } from './Motor';
import { Sensory } from './Sensory';

export interface ExamSide {
  motor: Motor;
  lightTouch: Sensory;
  pinPrick: Sensory;
  lowestNonKeyMuscleWithMotorFunction?: MotorLevel;
}