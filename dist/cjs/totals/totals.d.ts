import { Exam, ExamSide, Motor, Sensory, SideTotals, Totals } from '../interfaces';
export declare const addValues: (...values: number[]) => string;
export declare const calculateMotorTotal: (motor: Motor, option: 'all' | 'upper' | 'lower') => string;
export declare const calculateSensoryTotal: (sensory: Sensory) => string;
export declare const calculateSideTotals: (side: ExamSide) => SideTotals;
export declare const calculateTotals: (exam: Exam) => Totals;
