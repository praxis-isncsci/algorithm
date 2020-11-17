import { checkASIAImpairmentScaleA } from "./A";

describe('AIS A', () => {
  it('A', () => {
    expect(checkASIAImpairmentScaleA('C')).toBe('A');
    expect(checkASIAImpairmentScaleA('C,I')).toBe('A');
  })
  it('A*', () => {
    expect(checkASIAImpairmentScaleA('C*,I')).toBe('A*');
    expect(checkASIAImpairmentScaleA('C*,I*')).toBe('A*');
  })
  it('undefined', () => {
    expect(checkASIAImpairmentScaleA('I')).toBeUndefined();
    expect(checkASIAImpairmentScaleA('I*')).toBeUndefined();
  })
})
