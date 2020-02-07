export interface SideTotals {
  upperExtremity: string;
  lowerExtremity: string;
  lightTouch: string;
  pinPrick: string;
  motor: string;
}

export interface Totals {
  left: SideTotals;
  right: SideTotals;
  upperExtremity: string;
  lowerExtremity: string;
  lightTouch: string;
  pinPrick: string;
}