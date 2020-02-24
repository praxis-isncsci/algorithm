export const checkASIAImpairmentScaleE = (neurologicalLevelOfInjury: string): 'E' | 'E*' | undefined => {
  if (neurologicalLevelOfInjury.includes('INT*')) {
    return 'E*';
  } else if (neurologicalLevelOfInjury.includes('INT')) {
    return 'E';
  } else {
    return;
  }
}