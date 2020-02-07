import { Classification, Exam } from '../interfaces';
import { determineNeurologicalLevels } from './neurologicalLevels';
import { determineZoneOfPartialPreservations } from './zoneOfPartialPreservation';
import { determineNeurologicalLevelOfInjury } from './neurologicalLevelOfInjury/neurologicalLevelOfInjury';
import { determineInjuryComplete } from './injuryComplete/injuryComplete';
import { determineASIAImpairmentScale } from './asiaImpairmentScale/asiaImpairmentScale';

export const classify = (exam: Exam): Classification => {
  const neurologicalLevels = determineNeurologicalLevels(exam);
  const neurologicalLevelOfInjury = determineNeurologicalLevelOfInjury(exam);
  const injuryComplete = determineInjuryComplete(exam);
  const ASIAImpairmentScale = determineASIAImpairmentScale(exam, injuryComplete, neurologicalLevels, neurologicalLevelOfInjury);
  const zoneOfPartialPreservations = determineZoneOfPartialPreservations(exam);
  return { neurologicalLevels, neurologicalLevelOfInjury, injuryComplete, ASIAImpairmentScale, zoneOfPartialPreservations };
}
