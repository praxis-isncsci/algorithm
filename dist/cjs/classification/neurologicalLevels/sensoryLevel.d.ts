import { ExamSide, SensoryLevel } from '../../interfaces';
import { CheckLevelResult } from '../common';
export declare const checkSensoryLevel: (side: ExamSide, level: SensoryLevel, nextLevel: SensoryLevel, variable: boolean) => CheckLevelResult;
/**
 * 1. step through each level
 *    a. If next PP and LT are both considered normal then continue to next level
 *    b. If next PP and LT contains NT and does not contain abnormal then add current level to list then continue to next level
 *    c. Else one of next PP and LT is altered then add current level to list then stop
 *       i. if next PP and LT both
 *    d. If reached last level (S4_5) then add current level to list
 * 2. return current list
 */
export declare const determineSensoryLevel: (side: ExamSide) => string;
