import { checkASIAImpairmentScaleA } from "./A";

describe('AIS A', () => {
  it('A', () => {
    expect(checkASIAImpairmentScaleA('C')).toBe(true);
    expect(checkASIAImpairmentScaleA('C,I')).toBe(true);
  })
  it('A*', () => {
    expect(checkASIAImpairmentScaleA('C*,I')).toBe(true);
    expect(checkASIAImpairmentScaleA('C*,I*')).toBe(true);
  })
  it('undefined', () => {
    expect(checkASIAImpairmentScaleA('I')).toBeUndefined();
    expect(checkASIAImpairmentScaleA('I*')).toBeUndefined();
  })
})
