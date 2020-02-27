import { Classification, Exam, Totals } from './interfaces';
import { classify } from './classification';
import { calculateTotals } from './totals/totals';

export class ISNCSCI {
  public classification: Classification;
  public totals: Totals;
  constructor(exam: Exam) {
    this.classification = classify(exam);
    this.totals = calculateTotals(exam);
  }
}
