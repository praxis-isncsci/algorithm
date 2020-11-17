# ISNCSCI Algorithm
This algorithm is designed to produce a spinal cord injury classification consistent with the International Standards for Neurological Classification of Spinal Cord Injury developed and maintained by the American Spinal Injury Association (ASIA).

# Table of Contents
- [Import library](#Import-library)
  - [Using on a browser (unpkg)](#Using-on-a-browser-(unpkg))
  - [Using in JavaScript projects](#Using-in-JavaScript-projects)
- [Usage](#Usage)
- [Interfaces](#Interfaces)
  - [Values](#Values)
- [Demo](#Demo)


## Import library
### Using on a browser (unpkg)
```html
<!-- using IIFE -->
<!-- defines ISNCSCI on window object -->
<script src="https://unpkg.com/isncsci/iife/ISNCSCI.min.js"></script>

<!-- using ES module -->
<script type="module">
  // using default import
  import ISNCSCI from "https://unpkg.com/isncsci/esm/ISNCSCI.min.js"
  // using named import
  import { ISNCSCI } from "https://unpkg.com/isncsci/esm/ISNCSCI.min.js"
</script>
```

### Using in JavaScript projects
Install library using NPM
```
npm i isncsci
```

Then import the library in your project

Named import
```ts
// Recommended with typescript
import { ISNCSCI, Exam } from 'isncsci';
```

Default import
```ts
import ISNCSCI from 'isncsci';
```

CommonJS
```ts
const { ISNCSCI } = require("isncsci");
// or
const ISNCSCI = require("isncsci").ISNCSCI;
```

## Usage
To get a classification and the totals, you just need pass an `exam` as a parameter while using the `ISNCSCI` constructor.
[Interface for `exam` parameter](#interfaces) can be found below.

Below is an example in TypeScript:
```ts
// create exam
let exam: Exam = {
  deepAnalPressure: "Yes",
  voluntaryAnalContraction: "Yes",
  right: {
    lowestNonKeyMuscleWithMotorFunction: "C8",
    motor: {
      C5: "5",
      /* ... */
      S1: "2*",
    },
    lightTouch: {
      C2: "2",
      /* ... */
      S4_5: "1*",
    },
    pinPrick: {
      C2: "1**",
      /* ... */
      S4_5: "0",
    }
  },
  left: {
    motor: { /* ... */ },
    lightTouch: { /* ... */ },
    pinPrick: { /* ... */ },
  },
}

// get result
let result = new ISNCSCI(exam);

// output classification result
console.log(result.classification);

// output totals result
console.log(result.totals);
```

## Interfaces
Following shows the interfaces associated to `Exam` used for `ISNCSCI` constructor.
```ts
interface Exam {
  right: ExamSide;
  left: ExamSide;
  voluntaryAnalContraction: BinaryObservation;
  deepAnalPressure: BinaryObservation;
}

interface ExamSide {
  motor: Motor;
  lightTouch: Sensory;
  pinPrick: Sensory;
  lowestNonKeyMuscleWithMotorFunction?: MotorLevel;
}

interface Motor {
  C5: MotorMuscleValue;
  C6: MotorMuscleValue;
  C7: MotorMuscleValue;
  C8: MotorMuscleValue;
  T1: MotorMuscleValue;
  L2: MotorMuscleValue;
  L3: MotorMuscleValue;
  L4: MotorMuscleValue;
  L5: MotorMuscleValue;
  S1: MotorMuscleValue;
}

interface Sensory {
  C2: SensoryPointValue;
  C3: SensoryPointValue;
  C4: SensoryPointValue;
  C5: SensoryPointValue;
  C6: SensoryPointValue;
  C7: SensoryPointValue;
  C8: SensoryPointValue;
  T1: SensoryPointValue;
  T2: SensoryPointValue;
  T3: SensoryPointValue;
  T4: SensoryPointValue;
  T5: SensoryPointValue;
  T6: SensoryPointValue;
  T7: SensoryPointValue;
  T8: SensoryPointValue;
  T9: SensoryPointValue;
  T10: SensoryPointValue;
  T11: SensoryPointValue;
  T12: SensoryPointValue;
  L1: SensoryPointValue;
  L2: SensoryPointValue;
  L3: SensoryPointValue;
  L4: SensoryPointValue;
  L5: SensoryPointValue;
  S1: SensoryPointValue;
  S2: SensoryPointValue;
  S3: SensoryPointValue;
  S4_5: SensoryPointValue;
}
```

### Values
Here lists the valid values for [interfaces](#interfaces) above.

Tagged values represents impairment due to non-SCI injury.
Single star (`*`) represents `consider not normal` for classification.
Double star (`**`) represents `consider normal` for classification.
```ts
type BinaryObservation = 'Yes' | 'No' | 'NT';

type MotorLevel =
  'C5' | 'C6' | 'C7' | 'C8' | 'T1' |
  'L2' | 'L3' | 'L4' | 'L5' | 'S1';

type MotorMuscleValue =
  '0' | '1' | '2' | '3' | '4' | '5' |
  '0*' | '1*' | '2*' | '3*' | '4*' |
  '0**' | '1**' | '2**' | '3**' | '4**' |
  'NT' | 'NT*' | 'NT**';

type SensoryPointValue =
  '0' | '1' | '2' |
  '0*' | '1*' |
  '0**' | '1**' |
  'NT' | 'NT*' | 'NT**';
```

## Demo
Demo files that can be used as examples are found in the `demo` folder.

You run `*.spec.*` tests using `npx jest demo` command.
You can view the test for `*.html` file by opening it on any modern browser that supports ES modules.

- `demo/cjs.spec.js`: demo using CommonJS syntax
- `demo/esm.spec.ts`: demo using ES module and TypeScript syntax
- `demo/iife-and-esm.html`: demo using ES module and IIFE on the browser
