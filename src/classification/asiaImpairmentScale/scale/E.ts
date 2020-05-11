import { BinaryObservation } from "../../../interfaces";

export const checkASIAImpairmentScaleE = (neurologicalLevelOfInjury: string, voluntaryAnalContraction: BinaryObservation): 'E' | 'E*' | undefined => {
  if (voluntaryAnalContraction !== 'No') {
    if (neurologicalLevelOfInjury.includes('INT*')) {
      return 'E*';
    } else if (neurologicalLevelOfInjury.includes('INT')) {
      return 'E';
    } else {
      return;
    }
  }
}