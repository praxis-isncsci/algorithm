import { checkASIAImpairmentScaleE } from "./E";
describe('AIS E', () => {
  it('E', () => {
    const result = checkASIAImpairmentScaleE('INT');
    expect(result).toBe('E')
  })
  it('E*', () => {
    const result = checkASIAImpairmentScaleE('INT*');
    expect(result).toBe('E*')
  })
  it('undefined', () => {
    const result = checkASIAImpairmentScaleE('C1');
    expect(result).toBeUndefined()
  })
})
