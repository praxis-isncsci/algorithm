import { SensoryPointValue, SensoryLevel, SensoryLevels } from "../interfaces";

export interface CheckLevelResult {
  continue: boolean;
  level?: string;
  variable: boolean;
}

/**
 * `['0', 'NT', '0*', 'NT*'].includes(value)`
 */
export const canBeAbsentSensory = (value: SensoryPointValue): boolean => ['0', 'NT', '0*', 'NT*'].includes(value);

/**
 * `['2','NT**','0**','1**'].includes(value)`
 */
export const isNormalSensory = (value: SensoryPointValue): boolean => ['2','NT**','0**','1**'].includes(value);

export const levelIsBetween = (index: number, firstLevel: SensoryLevel, lastLevel: SensoryLevel): boolean => {
  return index >= SensoryLevels.indexOf(firstLevel) && index <= SensoryLevels.indexOf(lastLevel);
};