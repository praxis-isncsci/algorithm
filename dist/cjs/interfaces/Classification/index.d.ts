import { NeurologicalLevels } from './NeurologicalLevels';
import { ZoneOfPartialPreservations } from './ZoneOfPartialPreservations';
import { InjuryComplete } from './InjuryComplete';
export interface Classification {
    neurologicalLevels: NeurologicalLevels;
    neurologicalLevelOfInjury: string;
    injuryComplete: InjuryComplete;
    ASIAImpairmentScale: string;
    zoneOfPartialPreservations: ZoneOfPartialPreservations;
}
export { NeurologicalLevels, ZoneOfPartialPreservations, InjuryComplete, };
