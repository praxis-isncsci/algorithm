import { Classification, Exam, Totals, InjuryComplete } from './interfaces';
import { classify } from './classification';
import { calculateTotals } from './totals/totals';

// TODO: hotfix
const noIndividualStarRange = (value: string): string => {
  if (value.includes(',')) {
    return value.replace(/\*/g,'');
  } else {
    return value
  }
}
export class ISNCSCI {
  public classification: Classification;
  public totals: Totals;
  constructor(exam: Exam, options?: {noIndividualStarRange: boolean}) {
    this.classification = classify(exam);
    this.totals = calculateTotals(exam);

    // TODO: hotfix
    if(!options || options && options.noIndividualStarRange) {
      this.classification.neurologicalLevels.sensoryLeft =
        noIndividualStarRange(this.classification.neurologicalLevels.sensoryLeft);
      this.classification.neurologicalLevels.sensoryRight =
        noIndividualStarRange(this.classification.neurologicalLevels.sensoryRight);
      this.classification.neurologicalLevels.motorLeft =
        noIndividualStarRange(this.classification.neurologicalLevels.motorLeft);
      this.classification.neurologicalLevels.motorRight =
        noIndividualStarRange(this.classification.neurologicalLevels.motorRight);
      this.classification.neurologicalLevelOfInjury =
        noIndividualStarRange(this.classification.neurologicalLevelOfInjury);
      this.classification.injuryComplete =
        noIndividualStarRange(this.classification.injuryComplete) as InjuryComplete;
      this.classification.ASIAImpairmentScale =
        noIndividualStarRange(this.classification.ASIAImpairmentScale);
      this.classification.zoneOfPartialPreservations.sensoryLeft =
        noIndividualStarRange(this.classification.zoneOfPartialPreservations.sensoryLeft);
      this.classification.zoneOfPartialPreservations.sensoryRight =
        noIndividualStarRange(this.classification.zoneOfPartialPreservations.sensoryRight);
      this.classification.zoneOfPartialPreservations.motorLeft =
        noIndividualStarRange(this.classification.zoneOfPartialPreservations.motorLeft);
      this.classification.zoneOfPartialPreservations.motorRight =
        noIndividualStarRange(this.classification.zoneOfPartialPreservations.motorRight);
    }
  }
}
