import { SensoryPointValue, SensoryLevel } from "../interfaces";
export interface CheckLevelResult {
    continue: boolean;
    level?: string;
    variable: boolean;
}
/**
 * `['0', 'NT', '0*', 'NT*'].includes(value)`
 */
export declare const canBeAbsentSensory: (value: SensoryPointValue) => boolean;
/**
 * `['2','NT**','0**','1**'].includes(value)`
 */
export declare const isNormalSensory: (value: SensoryPointValue) => boolean;
export declare const levelIsBetween: (index: number, firstLevel: SensoryLevel, lastLevel: SensoryLevel) => boolean;
