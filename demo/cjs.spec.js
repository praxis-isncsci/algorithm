const { ISNCSCI } = require("isncsci");
const exam = require("./demo-exam.json");
const demoResult = require("./demo-exam-result.json");

test('commonjs', () => {
  const result = new ISNCSCI(exam);
  expect(result).toEqual(demoResult);
})