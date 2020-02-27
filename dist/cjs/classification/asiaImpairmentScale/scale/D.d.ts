import { Exam } from "../../../interfaces";
import { CheckAISResult } from "../common";
export declare const checkASIAImpairmentScaleD: (exam: Exam, neurologicalLevelOfInjury: string, canBeMotorIncompleteResult: CheckAISResult) => "D" | "D*" | undefined;
