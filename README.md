# ISNCSCI Algorithm

## Introduction

## API
```ts
// create exam
let exam = {
  right: {
    lowestNonKeyMuscleWithMotorFunction: "C8",
    motor: {
      C5: "5",
      // ...
      T1: "5",
      L2: "5",
      // ...
      S1: "5",
    },
    lightTouch: {
      C2: "2",
      // ...
      S3: "2",
      S4_5: "2",
    },
    pinPrick: {
      C2: "2",
      // ...
      S3: "2",
      S4_5: "2",
    }
  },
  left: {
    motor: {
      // ...
    },
    lightTouch: {
      // ...
    },
    pinPrick: {
      // ...
    }
  },
  deepAnalPressure: "Yes",
  voluntaryAnalContraction: "Yes",
}

// get result
let result = new ISNCSCI(exam);

console.log(result.classification);
console.log(result.totals);
```