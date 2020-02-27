import { Exam } from "../../interfaces";
export declare type CheckAISResult = {
    result: boolean;
    variable: boolean;
};
export declare const startingMotorIndex: (sensoryIndex: number) => number;
export declare const isSensoryPreserved: (exam: Exam) => CheckAISResult;
