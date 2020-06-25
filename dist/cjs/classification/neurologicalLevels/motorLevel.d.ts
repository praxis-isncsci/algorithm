import { ExamSide, MotorLevel, BinaryObservation } from '../../interfaces';
import { CheckLevelResult } from '../common';
export declare const checkMotorLevel: (side: ExamSide, level: MotorLevel, nextLevel: MotorLevel, variable: boolean) => CheckLevelResult;
export declare const checkMotorLevelBeforeStartOfKeyMuscles: (side: ExamSide, level: 'C4' | 'L1', nextLevel: MotorLevel, variable: boolean) => CheckLevelResult;
export declare const checkWithSensoryCheckLevelResult: (side: ExamSide, level: 'T1' | 'S1', variable: boolean, sensoryCheckLevelResult: CheckLevelResult) => CheckLevelResult;
export declare const checkMotorLevelAtEndOfKeyMuscles: (side: ExamSide, level: 'T1' | 'S1', variable: boolean) => CheckLevelResult;
/** TODO
 * 1. step through each level
 *    a. ...
 * 2. return current list
 */
export declare const determineMotorLevel: (side: ExamSide, vac: BinaryObservation) => string;
