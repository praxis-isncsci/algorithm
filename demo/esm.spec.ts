import {ISNCSCI, Exam} from "../src/ISNCSCI";
import exam from './demo-exam.json';
import demoResult from './demo-exam-result.json';

test('typescript', () => {
  const demoExam = exam as Exam;
  const result = new ISNCSCI(demoExam);
  expect(result).toEqual(demoResult);
})