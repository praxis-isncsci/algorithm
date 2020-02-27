import { BinaryObservation, ExamSide, SensoryLevel } from "../../interfaces";
import { CheckLevelResult } from "../common";
export declare const checkLevelForSensoryZPP: (side: ExamSide, level: SensoryLevel, variable: boolean) => CheckLevelResult;
export declare const determineSensoryZPP: (side: ExamSide, deepAnalPressure: BinaryObservation) => string;
