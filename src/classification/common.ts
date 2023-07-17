import {MotorMuscleValue, SensoryLevel, SensoryLevels, SensoryPointValue} from "../interfaces";
import translations from '../en';

export type Translation = keyof typeof translations;

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

export type SideLevel = {
  name: SensoryLevel;
  lightTouch: SensoryPointValue;
  pinPrick: SensoryPointValue;
  motor: MotorMuscleValue | null;
  index: number;
  next: SideLevel | null;
  previous: SideLevel | null;
};
