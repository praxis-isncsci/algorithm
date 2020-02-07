import { Exam, ExamSide, Motor, Sensory, SideTotals, Totals } from '../interfaces';

const NOT_DETERMINABLE = 'ND';

export const addValues = (...values: number[]): string => {
  if (values.includes(NaN)) {
    throw `${values[values.indexOf(NaN)]} is not a valid value`;
  }
  const sum = values.reduce((sum, v) => sum += v, 0);
  return sum.toString();
}

export const calculateMotorTotal = (motor: Motor, option: 'all' | 'upper' | 'lower'): string => {
  let values;

  if (option === 'all') {
    values = Object.values(motor);
  } else if (option === 'upper') {
    values = [ motor.C5, motor.C6, motor.C7, motor.C8, motor.T1 ];
  } else if (option === 'lower') {
    values = [ motor.L2, motor.L3, motor.L4, motor.L5, motor.S1 ];
  }

  if (!values) {
    throw `option should be one of 'all' | 'upper' | 'lower'`;
  }

  if (values.some(v => ['NT', '0*', '1*', '2*', '3*', 'NT*'].includes(v))) {
    return NOT_DETERMINABLE;
  } else {
    const variableTotals = ['0**','1**','2**','3**','4**','NT**'];
    const total = addValues(...values.map(v => {
      return variableTotals.includes(v) ? 5 : parseInt(v.replace(/\*/g, ''));
    }));
    return total + (values.some(v => variableTotals.includes(v)) ? '*' : '');
  }
}

export const calculateSensoryTotal = (sensory: Sensory): string => {
  const values = Object.values(sensory);
  if (values.some(v => ['NT','0*','NT*'].includes(v))) {
    return NOT_DETERMINABLE;
  } else {
    const variableTotals = ['0**','1**','NT**'];
    const total = addValues(...values.map(v => {
      return variableTotals.includes(v) ? 2 : parseInt(v.replace(/\*/g, ''));
    }));
    return total + (values.some(v => variableTotals.includes(v)) ? '*' : '');
  }
}

const addTotals =  (...values: string[]): string => {
  if (values.includes(NOT_DETERMINABLE)) {
    return NOT_DETERMINABLE;
  } else {
    const total = addValues(...values.map(v => parseInt(v.replace(/\*/g, ''))));
    return total + (values.some(v => v.includes('*')) ? '*' : '');
  }
}

export const calculateSideTotals = (side: ExamSide): SideTotals => {
  const motor = calculateMotorTotal(side.motor, 'all');
  const upperExtremity = calculateMotorTotal(side.motor, 'upper');
  const lowerExtremity = calculateMotorTotal(side.motor, 'lower');
  const lightTouch = calculateSensoryTotal(side.lightTouch);
  const pinPrick = calculateSensoryTotal(side.pinPrick);

  return {upperExtremity, lowerExtremity, lightTouch, pinPrick, motor};
}

export const calculateTotals = (exam: Exam): Totals => {
  const left = calculateSideTotals(exam.left);
  const right = calculateSideTotals(exam.right);

  const upperExtremity = addTotals(right.upperExtremity, left.upperExtremity);
  const lowerExtremity = addTotals(right.lowerExtremity, left.lowerExtremity);
  const lightTouch = addTotals(right.lightTouch, left.lightTouch);
  const pinPrick = addTotals(right.pinPrick, left.pinPrick);

  return {
    left,
    right,
    upperExtremity,
    lowerExtremity,
    lightTouch,
    pinPrick,
  };
}