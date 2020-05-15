import { Exam, NeurologicalLevels } from "../../../interfaces";
import { CheckAISResult } from "../common";
/**
 * Check AIS can be B i.e. Is injury Motor Complete?
 */
export declare const canBeSensoryIncomplete: (exam: Exam, neurologicalLevels: NeurologicalLevels) => CheckAISResult;
export declare const checkASIAImpairmentScaleB: (exam: Exam, neurologicalLevels: NeurologicalLevels) => 'B' | 'B*' | undefined;
