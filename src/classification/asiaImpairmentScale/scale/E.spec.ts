import { checkASIAImpairmentScaleE } from "./E";
describe('AIS E', () => {
  describe('not AIS E', () => {
    it('VAC = No with INT', () => {
      const result = checkASIAImpairmentScaleE('INT', 'No');
      expect(result).toBeUndefined();
    })
    it('VAC = No with INT*', () => {
      const result = checkASIAImpairmentScaleE('INT*', 'No');
      expect(result).toBeUndefined();
    })
    it('with C1', () => {
      const result0 = checkASIAImpairmentScaleE('C1', 'No');
      const result1 = checkASIAImpairmentScaleE('C1', 'Yes');
      const result2 = checkASIAImpairmentScaleE('C1', 'NT');
      expect([result0, result1, result2].every(r => r === undefined)).toBe(true);
    })
  })
  describe('VAC != No', () => {
    it('E', () => {
      const result0 = checkASIAImpairmentScaleE('INT', 'Yes');
      const result1 = checkASIAImpairmentScaleE('INT', 'NT');
      expect([result0, result1].every(r => r === 'E')).toBe(true);
    })
    it('E*', () => {
      const result0 = checkASIAImpairmentScaleE('INT*', 'Yes');
      const result1 = checkASIAImpairmentScaleE('INT*', 'NT');
      expect([result0, result1].every(r => r === 'E*')).toBe(true);
    })
  })
})
