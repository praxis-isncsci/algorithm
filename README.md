# ISNCSCI Algorithm
This algorithm is designed to produce a spinal cord injury classification consistent with the International Standards for Neurological Classification of Spinal Cord Injury developed and maintained by the American Spinal Injury Association (ASIA).

## Install
Using npm
```
npm i @praxis-isncsci/algorithm
```

Using on a browser (unpkg)
```html
<!-- using IIFE -->
<!-- defines ISNCSCI on window object -->
<script src="https://unpkg.com/@praxis-isncsci/algorithm/dist/iife/ISNCSCI.min.js"></script>

<!-- using ES module -->
<script type="module">
  // using default import
  import ISNCSCI from "https://unpkg.com/@praxis-isncsci/algorithm/dist/esm/ISNCSCI.min.js"
  // using named import
  import { ISNCSCI } from "https://unpkg.com/@praxis-isncsci/algorithm/dist/esm/ISNCSCI.min.js"
</script>
```

### Code
```ts
/**
 *  example import statements
 */
// TypeScript (ES module)
import { ISNCSCI, Exam } from '@praxis-isncsci/algorithm';
// default import
// import ISNCSCI from '@praxis-isncsci/algorithm';
// CommonJS
// const ISNCSCI = require("@praxis-isncsci/algorithm").ISNCSCI;

// create exam
let exam: Exam = {
  deepAnalPressure: "Yes",
  voluntaryAnalContraction: "Yes",
  right: {
    lowestNonKeyMuscleWithMotorFunction: "C8",
    motor: {
      C5: "5",
      // ...
      S1: "2*",
    },
    lightTouch: {
      C2: "2",
      // ...
      S4_5: "1*",
    },
    pinPrick: {
      C2: "1**",
      // ...
      S4_5: "0",
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

## API
Following shows the possible values each properties of the `Exam`

### Sensory values
`Exam["left"|"right"]["lightTouch"|"pinPrick"][$level]`
```ts
'0' | '1' | '2' |
'0*' | '1*' |
'0**' | '1**' |
'NT' | 'NT*' | 'NT**'
```

### Motor values
`Exam["left"|"right"].motor[$level]`
```ts
'0' | '1' | '2' | '3' | '4' | '5' |
'0*' | '1*' | '2*' | '3*' | '4*' |
'0**' | '1**' | '2**' | '3**' | '4**' |
'NT' | 'NT*' | 'NT**'
```

### Deep anal pressure / Voluntary anal contraction
`Exam["deepAnalPressure"|"voluntaryAnalContraction"]`
```ts
'Yes' | 'No' | 'NT'
```

### Lowest non-key muscle with motor function
`Exam["left"|"right"].lowestNonKeyMuscleWithMotorFunction`
```ts
'C5' | 'C6' | 'C7' | 'C8' | 'T1' |
'L2' | 'L3' | 'L4' | 'L5' | 'S1'
```

### Levels
```ts
'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' |
'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' |
'L1' | 'L2' | 'L3' | 'L4' | 'L5'|
'S1' | 'S2' | 'S3' | 'S4_5'
```