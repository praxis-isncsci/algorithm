import { Exam, SensoryLevel } from "../../interfaces";
import { CheckLevelResult } from "../common";
export declare const checkLevelWithoutMotor: (level: SensoryLevel, leftSensoryResult: CheckLevelResult, rightSensoryResult: CheckLevelResult, variable: boolean) => CheckLevelResult;
export declare const checkLevelWithMotor: (exam: Exam, level: SensoryLevel, sensoryResult: CheckLevelResult, variable: boolean) => CheckLevelResult;
export declare const determineNeurologicalLevelOfInjury: (exam: Exam) => string;
