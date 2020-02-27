import { BinaryObservation } from './BinaryObservation';
import { ExamSide } from './ExamSide';
export interface Exam {
    right: ExamSide;
    left: ExamSide;
    voluntaryAnalContraction: BinaryObservation;
    deepAnalPressure: BinaryObservation;
}
export { BinaryObservation, ExamSide };
export { Motor, MotorLevel, MotorLevels, MotorMuscleValue } from './Motor';
export { Sensory, SensoryLevel, SensoryLevels, SensoryPointValue } from './Sensory';
