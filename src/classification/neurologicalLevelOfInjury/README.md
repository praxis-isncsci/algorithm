# Neurological Level of Injury (NLI)

This module computes the **Neurological Level of Injury (NLI)** for the International Standards for Neurological Classification of Spinal Cord Injury (ISNCSCI). The algorithm uses a step-based, chain-of-command pattern so clinicians can follow the logic and see how the NLI is determined.

---

## Overview

### What is the Neurological Level of Injury?

The **Neurological Level of Injury (NLI)** identifies the most caudal segment where sensory and motor function are both intact bilaterally. It answers: _"What is the lowest level where sensation and motor function are both normal on both sides?"_

| Key Feature              | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| **Bilateral evaluation** | Both left AND right sides must have intact function                             |
| **Sensory + Motor**      | Both sensory (light touch and pin prick) and motor (key muscles) must be intact |
| **Single value**         | NLI is reported as a single value, not separately for left/right                |
| **Primary measure**      | The main measure reported on the ISNCSCI worksheet                              |

### Why is NLI important?

NLI is the **most widely recognized measure** of spinal cord injury severity:

- Defines the extent of neurological impairment
- Guides rehabilitation planning and prognosis
- Feeds into AIS classification
- Tracks recovery over time
- Standardizes communication between clinicians

### Single value vs bilateral reporting

Unlike motor levels and sensory levels (which are reported separately for left and right sides), **NLI is a single value** representing the lowest level where **both sides** have intact function. This bilateral requirement makes NLI a conservative measure: a deficit on either side prevents that level from qualifying as the NLI.

---

## Prerequisites

### Input Requirements

| Input        | Type   | Description                                      |
| ------------ | ------ | ------------------------------------------------ |
| `exam`       | `Exam` | Complete exam data with left and right sides     |
| `exam.left`  | `Side` | Left side: light touch, pin prick, motor grades  |
| `exam.right` | `Side` | Right side: light touch, pin prick, motor grades |

### What data is needed?

**For sensory evaluation:**

- **Light touch (LT)** values at all key sensory points (C2-S4_5) on both sides
- **Pin prick (PP)** values at all key sensory points (C2-S4_5) on both sides
- Values: `0` (absent), `1` (impaired), `2` (normal), `NT` (not testable), `0*`, `1*`, `2*` (with variable indicator)

**For motor evaluation (at C4-T1 and L1-S1):**

- **Motor** grades at key muscles (C5-T1, L2-S1) on both sides
- Values: `0` (absent), `1` (trace), `2` (poor), `3` (fair), `4` (good), `5` (normal), `NT` (not testable), `0*`, `1*`, `2*` (with variable indicator)

---

## Algorithm Summary

### How is NLI calculated?

The algorithm iterates through all sensory levels from **C1** toward **S4_5**. At each level, it evaluates:

1. **Bilateral sensory function** (left and right sides) using light touch and pin prick
2. **Bilateral motor function** (when applicable) at motor regions:
   - **C4-T1**: Cervical motor region
   - **L1-S1**: Lumbar motor region

For each level, the algorithm determines if the level qualifies as an NLI based on **intact bilateral function**. The `variable` flag accumulates across all checks (left sensory, right sensory, left motor, right motor). When iteration completes at S4_5 without stopping early, the result is **INT** (intact).

### Bilateral evaluation approach

The core principle is that **both sides must be intact** for a level to qualify:

| Condition                               | Result             | Continue?                   |
| --------------------------------------- | ------------------ | --------------------------- |
| **Both sides intact**                   | Add level to NLI   | Yes, continue to next level |
| **Either side impaired**                | Stop iteration     | No, NLI found               |
| **Both sides variable (NT, 0\*, etc.)** | Add level with `*` | Depends on type             |

### Sensory-only vs motor regions

Not all levels have key motor muscles. The algorithm adapts its evaluation based on the level:

| Region               | Levels               | Evaluation                                              |
| -------------------- | -------------------- | ------------------------------------------------------- |
| **Sensory-only**     | C1-C3, T2-T12, S2-S3 | Bilateral sensory only (LT and PP on both sides)        |
| **Cervical motor**   | C4-T1                | Bilateral sensory + bilateral motor (key muscles C5-T1) |
| **Thoracic sensory** | T2-T12               | Bilateral sensory only (no key muscles)                 |
| **Lumbar motor**     | L1-S1                | Bilateral sensory + bilateral motor (key muscles L2-S1) |

**Special sensory-only cases:**

- **C1-C3:** Above cervical key muscles (C5 is first key muscle)
- **T2-T12:** No thoracic key muscles (T1 is last cervical, L2 is first lumbar)
- **S2-S3:** No sacral key muscles below S1

### When INT is reported

**INT** (intact) is reported when the iteration reaches **S4_5** without finding any impairment. This means all levels from C1 through S4_5 have intact bilateral sensory and motor function (where applicable).

| Result | Meaning                                                |
| ------ | ------------------------------------------------------ |
| `INT`  | All levels intact, no variable values                  |
| `INT*` | All levels intact, but some values were NT or variable |

---

## Step Index

| Step | Name                     | Purpose                                                                                                                |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1    | `initializeNLIIteration` | Initialize state: empty levels list, variable=false, currentIndex=0                                                    |
| 2    | `checkLevel`             | For current level, evaluate bilateral sensory and motor (when applicable); add level if criteria met; continue or stop |

---

## Step-by-Step Explanations

### Step 1: initializeNLIIteration

**Purpose:** Set up the state for NLI calculation. Start at C1 (the most rostral level).

**Inputs:** `exam` (complete exam data with left and right sides).

**Logic:**

- `listOfNLI = []` (empty list to collect qualifying levels)
- `variable = false` (no variable values found yet)
- `currentIndex = 0` (start at C1, the first sensory level)
- `next = checkLevel` (proceed to check the first level)

**Outputs:** Initial state with empty NLI list and index at C1.

**Next step:** `checkLevel`.

**Clinical note:** The algorithm always starts at C1 and works caudally toward S4_5. This ensures all levels are evaluated in order.

---

### Step 2: checkLevel

**Purpose:** For the current level, evaluate bilateral sensory and motor function (when applicable). Add the level to NLI when bilateral criteria are met. Continue to the next level or stop when impairment is found.

**Inputs:**

- `currentLevel` (SensoryLevel at currentIndex)
- `exam` (left and right sides)
- `listOfNLI` (levels added so far)
- `variable` (accumulated from prior checks)

**Logic:**

#### 1. Handle S4_5 (end of iteration)

When `currentIndex` reaches S4_5 (the last level):

- Add **INT** (or **INT\*** if variable flag is set) to NLI
- `next = null` (algorithm complete)

#### 2. Bilateral sensory checks

For all levels (sensory-only and motor regions):

- **Left sensory check:** `checkSensoryLevel(exam.left, level, nextLevel, variable)`
  - Evaluates light touch and pin prick at the next level (e.g. at C1, check C2 sensation)
  - Returns `{ continue, level?, variable }`
- **Right sensory check:** `checkSensoryLevel(exam.right, level, nextLevel, variable)`
  - Evaluates light touch and pin prick at the next level
  - Returns `{ continue, level?, variable }`

#### 3. Determine region type

Check if the current level is in a motor region:

- **Motor regions:** C4-T1 (cervical) or L1-S1 (lumbar)
- **Sensory-only regions:** C1-C3, T2-T12, S2-S3

#### 4a. Sensory-only regions (C1-C3, T2-T12, S2-S3)

**Combine bilateral sensory results** using `checkLevelWithoutMotor`:

| Left Sensory             | Right Sensory               | Result                        | Continue?                        |
| ------------------------ | --------------------------- | ----------------------------- | -------------------------------- |
| Both have level with `*` | Both have level with `*`    | Add level + `*`               | Both continue flags AND together |
| At least one has level   | Other has level or no level | Add level (+ `*` if variable) | Both continue flags AND together |
| Neither has level        | Neither has level           | No level added                | Both continue flags AND together |

**Key bilateral logic:**

- If **both sides** return a level with `*` → add level with `*`
- If **at least one side** returns a level → add level (with `*` if variable flag is set)
- **Continue only if both sides continue** → `leftResult.continue && rightResult.continue`

#### 4b. Motor regions (C4-T1, L1-S1)

**First, combine bilateral sensory** using `checkLevelWithoutMotor` (same as sensory-only).

**Then, evaluate bilateral motor function:**

Map the sensory level to the corresponding motor level:

- **C4-T1:** motorLevel = MotorLevels[index - 4]
- **L1-S1:** motorLevel = MotorLevels[index - 16]

**Special motor cases:**

| Level     | Case                              | Motor Check                                           |
| --------- | --------------------------------- | ----------------------------------------------------- |
| **C4**    | Before cervical key muscles start | Check **C5** motor on both sides (next motor level)   |
| **C5-C8** | Cervical key muscles              | Check **current and next** motor levels on both sides |
| **T1**    | End of cervical key muscles       | Check **T1** motor only (no next level)               |
| **L1**    | Before lumbar key muscles start   | Check **L2** motor on both sides (next motor level)   |
| **L2-L5** | Lumbar key muscles                | Check **current and next** motor levels on both sides |
| **S1**    | End of lumbar key muscles         | Check **S1** motor only (no next level)               |

**Left motor check:**

- `checkMotorLevel(exam.left, motorLevel, nextMotorLevel, variable)` or
- `checkMotorLevelBeforeStartOfKeyMuscles(exam.left, level, nextMotorLevel, variable)` for C4 and L1

**Right motor check:**

- `checkMotorLevel(exam.right, motorLevel, nextMotorLevel, variable)` or
- `checkMotorLevelBeforeStartOfKeyMuscles(exam.right, level, nextMotorLevel, variable)` for C4 and L1

**Combine motor and sensory results** using `checkLevelWithMotor`:

| Condition                                           | Result                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Sensory already stopped (`!sensoryResult.continue`) | Propagate sensory result (stop)                                            |
| **Both motor sides** have level with `*`            | Add level + `*`, continue = left.continue AND right.continue               |
| **At least one motor side** has level               | Add level (+ `*` if variable), continue = left.continue AND right.continue |
| Sensory has level but no motor level                | Add level (+ `*` if variable), continue from motors                        |

**Accumulate variable from all checks:**

```
variable = variable || sensoryResult.variable || leftMotorResult.variable || rightMotorResult.variable
```

#### 5. Update state

After evaluation:

- **Variable:** `variable = variable || result.variable`
- **Add level:** If `result.level` exists, push to `listOfNLI`
- **Continue:** If `result.continue` is true, increment `currentIndex` and set `next = checkLevel`
- **Stop:** If `result.continue` is false, set `next = null` (algorithm complete)

**Outputs:**

- `listOfNLI` (updated with new level if qualified)
- `variable` (accumulated from all bilateral checks)
- `currentIndex` (advanced if continuing)
- `next` (either `checkLevel` or `null`)

**Next step:** `checkLevel` again if continuing; otherwise `null` (done).

**Clinical note:** The bilateral requirement means that a deficit on either side will stop the iteration and establish the NLI at the previous level. The asterisk (`*`) indicates that non-testable or variable values were present during the evaluation.

---

## Algorithm Flow (Text Diagram)

```
initializeNLIIteration
    └─ listOfNLI=[], variable=false, currentIndex=0 → checkLevel(C1)

checkLevel (iterates C1 → C2 → ... → S4_5)
    │
    ├─ At S4_5 (no nextLevel)?
    │   └─ Add INT (or INT*) → DONE
    │
    ├─ Check bilateral sensory
    │   ├─ leftSensoryResult = checkSensoryLevel(left, level, nextLevel)
    │   └─ rightSensoryResult = checkSensoryLevel(right, level, nextLevel)
    │
    ├─ Sensory-only region (C1-C3, T2-T12, S2-S3)?
    │   └─ result = checkLevelWithoutMotor(level, left, right)
    │       ├─ Both sides have level with * → level + *
    │       ├─ At least one side has level → level (+ * if variable)
    │       └─ continue = left.continue AND right.continue
    │
    └─ Motor region (C4-T1, L1-S1)?
        ├─ sensoryResult = checkLevelWithoutMotor(level, left, right)
        │
        ├─ Check bilateral motor
        │   ├─ Map to motorLevel and nextMotorLevel
        │   │
        │   ├─ C4 or L1? (before key muscles)
        │   │   ├─ leftMotor = checkMotorLevelBeforeStartOfKeyMuscles(left, nextLevel)
        │   │   └─ rightMotor = checkMotorLevelBeforeStartOfKeyMuscles(right, nextLevel)
        │   │
        │   ├─ T1 or S1? (end of key muscles)
        │   │   ├─ leftMotor = checkMotorLevel(left, motorLevel, motorLevel)
        │   │   └─ rightMotor = checkMotorLevel(right, motorLevel, motorLevel)
        │   │
        │   └─ C5-C8, L2-L5? (key muscles)
        │       ├─ leftMotor = checkMotorLevel(left, motorLevel, nextMotorLevel)
        │       └─ rightMotor = checkMotorLevel(right, motorLevel, nextMotorLevel)
        │
        └─ result = checkLevelWithMotor(sensoryResult, leftMotor, rightMotor)
            ├─ Sensory stopped? → propagate sensory result (stop)
            ├─ Both motor sides have level with * → level + *
            ├─ At least one motor side has level → level (+ * if variable)
            └─ continue = left.continue AND right.continue

After each check:
    ├─ result.level exists?
    │   └─ Add result.level to listOfNLI
    │
    ├─ result.continue = true?
    │   ├─ currentIndex++
    │   └─ next = checkLevel (continue to next level)
    │
    └─ result.continue = false?
        └─ next = null (stop, NLI found)

Final result: listOfNLI.join(',')
    Examples: "C5", "T3*", "S3,INT", "INT*"
```

---

## Key Concepts for Clinicians

### 1. Bilateral Evaluation

**Both sides must be intact** for a level to qualify as the NLI:

| Scenario      | Left Side | Right Side | Result                         |
| ------------- | --------- | ---------- | ------------------------------ |
| Both intact   | Normal    | Normal     | Level added, continue          |
| One impaired  | Normal    | Impaired   | Stop, NLI is previous level    |
| Both impaired | Impaired  | Impaired   | Stop, NLI is previous level    |
| Variable      | NT or 0\* | Normal     | Level added with `*`, continue |

**Why bilateral?** The NLI represents the most reliable level of function. Requiring both sides ensures that the reported level truly has preserved bilateral neural pathways.

### 2. Sensory-Only Regions

Some levels have **no key motor muscles** and are evaluated by sensory function alone:

| Region             | Levels | Sensory Points                      | Motor Muscles            |
| ------------------ | ------ | ----------------------------------- | ------------------------ |
| **Upper cervical** | C1-C3  | C1 (no key point), C2-C3 dermatomes | None (above C5)          |
| **Thoracic**       | T2-T12 | T2-T12 dermatomes                   | None (between T1 and L2) |
| **Lower sacral**   | S2-S3  | S2-S3 dermatomes                    | None (below S1)          |

**Bilateral sensory check:**

- **Light touch (LT)** at the next level on both sides
- **Pin prick (PP)** at the next level on both sides
- Both modalities must be intact bilaterally for the level to qualify

**Example:** At C2, the algorithm checks:

- Left side: C3 light touch and C3 pin prick
- Right side: C3 light touch and C3 pin prick
- If all are normal (2) or not absent → C2 qualifies, continue to C3

### 3. Motor Regions

Levels with **key motor muscles** require both sensory and motor function to be intact bilaterally:

| Region       | Levels | Key Muscles                                        | Sensory Points   |
| ------------ | ------ | -------------------------------------------------- | ---------------- |
| **Cervical** | C4-T1  | C5 (elbow flexors) through T1 (hand intrinsics)    | C4-T1 dermatomes |
| **Lumbar**   | L1-S1  | L2 (hip flexors) through S1 (ankle plantarflexors) | L1-S1 dermatomes |

**Bilateral motor check:**

- **Current level motor** on both sides (e.g. at C5, check C5 motor bilaterally)
- **Next level motor** on both sides (when applicable)
- Motor grades ≥ 3 or not absent indicate preserved function

**Bilateral sensory + motor combination:**

1. Evaluate bilateral sensory (LT and PP at next level on both sides)
2. Evaluate bilateral motor (key muscles on both sides)
3. Combine: level qualifies only if **both sensory AND motor** are intact bilaterally

**Example:** At C5, the algorithm checks:

- **Sensory:** Left C6 LT/PP, Right C6 LT/PP
- **Motor:** Left C5 motor (elbow flexors), Right C5 motor
- If all are intact → C5 qualifies, continue to C6

### 4. Special Motor Cases

Four levels have **special motor evaluation rules**:

#### C4 (Before Cervical Key Muscles Start)

- C4 is before the first cervical key muscle (C5)
- **Motor check:** Evaluates the **C5 motor** (next level) bilaterally
- **Clinical rationale:** C4 qualifies if the next motor level (C5) shows preserved function

#### L1 (Before Lumbar Key Muscles Start)

- L1 is before the first lumbar key muscle (L2)
- **Motor check:** Evaluates the **L2 motor** (next level) bilaterally
- **Clinical rationale:** L1 qualifies if the next motor level (L2) shows preserved function

#### T1 (End of Cervical Key Muscles)

- T1 is the last cervical key muscle
- **Motor check:** Evaluates only the **T1 motor** (current level) bilaterally, no next level
- **Clinical rationale:** T1 is the boundary between cervical and thoracic regions; thoracic has no key muscles

#### S1 (End of Lumbar Key Muscles)

- S1 is the last lumbar key muscle
- **Motor check:** Evaluates only the **S1 motor** (current level) bilaterally, no next level
- **Clinical rationale:** S1 is the boundary before sacral sensory-only levels (S2-S3)

### 5. Variable Flag and Asterisk (\*)

The **asterisk (`*`)** indicates that non-testable or variable values were present during evaluation:

| Value | Meaning                               | Impact on NLI        |
| ----- | ------------------------------------- | -------------------- |
| `NT`  | Not testable (e.g. bandaged, sedated) | May add `*` to level |
| `0*`  | Absent with variable indicator        | May add `*` to level |
| `1*`  | Impaired with variable indicator      | May add `*` to level |
| `2*`  | Normal with variable indicator        | May add `*` to level |

**Accumulation:** The `variable` flag accumulates across **all bilateral checks**:

- Left sensory check
- Right sensory check
- Left motor check (when applicable)
- Right motor check (when applicable)

**When is `*` added?**

| Condition                                             | Result                     |
| ----------------------------------------------------- | -------------------------- |
| **Both sides** have level with `*` in their results   | Add level + `*`            |
| **At least one side** has level, variable flag is set | Add level + `*`            |
| Variable flag set from any bilateral check            | Propagates to final result |

**Examples:**

- `"C5*"` = C5 is the NLI, but some values were NT or variable
- `"INT*"` = All levels intact, but some values were NT or variable

**Clinical significance:** The asterisk alerts clinicians that the assessment was affected by non-testable or variable values, suggesting potential uncertainty or need for retesting.

### 6. INT (Intact)

**INT** is reported when the iteration reaches **S4_5** without finding any impairment:

| Result | Meaning                                                    | Clinical Significance                  |
| ------ | ---------------------------------------------------------- | -------------------------------------- |
| `INT`  | All levels C1-S4_5 intact, no variable values              | Complete neurological function         |
| `INT*` | All levels C1-S4_5 intact, some values were NT or variable | Appears intact, but assessment limited |

**What does INT mean?**

- **Bilateral sensory intact** at all dermatomes (C2-S4_5)
- **Bilateral motor intact** at all key muscles (C5-T1, L2-S1)
- No impairment found at any level
- Typically corresponds to **AIS E** (normal)

**When is INT\* used?**

- Patient has intact function but some values were not testable (e.g. bandages, sedation)
- Variable indicators were present during examination
- Suggests need for follow-up when conditions improve

### 7. Multiple Levels in Output

The NLI can report **multiple levels** when they qualify simultaneously:

| Output Example | Interpretation                           |
| -------------- | ---------------------------------------- |
| `"C5"`         | NLI is C5 (stopped at C6)                |
| `"C5,C6"`      | Both C5 and C6 added during iteration    |
| `"S3,INT"`     | S3 added, then reached S4_5 (all intact) |
| `"C5*"`        | NLI is C5 with variable values           |
| `"INT"`        | All levels intact, no variable values    |

**Why multiple levels?**

- The algorithm adds levels as it iterates
- Each level that meets bilateral criteria is added
- The output preserves the sequence of qualifying levels

**Clinical interpretation:**

- The **last level** in the list is typically the true NLI
- Earlier levels may represent the progression through intact levels
- For training and review, the full list shows the decision path

---

## Clinical Examples

### Example 1: Incomplete cervical injury

**Exam findings:**

- C1-C5: Bilateral sensory intact (LT=2, PP=2), bilateral motor intact (C5=5)
- C6: Left C7 sensation intact (LT=2, PP=2), Right C7 impaired (LT=1, PP=1)
- C6: Left C6 motor=4, Right C6 motor=2

**Algorithm execution:**

1. C1-C5: All bilateral checks pass → Add C1, C2, C3, C4, C5
2. C6: Left sensory intact, **right sensory impaired** → Bilateral sensory fails
3. Stop iteration

**Result:** `"C5"` (NLI is C5, stopped at C6 due to right-side sensory impairment)

### Example 2: Complete thoracic injury

**Exam findings:**

- C1-T3: All bilateral sensory intact
- T4: Bilateral T5 sensation absent (LT=0, PP=0)

**Algorithm execution:**

1. C1-T3: All bilateral sensory checks pass → Add C1 through T3
2. T4: **Both sides** have absent sensation at T5 → Stop iteration

**Result:** `"T3"` (NLI is T3, stopped at T4 due to bilateral sensory loss)

### Example 3: Variable values

**Exam findings:**

- C1-C5: Bilateral sensory intact, bilateral motor intact
- C6: Left side intact, Right C7 sensation **NT** (bandaged)
- C6: Left C6 motor=5, Right C6 motor=NT

**Algorithm execution:**

1. C1-C5: All checks pass, no variable → Add C1, C2, C3, C4, C5
2. C6: Right sensory has **NT** → Set variable=true
3. C6: Right motor has **NT** → Accumulate variable
4. Result has level (from left side), variable=true → Add C6\*
5. Continue not possible (NT values) → Stop

**Result:** `"C6*"` (NLI is C6, but right side was not testable)

### Example 4: Intact neurological function

**Exam findings:**

- All levels C1-S4_5: Bilateral sensory intact, bilateral motor intact (where applicable)

**Algorithm execution:**

1. C1-S3: All bilateral checks pass → Add all levels
2. Reach S4_5 (no nextLevel) → Add INT

**Result:** `"INT"` (All levels intact, no impairment found)

---

## References

### ISNCSCI Standards

- **ISNCSCI:** International Standards for Neurological Classification of Spinal Cord Injury (revised 2019)
- **ASIA:** American Spinal Injury Association
- **Official website:** [https://asia-spinalinjury.org](https://asia-spinalinjury.org)

### Key Terminology

| Term                         | Definition                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| **NLI**                      | Neurological Level of Injury: most caudal segment with intact bilateral sensory and motor function |
| **Key sensory points**       | Specific dermatomes tested for light touch and pin prick (C2-S4_5)                                 |
| **Key muscles**              | Specific myotomes tested for motor function (C5-T1, L2-S1)                                         |
| **Dermatome**                | Area of skin innervated by sensory fibers from a single spinal nerve root                          |
| **Myotome**                  | Group of muscles innervated by motor fibers from a single spinal nerve root                        |
| **Bilateral evaluation**     | Assessment requiring intact function on both left and right sides                                  |
| **AIS**                      | ASIA Impairment Scale: classification from A (complete) to E (normal)                              |
| **LT**                       | Light touch (sensory modality)                                                                     |
| **PP**                       | Pin prick (sensory modality)                                                                       |
| **NT**                       | Not testable (value could not be assessed)                                                         |
| **INT**                      | Intact (all levels have preserved bilateral function)                                              |
| **Variable indicator (`*`)** | Indicates non-testable or variable values affected the assessment                                  |

### Algorithm Fidelity

This step-based implementation preserves the exact logic of the ISNCSCI standard:

- Same bilateral evaluation rules
- Same sensory-only vs motor region dispatch
- Same special cases for C4, L1, T1, S1
- Same variable accumulation logic
- Same INT handling at S4_5
- No algorithm behavior is modified; only the control flow is made explicit

### Clinical Value of Step-Based Approach

The step-based pattern provides unique benefits for clinical practice:

1. **Transparency:** Clinicians can see exactly how the NLI was determined
2. **Education:** Training programs can walk through each decision point
3. **Auditing:** Complex cases can be reviewed step-by-step
4. **Trust:** Algorithm logic is visible and verifiable
5. **Debugging:** When results are unexpected, the step chain reveals why

### Related Modules

- **Motor Level:** Determines motor level separately for left and right sides
- **Sensory Level:** Determines sensory level separately for left and right sides
- **AIS Classification:** Uses NLI as input for determining impairment scale
- **Zone of Partial Preservation:** Identifies preserved function caudal to NLI

---

## For Developers

### Main Entry Points

```typescript
// Direct calculation (returns comma-separated string)
const nli = determineNeurologicalLevelOfInjury(exam);
// Example outputs: "C5", "T3*", "S3,INT", "INT*"

// Step-by-step generator (for UI display)
for (const step of neurologicalLevelOfInjurySteps(exam)) {
  console.log(step.description); // Clinician-friendly description
  console.log(step.actions); // Actions taken in this step
  console.log(step.state); // Current state (listOfNLI, variable, etc.)
}
```

### State Structure

```typescript
type NeurologicalLevelOfInjuryState = {
  exam: Exam; // Complete exam data (left and right sides)
  listOfNLI: string[]; // Levels added during iteration (e.g. ['C1', 'C2', 'C3*'])
  variable: boolean; // Accumulated from all bilateral checks
  currentIndex: number; // Index into SensoryLevels array (0=C1, 1=C2, ...)
};
```

### Check Functions

The module imports and reuses check functions from other modules:

- **checkSensoryLevel** (from `neurologicalLevels/sensoryLevel.ts`): Evaluates bilateral sensory
- **checkMotorLevel** (from `neurologicalLevels/motorLevel.ts`): Evaluates bilateral motor
- **checkMotorLevelBeforeStartOfKeyMuscles** (from `neurologicalLevels/motorLevel.ts`): Special case for C4, L1

The module defines two combination functions:

- **checkLevelWithoutMotor**: Combines bilateral sensory results for sensory-only regions
- **checkLevelWithMotor**: Combines bilateral sensory and motor results for motor regions

### Testing

The refactored module passes all existing tests without modification. Key test scenarios include:

- Sensory-only regions (C1-C3, T2-T12, S2-S3)
- Motor regions (C4-T1, L1-S1)
- Special motor cases (C4, L1, T1, S1)
- Variable flag accumulation
- Multiple levels output
- INT and INT\* handling
- Early termination on impairment

---

**End of documentation**
