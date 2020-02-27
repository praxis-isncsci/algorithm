import { BinaryObservation, ExamSide, MotorLevel, SensoryLevel } from "../../interfaces";
import { CheckLevelResult } from "../common";
export declare const checkLevelForMotorZPP: (side: ExamSide, level: MotorLevel, variable: boolean) => CheckLevelResult;
export declare const checkLevelForMotorZPPOnSensory: (side: ExamSide, level: SensoryLevel, variable: boolean, extremityIsAllNormal: boolean, extremityCanBeAllNormal: boolean, extremityCanBeAllParalyzed: boolean) => CheckLevelResult;
/**
 * TODO
 * 1. Check VAC value and S4_5 values
 * 2. Check Lower motor values
 *   a. if can be normal check
 *
 * @param side
 * @param voluntaryAnalContraction
 */
export declare const determineMotorZPP: (side: ExamSide, voluntaryAnalContraction: BinaryObservation) => string;
