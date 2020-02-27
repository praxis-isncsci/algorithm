# ISNCSCI Algorithm
This algorithm is designed to produce a spinal cord injury classification consistent with the International Standards for Neurological Classification of Spinal Cord Injury developed and maintained by the American Spinal Injury Association (ASIA).

## API
### Input values
Following shows the possible values each properties of the `Exam`

- `Exam["left"|"right"]["lightTouch"|"pinPrick"][$level]`
```
'0' | '1' | '2' |
'0*' | '1*' |
'0**' | '1**' |
'NT' | 'NT*' | 'NT**'
```

- `Exam["left"|"right"].motor[$level]`
```
'0' | '1' | '2' | '3' | '4' | '5' |
'0*' | '1*' | '2*' | '3*' | '4*' |
'0**' | '1**' | '2**' | '3**' | '4**' |
'NT' | 'NT*' | 'NT**'
```

- `Exam["deepAnalPressure"|"Exam.voluntaryAnalContraction"]`
```
'Yes' | 'No' | 'NT'
```

- `Exam["left"|"right"].lowestNonKeyMuscleWithMotorFunction`
```
'C5' | 'C6' | 'C7' | 'C8' | 'T1' |
'L2' | 'L3' | 'L4' | 'L5' | 'S1'
```

### Code
```ts
// example import statements
// import { ISNCSCI } from "ISNCSCI";
// import { ISNCSCI } from "./dist/esm/ISNCSCI.js";
// const ISNCSCI = require("./dist/cjs/ISNCSCI.js").ISNCSCI;

// create exam
let exam = {
  deepAnalPressure: "Yes",
  voluntaryAnalContraction: "Yes",
  right: {
    lowestNonKeyMuscleWithMotorFunction: "C8",
    motor: {
      C5: "5",
      // ...
      S1: "5",
    },
    lightTouch: {
      C2: "2",
      // ...
      S4_5: "2",
    },
    pinPrick: {
      C2: "2",
      // ...
      S4_5: "2",
    }
  },
  left: {
    motor: { /***/ },
    lightTouch: { /***/ },
    pinPrick: { /***/ },
  },
}

// get result
let result = new ISNCSCI(exam);

// log classification result
console.log(result.classification);

// log totals result
console.log(result.totals);
```