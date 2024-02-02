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

### Classification values

The classification elements can have the following values:

**Neurological levels** and the **neurological level of injury** is a comma separated list of levels, e.g. `C5, C6, C7, C8, T1` or `C5, C6, C7, C8, T1, L2, L3, L4, L5, S1`.
The range can include levels from `C1` to `S3` or `INT` when normal values extend all the way to `S4-5`.
This applies to the following elements:

- `classification.neurologicalLevel.sensoryRight`
- `classification.neurologicalLevel.sensoryLeft`
- `classification.neurologicalLevel.motorRight`
- `classification.neurologicalLevel.motorLeft`
- `classification.neurologicalLevelOfInjury`

The  can be a single level, e.g. `C5` or `C6`.

**Injury complete** is a comma separated list that includes any of the following values: `C`, `I`.

**ASIA Impairment Scale** is a single comma separated list that includes any of the following values: `A`, `B`, `C`, `D`, `E`.

**Zone of Partial Preservations** is a comma separated list of levels, e.g. `C5, C6, C7, C8, T1` or `C5, C6, C7, C8, T1, L2, L3, L4, L5, S1`.
Just as the **neurological levels**, the range can include levels from `C1` to `S3` or `INT` when normal values extend all the way to `S4-5`. It can also include `NA` if there is sensation at `S4-5` or either `VAC` or `DAP` are set to `Yes`.
This applies to the following elements:

- `classification.zoneOfPartialPreservations.sensoryRight`
- `classification.zoneOfPartialPreservations.sensoryLeft`
- `classification.zoneOfPartialPreservations.motorRight`
- `classification.zoneOfPartialPreservations.motorLeft`

### Totals values

The totals are calculated by adding the values of the motor and sensory (light touch and pin prick) columns, therefore they can be a number from 0 to 112.
They, however, can receive a value of `ND` if there is an `NT` value in their column, ans `NT` has no numeric value to be added.
This affects:

| Total                                | Possible values |
|--------------------------------------|----------------:|
| `result.totals.left.upperExtremity`  | 0-25, `ND`      |
| `result.totals.left.lowerExtremity`  | 0-25, `ND`      |
| `result.totals.left.lightTouch`      | 0-56, `ND`      |
| `result.totals.left.pinPrick`        | 0-56, `ND`      |
| `result.totals.left.motor`           | 0-50, `ND`      |
| `result.totals.right.upperExtremity` | 0-25, `ND`      |
| `result.totals.right.lowerExtremity` | 0-25, `ND`      |
| `result.totals.right.lightTouch`     | 0-56, `ND`      |
| `result.totals.right.pinPrick`       | 0-56, `ND`      |
| `result.totals.right.motor`          | 0-50, `ND`      |
| `result.totals.upperExtremity`       | 0-50, `ND`      |
| `result.totals.lowerExtremity`       | 0-50, `ND`      |
| `result.totals.lightTouch`           | 0-112, `ND`     |
| `result.totals.pinPrick`             | 0-112, `ND`     |



## Demo
Demo files that can be used as examples are found in the `demo` folder.

You run `*.spec.*` tests using `npx jest demo` command.
You can view the test for `*.html` file by opening it on any modern browser that supports ES modules.

- `demo/cjs.spec.js`: demo using CommonJS syntax
- `demo/esm.spec.ts`: demo using ES module and TypeScript syntax
- `demo/iife-and-esm.html`: demo using ES module and IIFE on the browser
