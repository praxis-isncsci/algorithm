import { Exam } from "../../../interfaces";
import { CheckAISResult } from "../common";
export declare const checkASIAImpairmentScaleC: (exam: Exam, neurologicalLevelOfInjury: string, canBeMotorIncompleteResult: CheckAISResult) => "C" | "C*" | undefined;
