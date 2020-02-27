import { Exam, InjuryComplete, NeurologicalLevels } from "../../interfaces";
import { CheckAISResult } from "./common";
export declare const canBeMotorIncomplete: (exam: Exam, neurologicalLevels: NeurologicalLevels) => CheckAISResult;
export declare const determineASIAImpairmentScale: (exam: Exam, injuryComplete: InjuryComplete, neurologicalLevels: NeurologicalLevels, neurologicalLevelOfInjury: string) => string;
