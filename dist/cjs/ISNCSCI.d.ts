import { Classification, Exam, Totals } from './interfaces';
declare class ISNCSCI {
    classification: Classification;
    totals: Totals;
    constructor(exam: Exam);
}
export { Exam, ISNCSCI };
export default ISNCSCI;
