import { InjuryComplete } from "../../../interfaces";

const canBeInjuryComplete = (injuryComplete: InjuryComplete): boolean => injuryComplete.includes('C');

export const checkASIAImpairmentScaleA = (injuryComplete: InjuryComplete): 'A' | 'A*' | undefined => {
  if (canBeInjuryComplete(injuryComplete)) {
    if (injuryComplete.includes('*')) {
      return 'A*';
    } else {
      return 'A';
    }
  }
}